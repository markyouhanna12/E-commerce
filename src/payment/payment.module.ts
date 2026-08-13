import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentsService } from './payment.service';
import { CartModel } from 'src/DB/Models/cart.model';
import { ProductModel } from 'src/DB/Models/products.model';
import { CouponModel } from 'src/DB/Models/coupon.model';
import { OrderModel } from 'src/DB/Models/order.model';
import { UserModel } from 'src/DB/Models/user.model';
import { StripeService } from 'src/Common/Services/payment/payment.service';
import { TokenService } from 'src/Common/Tokens/token.service';
import { JwtService } from '@nestjs/jwt';
import { InvoiceModule } from 'src/invoice/invoice.module';

@Module({
  imports: [
    CartModel,
    ProductModel,
    CouponModel,
    OrderModel,
    UserModel,
    InvoiceModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentsService, StripeService, TokenService, JwtService],
})
export class PaymentModule {}
