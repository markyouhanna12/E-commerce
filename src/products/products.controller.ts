import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/Common/Utils/multer.utils';
import { Request } from 'express';
import { CreateProductDto } from './dto/create-product.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RoleEnum } from 'src/Common/Enums/user.enums';
import { GetProductsDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10, multerOptions))
  async create(
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateProductDto,
  ) {
    const adminId = req.user._id;
    const imageUrls = files.map(
      (file) => `http://localhost:3000/${file.path.replace(/\\/g, '/')}`,
    );
    return this.productsService.create(dto, imageUrls, adminId);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async findAll(@Query() query: GetProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10, multerOptions))
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UpdateProductDto,
  ) {
    let imageUrls: string[] | undefined;
    if (files && files.length > 0) {
      imageUrls = files.map(
        (file) => `http://localhost:3000/${file.path.replace(/\\/g, '/')}`,
      );
    }
    return this.productsService.update(id, dto, imageUrls);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async softDelete(@Req() req: any, @Param('id') id: string) {
    const adminId = req.user._id;

    return this.productsService.softDelete(id, adminId);
  }

  @Patch(':id/restore')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async restore(@Param('id') id: string) {
    return this.productsService.restore(id);
  }

  @Delete(':id/hard')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async hardDelete(@Param('id') id: string) {
    return this.productsService.hardDelete(id);
  }
}
