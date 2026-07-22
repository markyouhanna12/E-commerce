import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';

export class CreateBrandDto {
  @Transform(({ value }) => value.trim())
  @IsString()
  @IsNotEmpty({ message: 'Brand name is required.' })
  @Length(2, 50, { message: 'Brand name must be between 2 and 50 characters.' })
  name!: string;

  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  @IsArray({ message: 'Categories must be an array.' })
  @ArrayMinSize(1, {
    message: 'At least one category is required.',
  })
  @IsMongoId({
    each: true,
    message: 'Each category ID must be a valid MongoDB ObjectId.',
  })
  categories!: string[];
}
