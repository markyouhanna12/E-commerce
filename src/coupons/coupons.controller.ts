import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RoleEnum } from 'src/Common/Enums/user.enums';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async create(@Req() req: any, @Body() createCouponDto: CreateCouponDto) {
    const adminId = req.user._id;
    return await this.couponsService.create(createCouponDto, adminId);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async findAll(@Query() query: any) {
    return await this.couponsService.findAll(query);
  }

  @Get(':couponId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async findOne(@Param('couponId') couponId: string) {
    return await this.couponsService.findOne(couponId);
  }

  @Patch(':couponId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async update(
    @Param('id') couponId: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    return await this.couponsService.update(couponId, updateCouponDto);
  }

  @Delete(':couponId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async delete(@Param('couponId') couponId: string) {
    return await this.couponsService.delete(couponId);
  }

  @Patch(':couponId/restore')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async restore(@Param('id') couponId: string) {
    return await this.couponsService.restore(couponId);
  }

  @Patch(':couponId/toggle')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async toggleStatus(@Param('couponId') couponId: string) {
    return await this.couponsService.toggleStatus(couponId);
  }

  @Post('apply')
  @UseGuards(AuthGuard)
  async applyCoupon(@Req() req: any, @Body() applyCouponDto: ApplyCouponDto) {
    const userId = req.user._id;

    return await this.couponsService.applyCoupon(userId, applyCouponDto);
  }

  @Delete('remove')
  @UseGuards(AuthGuard)
  async removeCoupon(@Req() req: any) {
    const userId = req.user._id;

    return await this.couponsService.removeCoupon(userId);
  }
}
