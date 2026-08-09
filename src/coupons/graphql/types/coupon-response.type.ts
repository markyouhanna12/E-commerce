import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CouponType } from './coupon.type';

@ObjectType()
export class CouponResponseType {
  @Field()
  success!: boolean;

  @Field(() => Int)
  results!: number;

  @Field(() => [CouponType])
  data!: CouponType[];
}
