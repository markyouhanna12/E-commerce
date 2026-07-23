import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty({ message: 'Review comment is required.' })
  @Length(10, 500, {
    message: 'Review comment must be between 10 and 500 characters. ',
  })
  @Transform(({ value }) => value?.trim())
  comment!: string;

  @IsNumber()
  @IsInt()
  @IsNotEmpty({ message: 'Review rating is required.' })
  @Min(1, { message: 'Review rating must be a number between 1 and 5.' })
  @Type(() => Number)
  rating!: number;

  @IsMongoId({ message: 'Invalid product ID.' })
  @IsNotEmpty({ message: 'Product ID is required' })
  product!: string;
}
