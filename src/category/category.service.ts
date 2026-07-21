import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, HCategoryDocument } from 'src/DB/Models/category.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<HCategoryDocument>,
  ) {}

  async create(dto: CreateCategoryDto, logoUrl: string, adminId: string) {
    const category = await this.categoryModel.findOne({
      name: dto.name,
    });
    if (category && !category.isDeleted) {
      throw new ConflictException('Category already exists');
    }

    if (category && category.isDeleted) {
      throw new ConflictException(
        'A deleted category with this name already exists. Restore it instead.',
      );
    }

    const newCategory = await this.categoryModel.create({
      ...dto,
      logo: logoUrl,
      createdBy: adminId,
    });

    return newCategory.save();
  }

  async update(
    dto: UpdateCategoryDto,
    logoUrl: string | undefined,
    id: string,
  ): Promise<Category> {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Update only the provided fields
    if (dto.name !== undefined) {
      category.name = dto.name;
    }

    if (logoUrl) {
      category.logo = logoUrl;
    }

    await category.save();

    return category;
  }

  async findAll() {
    return this.categoryModel
      .find({
        isDeleted: false,
      })
      .populate('createdBy', 'firstName lastName email');
  }

  async findById(id: string) {
    const category = await this.categoryModel
      .findOne({
        _id: id,
        isDeleted: false,
      })
      .populate('createdBy');

    if (!category) {
      throw new NotFoundException('Category Not Found');
    }
    return category;
  }

  async delete(id: string) {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (category.isDeleted) {
      throw new ConflictException('Category is already deleted');
    }
    category.isDeleted = true;
    await category.save();

    return { message: 'Category deleted successfully' };
  }

  async restore(id: string) {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.isDeleted) {
      throw new ConflictException('Category is already active');
    }

    category.isDeleted = false;
    await category.save();
    return {
      message: 'Category restored successfully',
    };
  }
}
