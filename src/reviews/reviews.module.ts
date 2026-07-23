import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { ProductModel } from 'src/DB/Models/products.model';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from 'src/Common/Tokens/token.service';
import { ReviewModel } from 'src/DB/Models/review.model';
import { UserModel } from 'src/DB/Models/user.model';

@Module({
  imports: [ReviewModel, ProductModel, UserModel],
  controllers: [ReviewsController],
  providers: [ReviewsService, JwtService, TokenService],
})
export class ReviewsModule {}
