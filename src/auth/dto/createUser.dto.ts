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
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from 'src/Common/Enums/user.enums';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 20, {
    message: 'FirstName must be between 2 and 20 characters long',
  })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 20, {
    message: 'LastName must be between 2 and 20 characters long',
  })
  @Transform(({ value }) => value?.trim())
  LastName: string;

  @IsEmail({}, { message: 'Please Provide a valid email format' })
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  @Length(8, 50, { message: 'Password must be at least 8 characters long' })
  @ValidateIf((dto: CreateUserDto) => dto.provider !== ProviderEnum.GOOGLE)
  password: string;

  @IsString()
  @IsEnum(GenderEnum, { message: 'Gender value is not valid gender Selection' })
  @IsOptional()
  gender: string;

  @IsString()
  @IsEnum(ProviderEnum, {
    message: 'Provider value is not valid Provider Selection',
  })
  @IsOptional()
  provider: string;

  @IsString()
  @IsEnum(RoleEnum, {
    message: 'Role value is not valid Role Selection',
  })
  @IsOptional()
  role: string;

  @IsPhoneNumber('EG', { message: 'please Enter a valid phone Number' })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;
}
