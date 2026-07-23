import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RoleEnum } from 'src/Common/Enums/user.enums';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller('cart')
@UseGuards(AuthGuard, RolesGuard)
@Roles(RoleEnum.USER)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req: any) {
    const userId = req.user._id;
    return await this.cartService.getCart(userId);
  }

  @Post()
  async addToCart(@Req() req: any, @Body() dto: AddToCartDto) {
    const userId = req.user._id;
    return await this.cartService.addToCart(userId, dto);
  }

  @Patch('item/:productId')
  async removeItem(@Req() req: any, @Param('productId') productId: string) {
    const userId = req.user._id;
    return await this.cartService.removeItem(userId, productId);
  }
}
