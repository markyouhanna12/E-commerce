import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { UserModel } from 'src/DB/Models/user.model';
import { CategoryModel } from 'src/DB/Models/category.model';
import { TokenService } from 'src/Common/Tokens/token.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [UserModel, CategoryModel],
  controllers: [CategoryController],
  providers: [CategoryService, TokenService, JwtService],
})
export class CategoryModule {}
