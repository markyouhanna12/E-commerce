import { IsEnum, IsNotEmpty } from 'class-validator';

import { OrderStatusEnum } from 'src/Common/Enums/order.enums';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusEnum)
  @IsNotEmpty()
  status!: OrderStatusEnum;
}
