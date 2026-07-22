import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GetProductsDto {
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString({
    message: 'Search value must be a string.',
  })
  search?: string;

  @IsOptional()
  @IsMongoId({
    message: 'Category ID must be a valid ObjectId.',
  })
  category?: string;

  @IsOptional()
  @IsMongoId({
    message: 'Brand ID must be a valid ObjectId.',
  })
  brand?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {},
    {
      message: 'Minimum price must be a number.',
    },
  )
  @Min(0, {
    message: 'Minimum price cannot be negative.',
  })
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {},
    {
      message: 'Maximum price must be a number.',
    },
  )
  @Min(0, {
    message: 'Maximum price cannot be negative.',
  })
  maxPrice?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  inStock?: boolean;

  @IsOptional()
  @IsIn(['name', 'price', 'stock', 'createdAt', 'updatedAt'], {
    message: 'Sort must be one of: name, price, stock, createdAt, updatedAt.',
  })
  sort: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'], {
    message: 'Order must be either asc or desc.',
  })
  order: string = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
