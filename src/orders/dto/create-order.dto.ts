import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsNumber()
  @IsNotEmpty()
  postalCode!: number;

  @IsString()
  @IsNotEmpty()
  region!: string;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @IsString()
  @IsOptional()
  couponCode?: string;
}
