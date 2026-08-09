import { Query, Resolver } from '@nestjs/graphql';
import { CouponsGraphqlService } from '../coupons.graphql.service';

import { CouponResponseType } from './types/coupon-response.type';

@Resolver()
export class CouponsResolver {
  constructor(private readonly couponsGraphqlService: CouponsGraphqlService) {}

  @Query(() => CouponResponseType)
  async findAllCoupons() {
    return await this.couponsGraphqlService.findAllCoupons();
  }
}
