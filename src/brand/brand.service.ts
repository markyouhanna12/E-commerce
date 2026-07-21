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

  private async validateCategoriesExists(categoriesIds: string[]) {
    if (categoriesIds && categoriesIds.length == 0) {
      return;
    }
    const existingCategories = await this.categoryModel.countDocuments({
      _id: { $in: categoriesIds },
    });
    if (existingCategories !== categoriesIds.length) {
      throw new BadRequestException(
        'One or more assigned categories IDs not exists in database',
      );
    }
  }

  async create(dto: CreateBrandDto, logoUrl: string, adminId: string) {
    await this.validateCategoriesExists(dto.categories);

    const brand = await this.brandModel.findOne({
      name: dto.name,
    });
    if (brand && !brand.isDeleted && !brand.deletedBy) {
      throw new ConflictException('Brand already exists');
    }

    if (brand && brand.isDeleted && brand.deletedBy) {
      throw new ConflictException(
        'A deleted brand with this name already exists. Restore it instead.',
      );
    }

    const newBrand = await this.brandModel.create({
      ...dto,
      logo: logoUrl,
      createdBy: adminId,
    });

    return newBrand.save();
  }

  async update(
    dto: UpdateBrandDto,
    id: string,
    logoUrl?: string | undefined,
  ): Promise<Brand> {
    if (dto.categories) {
      await this.validateCategoriesExists(dto.categories);
    }
    const brand = await this.brandModel.findById(id);

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    // Update only the provided fields
    if (dto.name !== undefined) {
      brand.name = dto.name;
    }

    if (logoUrl) {
      brand.logo = logoUrl;
    }

    await brand.save();

    return brand;
  }

  async findAll() {
    return this.brandModel
      .find({
        isDeleted: false,
        deletedBy: { $exists: false },
      })
      .populate('createdBy', 'firstName lastName email');
  }

  async findById(id: string) {
    const brand = await this.brandModel
      .findOne({
        _id: id,
        isDeleted: false,
        deletedBy: { $exists: false },
      })
      .populate('createdBy');

    if (!brand) {
      throw new NotFoundException('Brand Not Found');
    }
    return brand;
  }

  async delete(id: string, adminId: string) {
    const brand = await this.brandModel.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
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
    };
  }
}
