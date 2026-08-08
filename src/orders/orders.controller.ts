import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RoleEnum } from 'src/Common/Enums/user.enums';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { HUserDocument } from 'src/DB/Models/user.model';
import { GetMyOrdersDto } from './dto/get-order.dto';

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

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.USER)
  async getMyOrders(@Req() req: any, @Query() dto: GetMyOrdersDto) {
    const userId = req.user.id;
    return this.ordersService.getMyOrders(userId, dto);
  }

  @Get(':orderId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.USER)
  async getMyOrder(@Req() req: any, @Param('orderId') orderId: string) {
    const userId = req.user.id;

    return this.ordersService.getMyOrder(userId, orderId);
  }

  @Patch(':orderId/cancel')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.USER)
  async cancelOrder(@Req() req: any, @Param('orderId') orderId: string) {
    const userId = req.user.id;

    return this.ordersService.cancelOrder(userId, orderId);
  }

  @Get(':orderId/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.USER)
  async getOrderStatus(@Req() req: any, @Param('orderId') orderId: string) {
    const userId = req.user.id;

    return this.ordersService.getOrderStatus(userId, orderId);
  }
}
