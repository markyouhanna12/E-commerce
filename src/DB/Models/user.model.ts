import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
  Virtual,
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from 'src/Common/Enums/user.enums';
import { hash } from 'src/Common/Security/hash.security';

@Schema({
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
})
export class User {
  @Prop({
    type: String,
    required: true,
    trim: true,
    minLength: [3, 'First name must be at least 3 characters long'],
    maxLength: [20, 'First name must be at most 50 characters long'],
  })
  firstName: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    minLength: [3, 'Last name must be at least 3 characters long'],
    maxLength: [20, 'Last name must be at most 50 characters long'],
  })
  lastName: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
  })
  email: string;

  @Prop({
    type: String,
    required: function (this: any) {
      return this.provider === ProviderEnum.GOOGLE ? false : true;
    },
  })
  password: string;

  @Prop({
    type: String,
    enum: RoleEnum,
    default: RoleEnum.USER,
  })
  role: RoleEnum;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  phoneNumber: string;

  @Prop({
    type: Date,
  })
  confirmEmail: Date;

  @Prop({
    type: String,
    default: undefined,
  })
  confirmEmailOTP: string | undefined;

  @Prop({
    type: Date,
  })
  otpExpiresAt: Date | undefined;

  @Prop({
    type: String,
    enum: GenderEnum,
    default: GenderEnum.MALE,
  })
  gender: GenderEnum;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true, name: 'idx_email_unique' });

UserSchema.index(
  { phoneNumber: 1 },
  { unique: true, name: 'idx_phoneNumber_unique' },
);

UserSchema.virtual('username')
  .get(function (this: any) {
    return this.firstName + ' ' + this.lastName;
  })
  .set(function (this: any, value: string) {
    const [firstName, lastName] = value.split(' ') || [];
    this.firstName = firstName;
    this.lastName = lastName;
  });

UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await hash(this.password);
  }
});

export type UserDocument = HydratedDocument<User>;

export const UserModel = MongooseModule.forFeature([
  {
    name: 'User',
    schema: UserSchema,
  },
]);
