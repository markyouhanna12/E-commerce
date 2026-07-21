import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { UserModel } from 'src/DB/Models/user.model';
import { BrandModel } from 'src/DB/Models/brand.model';
import { CategoryModel } from 'src/DB/Models/category.model';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from 'src/Common/Tokens/token.service';

@Module({
  imports: [UserModel, CategoryModel, BrandModel],
  controllers: [BrandController],
  providers: [BrandService, JwtService, TokenService],
})
export class BrandModule {}
