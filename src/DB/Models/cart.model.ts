import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: false })
export class CartItem {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  product!: string;

  @Prop({
    type: Number,
    required: true,
    min: 1,
    default: 1,
  })
  quantity!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  pricePerUnit!: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  SubTotal!: number;
}

@Schema({
  timestamps: true,
})
export class Cart {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user!: string;

  @Prop({
    type: [CartItem],
    default: [],
  })
  items!: CartItem[];

  @Prop({
    type: Number,
    default: 0,
  })
  subTotal!: number;

  @Prop({
    type: Number,
    default: 0,
  })
  discount!: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null,
  })
  coupon?: Types.ObjectId | null;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  totalPrice!: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

export type HCartDocument = HydratedDocument<Cart>;

export const CartModel = MongooseModule.forFeature([
  {
    name: 'Cart',
    schema: CartSchema,
  },
]);
