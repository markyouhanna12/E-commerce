import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatusEnum } from 'src/Common/Enums/order.enums';

export class GetMyOrdersDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsEnum(OrderStatusEnum)
  status?: OrderStatusEnum;
}
