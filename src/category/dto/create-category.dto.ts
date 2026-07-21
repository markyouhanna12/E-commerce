import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required...' })
  @Length(2, 50, {
    message: 'Category name must be between 2 and 50 character long',
  })
  name!: string;
}
