import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RoleEnum } from 'src/Common/Enums/user.enums';

@Controller('wishlist')
@UseGuards(AuthGuard, RolesGuard)
@Roles(RoleEnum.USER)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':productId')
  async addProduct(@Req() req: any, @Param('productId') productId: string) {
    return this.wishlistService.addProduct(req.user.id, productId);
  }

  @Delete(':productId')
  async removeProduct(@Req() req: any, @Param('productId') productId: string) {
    return this.wishlistService.removeProduct(req.user.id, productId);
  }
  @Get()
  async getWishlist(@Req() req: any) {
    return this.wishlistService.getWishlist(req.user.id);
  }

  @Get('check/:productId')
  async checkProduct(@Req() req: any, @Param('productId') productId: string) {
    return this.wishlistService.checkProduct(req.user.id, productId);
  }

  @Delete()
  async clearWishlist(@Req() req: any) {
    return this.wishlistService.clearWishlist(req.user.id);
  }
}
