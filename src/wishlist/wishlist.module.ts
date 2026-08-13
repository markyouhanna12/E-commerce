import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { WishlistModel } from 'src/DB/Models/wishlist.model';
import { ProductModel } from 'src/DB/Models/products.model';
import { UserModel } from 'src/DB/Models/user.model';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from 'src/Common/Tokens/token.service';

@Module({
  imports: [WishlistModel, ProductModel, UserModel],
  controllers: [WishlistController],
  providers: [WishlistService, JwtService, TokenService],
})
export class WishlistModule {}
