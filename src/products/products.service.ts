import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, SortOrder } from 'mongoose';
import { Brand, HBrandDocument } from 'src/DB/Models/brand.model';
import { Category, HCategoryDocument } from 'src/DB/Models/category.model';
import { HProductDocument, Product } from 'src/DB/Models/products.model';
import { HUserDocument, User } from 'src/DB/Models/user.model';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<HProductDocument>,
    @InjectModel(Brand.name) private readonly brandModel: Model<HBrandDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<HCategoryDocument>,
    @InjectModel(User.name) private readonly userModel: Model<HUserDocument>,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                               PRIVATE HELPERS                              */
  /* -------------------------------------------------------------------------- */

  private async validateCategory(categoryId: string): Promise<void> {
    const category = await this.categoryModel.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found.`);
    }
  }

  private async validateBrand(brandId: string): Promise<void> {
    const brand = await this.brandModel.findById(brandId);

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${brandId} not found.`);
    }
  }

  private async validateBrandCategoryRelationship(
    brandId: string,
    categoryId: string,
  ): Promise<void> {
    await this.validateCategory(categoryId);
    await this.validateBrand(brandId);

    const brand = await this.brandModel.findById(brandId);

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${brandId} not found.`);
    }

    const categories = brand.categories.map((id) => id.toString());

    if (!categories.includes(categoryId)) {
      throw new BadRequestException(
        'Selected category does not belong to this brand.',
      );
    }
  }

  private async checkDuplicateName(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const query: QueryFilter<Product> = {
      name: {
        $regex: new RegExp(`^${name}$`, 'i'),
      },
      isDeleted: false,
    };
    if (excludeId) {
      query._id = {
        $ne: excludeId,
      };
    }
    const exists = await this.productModel.findOne(query);
    if (exists) {
      throw new ConflictException('Product name already exists.');
    }
  }

  private async getProductOrThrow(id: string): Promise<HProductDocument> {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found.`);
    }
    return product;
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Main Functions                           */
  /* -------------------------------------------------------------------------- */

  async create(dto: CreateProductDto, imageUrls: string[], adminId: string) {
    await this.checkDuplicateName(dto.name);

    await this.validateCategory(dto.category);

    if (dto.brand) {
      await this.validateBrandCategoryRelationship(dto.brand, dto.category);
    }
    const product = new this.productModel({
      ...dto,
      images: imageUrls,
      createdBy: adminId,
    });
    await product.save();
    await product.populate([
      {
        path: 'brand',
      },
      {
        path: 'category',
      },
      {
        path: 'createdBy',
        select: '-password',
      },
    ]);

    return {
      message: 'Product created successfully.',
      product,
    };
  }

  async findAll(query: GetProductsDto) {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      sort = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '10',
    } = query;

    const filter: QueryFilter<Product> = {
      isDeleted: false,
    };
    if (search) {
      filter.name = {
        $regex: search,
        options: 'i',
      };
    }
    if (category) {
      filter.category = category;
    }
    if (brand) {
      filter.brand = brand;
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }
    if (inStock) {
      filter.stock = {
        $gt: 0,
      };
    }
    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    const sortObject: Record<string, SortOrder> = {
      [sort]: order === 'asc' ? 1 : -1,
    };

    const [products, totalItems] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('brand')
        .populate('category')
        .populate('createdBy', '-password')
        .sort(sortObject)
        .skip(skip)
        .limit(pageSize),

      this.productModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);
    return {
      message: 'Products retrieved successfully.',
      data: products,
      pagination: {
        page: currentPage,
        limit: pageSize,
        totalItems,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    };
  }

  async findOne(id: string) {
    const product = await this.productModel
      .findOne({
        _id: id,
        isDeleted: false,
      })
      .populate('brand')
      .populate('category')
      .populate('createdBy', '-password');

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found.`);
    }

    return {
      message: 'Product retrieved successfully.',
      product,
    };
  }

  async update(id: string, dto: UpdateProductDto, imageUrls?: string[]) {
    const existingProduct = await this.getProductOrThrow(id);

    if (
      dto.name &&
      dto.name.toLowerCase() !== existingProduct.name.toLowerCase()
    ) {
      await this.checkDuplicateName(dto.name, id);
    }
    if (dto.category) {
      await this.validateCategory(dto.category);
    }
    const brandId = dto.brand ?? existingProduct.brand?.toString();
    const categoryId = dto.category ?? existingProduct.category?.toString();
    if (brandId) {
      await this.validateBrandCategoryRelationship(brandId, categoryId);
    }

    const updatePayload: Partial<Product> = {
      ...dto,
    };
    if (imageUrls?.length) {
      updatePayload.images = imageUrls;
    }
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updatePayload, {
        new: true,
        runValidators: true,
      })
      .populate('brand')
      .populate('category')
      .populate('createdBy', '-password');

    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found.`);
    }
    return {
      message: 'Product updated successfully.',
      product: updatedProduct,
    };
  }

  async softDelete(id: string, adminId: string) {
    const product = await this.getProductOrThrow(id);
    if (product.isDeleted) {
      throw new BadRequestException('Product is already deleted.');
    }
    product.isDeleted = true;
    product.deletedAt = new Date();
    product.deletedBy = adminId;

    await product.save();
    await product.populate([
      {
        path: 'brand',
      },
      {
        path: 'category',
      },
      {
        path: 'createdBy',
        select: '-password',
      },
      {
        path: 'deletedBy',
        select: '-password',
      },
    ]);

    return {
      message: 'Product deleted successfully.',
      product,
    };
  }

  async restore(id: string) {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found.`);
    }

    if (!product.isDeleted) {
      throw new BadRequestException('Product is already active.');
    }

    product.isDeleted = false;
    product.deletedAt = null;
    product.deletedBy = null;

    await product.save();
    await product.populate([
      {
        path: 'brand',
      },
      {
        path: 'category',
      },
      {
        path: 'createdBy',
        select: '-password',
      },
    ]);

    return {
      message: 'Product restored successfully.',
      product,
    };
  }

  async hardDelete(id: string) {
    const product = await this.productModel.findByIdAndDelete(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found.`);
    }

    return {
      message: 'Product permanently deleted.',
    };
  }
}
