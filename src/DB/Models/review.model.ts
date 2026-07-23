import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Mongoose } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Review {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  })
  user!: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  })
  product!: string;

  @Prop({
    required: true,
    type: Number,
    min: 1,
    max: 5,
  })
  rating!: number;

  @Prop({
    required: true,
    type: String,
    trim: true,
  })
  comment!: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

export type HReviewDocument = HydratedDocument<Review>;

ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

export const ReviewModel = MongooseModule.forFeature([
  {
    name: 'Review',
    schema: ReviewSchema,
  },
]);
