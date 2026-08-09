import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethodEnum } from 'src/Common/Enums/order.enums';

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

  @IsEnum(PaymentMethodEnum)
  paymentMethod!: PaymentMethodEnum;
}
