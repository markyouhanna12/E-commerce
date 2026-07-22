import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Brand, HBrandDocument } from 'src/DB/Models/brand.model';
import { CreateBrandDto } from './dto/create-brand.dto';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Category, HCategoryDocument } from 'src/DB/Models/category.model';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand.name)
    private readonly brandModel: Model<HBrandDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<HCategoryDocument>,
  ) {}

  private async validateCategoriesExist(categoryIds: string[]): Promise<void> {
    if (!categoryIds?.length) {
      return;
    }
    const count = await this.categoryModel.countDocuments({
      _id: { $in: categoryIds },
      isDeleted: false,
    });
    if (count !== categoryIds.length) {
      throw new BadRequestException('One or more category IDs do not exist.');
    }
  }
  private async findBrandOrFail(id: string): Promise<HBrandDocument> {
    const brand = await this.brandModel.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found.');
    }
    return brand;
  }

  private async findActiveBrandByName(
    name: string,
  ): Promise<HBrandDocument | null> {
    return this.brandModel.findOne({
      name: name.trim(),
      isDeleted: false,
    });
  }

  async create(dto: CreateBrandDto, logoUrl: string, adminId: string) {
    await this.validateCategoriesExist(dto.categories);

    const existing = await this.findActiveBrandByName(dto.name);

    if (existing) {
      throw new ConflictException('the Brand is already Exists');
    }

    const newBrand = await this.brandModel.create({
      ...dto,
      logo: logoUrl,
      createdBy: adminId,
    });

    return {
      message: 'Brand created successfully.',
      newBrand,
    };
  }

  async update(dto: UpdateBrandDto, id: string, logoUrl?: string | undefined) {
    const brand = await this.findBrandOrFail(id);
    if (dto.categories) {
      await this.validateCategoriesExist(dto.categories);
    }

    // Update only the provided fields
    if (dto.name !== undefined) {
      brand.name = dto.name;
    }

    if (dto.categories !== undefined) {
      brand.categories = dto.categories;
    }

    if (logoUrl) {
      brand.logo = logoUrl;
    }

    await brand.save();

    return {
      message: 'Brand updated successfully.',
      brand,
    };
  }

  async findAll() {
    return this.brandModel
      .find({
        isDeleted: false,
        deletedBy: { $exists: false },
      })
      .populate('createdBy', 'firstName lastName email')
      .populate('categories', 'name');
  }

  async findById(id: string) {
    const brand = await this.brandModel
      .findOne({
        _id: id,
        isDeleted: false,
        deletedBy: { $exists: false },
      })
      .populate('createdBy')
      .populate('categories', 'name');

    if (!brand) {
      throw new NotFoundException('Brand Not Found');
    }
    return brand;
  }

  async delete(id: string, adminId: string) {
    const brand = await this.findBrandOrFail(id);

    if (brand.isDeleted) {
      throw new ConflictException('Brand is already deleted');
    }

    brand.isDeleted = true;
    brand.deletedBy = adminId;

    await brand.save();

    return { message: 'Brand deleted successfully' };
  }

  async restore(id: string) {
    const brand = await this.brandModel.findByIdAndUpdate(id, {
      $unset: { deletedBy: true },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (!brand.isDeleted) {
      throw new ConflictException('Brand is already active');
    }

    brand.isDeleted = false;
    await brand.save();
    return {
      message: 'Brand restored successfully',
      brand,
    };
  }
}
