import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @IsString()
  @IsNotEmpty({ message: 'Product ID is required..' })
  productId!: string;

  @IsNumber()
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1..' })
  @IsNotEmpty({ message: 'Quantity is required..' })
  quantity!: number;
}
