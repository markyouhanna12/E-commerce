import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  Length,
  validate,
  ValidateIf,
} from 'class-validator';

export class ConfirmEmailDto {
  @IsEmail({}, { message: 'Please Provide a valid email format' })
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP verfication code cannot be blank' })
  confirmEmailOTP: string;
}
