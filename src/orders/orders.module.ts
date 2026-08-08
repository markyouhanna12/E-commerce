import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from 'src/Common/Tokens/token.service';
import { CartModel } from 'src/DB/Models/cart.model';
import { ProductModel } from 'src/DB/Models/products.model';
import { CouponModel } from 'src/DB/Models/coupon.model';
import { OrderModel } from 'src/DB/Models/order.model';
import { UserModel } from 'src/DB/Models/user.model';

@Module({
  imports: [CartModel, ProductModel, CouponModel, OrderModel, UserModel],
  controllers: [OrdersController],
  providers: [OrdersService, TokenService, JwtService],
})
export class OrdersModule {}
