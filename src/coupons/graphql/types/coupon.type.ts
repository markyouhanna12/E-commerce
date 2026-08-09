import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CouponType {
  @Field()
  _id!: string;

  @Field()
  code!: string;

  @Field()
  name!: string;

  @Field()
  description!: string;

  @Field()
  type!: string;

  @Field(() => Float)
  value!: number;

  @Field()
  isActive!: boolean;

  @Field()
  expiresAt!: Date;

  @Field()
  usedCount!: number;

  @Field()
  maxUses!: number;

  @Field()
  maxUsesPerUser!: number;

  @Field(() => Float)
  minimumPurchase!: number;

  @Field(() => Float)
  maximumDiscount!: number;
}
