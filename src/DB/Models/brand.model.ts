import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
  Virtual,
} from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from 'src/Common/Enums/user.enums';
import { hash } from 'src/Common/Security/hash.security';

@Schema({
  timestamps: true,
})
export class Brand {
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
  })
  name!: string;

  @Prop({
    type: String,
    required: true,
  })
  logo!: string;

  @Prop({
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'User',
  })
  createdBy!: string;

  @Prop({
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'Category',
  })
  categories!: string[];

  @Prop({
    type: Boolean,
    default: false,
  })
  isDeleted!: boolean;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
  })
  deletedBy?: string;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

export type HBrandDocument = HydratedDocument<Brand>;

export const BrandModel = MongooseModule.forFeature([
  {
    name: 'Brand',
    schema: BrandSchema,
  },
]);
