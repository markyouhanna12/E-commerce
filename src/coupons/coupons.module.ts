import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { CouponModel } from 'src/DB/Models/coupon.model';
import { CartModel } from 'src/DB/Models/cart.model';
import { ProductModel } from 'src/DB/Models/products.model';
import { TokenService } from 'src/Common/Tokens/token.service';
import { JwtService } from '@nestjs/jwt';
import { UserModel } from 'src/DB/Models/user.model';

@Module({
  imports: [CouponModel, CartModel, ProductModel, UserModel],
  controllers: [CouponsController],
  providers: [CouponsService, TokenService, JwtService],
})
export class CouponsModule {}
