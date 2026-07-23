import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType } from 'src/DB/Models/coupon.model';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message:
      'Coupon code can only contain letters, numbers, hyphens, and underscores.',
  })
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(CouponType)
  type!: CouponType;

  @IsNumber()
  @IsPositive()
  value!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsDateString()
  expiresAt!: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsesPerUser?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumPurchase?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumDiscount?: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  products?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  categories?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  brands?: string[];
}

// Example Request
// Percentage
// {
//   "code": "WELCOME10",
//   "name": "Welcome Discount",
//   "description": "10% discount for new customers",
//   "type": "PERCENTAGE",
//   "value": 10,
//   "expiresAt": "2026-12-31T23:59:59.000Z",
//   "maxUses": 500,
//   "maxUsesPerUser": 1,
//   "minimumPurchase": 100,
//   "maximumDiscount": 50,
//   "categories": [
//     "6880f5af7d8d4d3d0f1c5678"
//   ]
// }

// Fixed Discount Coupon

// {
//   "code": "SAVE50",
//   "name": "Save 50",
//   "type": "FIXED",
//   "value": 50,
//   "expiresAt": "2026-12-31T23:59:59.000Z",
//   "minimumPurchase": 300
// }
