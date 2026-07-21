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
      name: CreateCategoryDto.name,
    });
    if (category) {
      throw new ConflictException('Category already exists');
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
      .find()
      .populate('createdBy', 'firstName lastName email');
  }

  async findById(id: string) {
    const category = await this.categoryModel
      .findById(id)
      .populate('createdBy');

    if (!category) {
      throw new NotFoundException('Category Not Found');
    }
    return category;
  }
}
