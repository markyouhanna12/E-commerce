import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @Transform(({ value }) => value.trim())
  @IsString()
  @IsNotEmpty({ message: 'Product name is required.' })
  @Length(2, 100, {
    message: 'Product name must be between 2 and 50 characters.',
  })
  name!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  images!: string[];

  @IsNumber()
  @IsNotEmpty({ message: 'Product Price is required. ' })
  @IsPositive({ message: 'Product price must be a positive number.' })
  @Type(() => Number)
  price!: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty({ message: 'Product Stock is required. ' })
  @Min(0, { message: 'Product Stock must be a positive number.' })
  stock!: number;

  @IsOptional()
  @IsString()
  overview?: string;

  @IsMongoId({
    message: 'Category ID must be a valid ObjectId',
  })
  category!: string;

  @IsOptional()
  @IsMongoId({
    message: 'Brand ID must be a valid ObjectId',
  })
  brand?: string;
}
