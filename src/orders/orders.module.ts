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
import { PaymentService } from 'src/Common/Services/payment/payment.service';

@Module({
  imports: [CartModel, ProductModel, CouponModel, OrderModel, UserModel],
  controllers: [OrdersController],
  providers: [OrdersService, TokenService, JwtService, PaymentService],
})
export class OrdersModule {}
