import { Prop, Schema, SchemaFactory, Virtual } from '@nestjs/mongoose';
import { UserRole } from 'src/Common/Enums/enums';

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
    maxLength: [50, 'First name must be at most 50 characters long'],
  })
  firstName: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    minLength: [3, 'Last name must be at least 3 characters long'],
    maxLength: [50, 'Last name must be at most 50 characters long'],
  })
  lastName: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({ type: String, required: true, select: false })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  phoneNumber: string;

  @Virtual({
    get: function (this: User) {
      return `${this.firstName} ${this.lastName}`;
    },
  })
  fullname: string;
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true, name: 'idx_email_unique' });
UserSchema.index(
  { phoneNumber: 1 },
  { unique: true, name: 'idx_phoneNumber_unique' },
);

export default UserSchema;
