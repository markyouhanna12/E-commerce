import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { ProductModel } from 'src/DB/Models/products.model';
import { CartModel } from 'src/DB/Models/cart.model';
import { TokenService } from 'src/Common/Tokens/token.service';
import { JwtService } from '@nestjs/jwt';
import { UserModel } from 'src/DB/Models/user.model';

@Module({
  imports: [ProductModel, CartModel, UserModel],
  controllers: [CartController],
  providers: [CartService, TokenService, JwtService],
})
export class CartModule {}
