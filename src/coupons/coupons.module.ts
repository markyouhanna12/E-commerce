import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { CouponModel } from 'src/DB/Models/coupon.model';

@Module({
  imports: [CouponModel],
  controllers: [CouponsController],
  providers: [CouponsService],
})
export class CouponsModule {}
