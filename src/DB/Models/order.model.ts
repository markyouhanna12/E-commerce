import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import {
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
} from 'src/Common/Enums/order.enums';

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
  product!: Types.ObjectId;

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

@Schema({ _id: false })
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

export const ShippingAddressSchema =
  SchemaFactory.createForClass(ShippingAddress);

@Schema({
  timestamps: true,
})
export class Order {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  })
  user!: Types.ObjectId;

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
    type: ShippingAddressSchema,
    required: true,
  })
  shippingAddress!: ShippingAddress;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
  })
  appliedCoupon!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethodEnum),
    default: PaymentMethodEnum.CASH_ON_DELIVERY,
  })
  paymentMethod!: string;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatusEnum),
    default: PaymentStatusEnum.PENDING,
  })
  paymentStatus!: PaymentStatusEnum;

  @Prop({
    type: String,
  })
  stripeSessionId?: string;

  @Prop({
    type: String,
  })
  intentId!: string;

  @Prop({
    type: String,
  })
  refundId!: string;

  @Prop({
    type: Date,
  })
  refundAt!: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

export type HOrderDocument = HydratedDocument<Order>;

export const OrderModel = MongooseModule.forFeature([
  {
    name: 'Order',
    schema: OrderSchema,
  },
]);
