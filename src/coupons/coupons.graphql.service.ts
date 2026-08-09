import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Coupon, HCouponDocument } from 'src/DB/Models/coupon.model';

@Injectable()
export class CouponsGraphqlService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<HCouponDocument>,
  ) {}

  async findAllCoupons() {
    const coupons = await this.couponModel
      .find()
      .populate('createdBy', 'firstName lastName email')
      .populate('products', 'title')
      .populate('categories', 'name')
      .populate('brands', 'name');

    return {
      success: true,
      results: coupons.length,
      data: coupons,
    };
  }
}
