import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RoleEnum } from 'src/Common/Enums/user.enums';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.USER)
  create(@Body() dto: CreateOrderDto, @Req() req: any) {
    const userId = req.user.id; // Assuming you have a user object in the request

    return this.ordersService.checkout(userId, dto);
  }
}
