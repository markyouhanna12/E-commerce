import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { OrderStatusEnum } from 'src/Common/Enums/order.enums';

@Schema({
  timestamps: true,
  _id: false,
})
export class OrderItem {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  })
  product!: string;

  @Prop({
    type: Number,
    required: true,
  })
  quantity!: number;

  @Prop({
    type: Number,
    required: true,
  })
  priceSnapshot!: number;
}

export class ShippingAddress {
  @Prop({
    type: String,
    required: true,
  })
  city!: string;

  @Prop({
    type: Number,
    required: true,
  })
  postalCode!: number;

  @Prop({
    type: String,
    required: true,
  })
  region!: string;
}

export class Order {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  })
  user!: string;

  @Prop({
    type: [OrderItem],
    required: true,
  })
  items!: OrderItem[];

  @Prop({
    type: Number,
    required: true,
  })
  subTotal!: number;

  @Prop({
    type: Number,
    default: 0,
  })
  discountAmount!: number;

  @Prop({
    type: Number,
    required: true,
  })
  finalPrice!: number;

  @Prop({
    type: String,
    enum: Object.values(OrderStatusEnum),
    default: OrderStatusEnum.PENDING,
  })
  status!: string;

  @Prop({
    type: String,
    required: true,
  })
  shippingAddress!: ShippingAddress;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
  })
  appliedCoupon!: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

export type HOrderDocument = HydratedDocument<Order>;

export const OrderModel = MongooseModule.forFeature([
  {
    name: 'Order',
    schema: OrderSchema,
  },
]);
