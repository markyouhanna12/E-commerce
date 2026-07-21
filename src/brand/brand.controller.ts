import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BrandService } from './brand.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/Common/Utils/multer.utils';
import { CreateBrandDto } from './dto/create-brand.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RoleEnum } from 'src/Common/Enums/user.enums';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  async findAll() {
    return this.brandService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.brandService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createBrandDto: CreateBrandDto,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('A category logo Image file is required');
    }
    const logoUrl = `http://localhost:3000/${file.path.replace(/\\/g, '/')}`;
    const adminId = req.user._id;

    return this.brandService.create(createBrandDto, logoUrl, adminId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async update(
    @UploadedFile() file: Express.Multer.File,
    @Body() updateBrandDto: UpdateBrandDto,
    @Param('id') id: string,
  ) {
    let logoUrl: string | undefined;
    if (file) {
      logoUrl = `http://localhost:3000/${file.path.replace(/\\/g, '/')}`;
    }

    return this.brandService.update(updateBrandDto, id, logoUrl);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async delete(@Param('id') brandId: string, @Req() req: any) {
    const adminId = req.user._id;
    return this.brandService.delete(brandId, adminId);
  }

  @Patch(':id/restore')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async restore(@Param('id') id: string) {
    return this.brandService.restore(id);
  }
}
