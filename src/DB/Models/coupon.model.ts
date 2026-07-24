import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { ref } from 'process';

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

@Schema({
  timestamps: true,
})
export class Coupon {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  })
  code!: string;

  @Prop({
    required: true,
  })
  name!: string;

  @Prop({
    default: '',
  })
  description!: string;

  @Prop({
    enum: CouponType,
    required: true,
  })
  type!: CouponType;

  @Prop({
    required: true,
  })
  value!: number;

  @Prop({
    default: true,
  })
  isActive!: boolean;

  @Prop({
    required: true,
  })
  expiresAt!: Date;

  @Prop({
    default: 0,
  })
  usedCount!: number;

  @Prop({
    default: 1,
  })
  maxUses!: number;

  @Prop({
    default: 1,
  })
  maxUsesPerUser!: number;

  @Prop({
    default: 0,
  })
  minimumPurchase!: number;

  @Prop({
    default: 0,
  })
  maximumDiscount!: number;

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  ])
  products!: mongoose.Types.ObjectId[];

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
  ])
  categories!: mongoose.Types.ObjectId[];

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
    },
  ])
  brands!: mongoose.Types.ObjectId[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  createdBy!: mongoose.Types.ObjectId;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

export type HCouponDocument = HydratedDocument<Coupon>;

export const CouponModel = MongooseModule.forFeature([
  {
    name: 'Coupon',
    schema: CouponSchema,
  },
]);
