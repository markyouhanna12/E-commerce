import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required...' })
  @Length(2, 50, {
    message: 'Category name must be between 2 and 50 character long',
  })
  name!: string;

  @IsString()
  @IsArray({ message: 'categories must be an array' })
  @IsMongoId({
    each: true,
    message: 'Each category ID must be a valid ObjectId',
  })
  categories!: string[];
}
