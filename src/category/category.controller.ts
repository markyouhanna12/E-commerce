import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/Common/Utils/multer.utils';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createCategoryDto: CreateCategoryDto,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('A category logo Image file is required');
    }
    const logoUrl = `http://localhost:3000/${file.path.replace(/\\/g, '/')}`;
    const adminId = req.user._id;

    return this.categoryService.create(createCategoryDto, logoUrl, adminId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async update(
    @UploadedFile() file: Express.Multer.File,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Param('id') id: string,
  ) {
    let logoUrl: string | undefined;
    if (file) {
      logoUrl = `http://localhost:3000/${file.path.replace(/\\/g, '/')}`;
    }

    return this.categoryService.update(updateCategoryDto, logoUrl, id);
  }
}
