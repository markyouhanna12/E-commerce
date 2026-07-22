import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from 'src/Common/Tokens/token.service';
import { ProductModel } from 'src/DB/Models/products.model';
import { BrandModel } from 'src/DB/Models/brand.model';
import { CategoryModel } from 'src/DB/Models/category.model';
import { UserModel } from 'src/DB/Models/user.model';

@Module({
  imports: [UserModel, CategoryModel, BrandModel, ProductModel],
  controllers: [ProductsController],
  providers: [ProductsService, JwtService, TokenService],
})
export class ProductsModule {}
