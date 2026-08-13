import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Wishlist {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  user!: Types.ObjectId;

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    default: [],
  })
  products!: Types.ObjectId[];
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

export type HWishlistDocument = HydratedDocument<Wishlist>;

export const WishlistModel = MongooseModule.forFeature([
  {
    name: Wishlist.name,
    schema: WishlistSchema,
  },
]);
