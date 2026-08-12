import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: false })
export class InvoiceItem {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  product!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  productName!: string;

  @Prop({
    type: Number,
    required: true,
  })
  quantity!: number;

  @Prop({
    type: Number,
    required: true,
  })
  unitPrice!: number;

  @Prop({
    type: Number,
    required: true,
  })
  total!: number;
}

export const InvoiceItemSchema = SchemaFactory.createForClass(InvoiceItem);

@Schema({ _id: false })
export class InvoiceShippingAddress {
  @Prop({ type: String, required: true })
  city!: string;

  @Prop({ type: Number, required: true })
  postalCode!: number;

  @Prop({ type: String, required: true })
  region!: string;
}

export const InvoiceShippingAddressSchema = SchemaFactory.createForClass(
  InvoiceShippingAddress,
);

@Schema({
  timestamps: true,
})
export class Invoice {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  invoiceNumber!: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true,
    index: true,
  })
  order!: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  customerName!: string;

  @Prop({
    type: String,
    required: true,
  })
  customerEmail!: string;

  @Prop({
    type: [InvoiceItemSchema],
    required: true,
  })
  items!: InvoiceItem[];

  @Prop({
    type: Number,
    required: true,
  })
  subtotal!: number;

  @Prop({
    type: Number,
    default: 0,
  })
  discountAmount!: number;

  @Prop({
    type: Number,
    required: true,
  })
  total!: number;

  @Prop({
    type: String,
    required: true,
    default: 'USD',
  })
  currency!: string;

  @Prop({
    type: String,
    required: true,
  })
  paymentMethod!: string;

  @Prop({
    type: String,
    required: true,
  })
  paymentStatus!: string;

  @Prop({
    type: InvoiceShippingAddressSchema,
    required: true,
  })
  shippingAddress!: InvoiceShippingAddress;

  @Prop({
    type: Date,
    required: true,
  })
  invoiceDate!: Date;

  @Prop({
    type: String,
  })
  stripePaymentIntentId?: string;

  @Prop({
    type: String,
  })
  pdfFileName?: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

export type HInvoiceDocument = HydratedDocument<Invoice>;

export const InvoiceModel = MongooseModule.forFeature([
  {
    name: Invoice.name,
    schema: InvoiceSchema,
  },
]);
