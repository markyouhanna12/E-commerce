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
export class Category {
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
    type: Boolean,
    default: false,
  })
  isDeleted!: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

export type HCategoryDocument = HydratedDocument<Category>;

export const CategoryModel = MongooseModule.forFeature([
  {
    name: 'Category',
    schema: CategorySchema,
  },
]);
