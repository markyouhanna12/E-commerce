import {
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payment.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RoleEnum } from 'src/Common/Enums/user.enums';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Types } from 'mongoose';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentsService) {}

  @Post('/checkout/:orderId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.USER)
  async createCheckoutSession(
    @Param('orderId') orderId: Types.ObjectId,
    @Req() req: any,
  ) {
    const userId = req.user._id;
    const session = await this.paymentService.createCheckoutSession(
      orderId,
      userId,
    );

    return session;
  }

  @Post('webhook')
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentService.handleStripeWebhook(req.rawBody!, signature);
  }

  @Post('/refund/:orderId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.USER)
  async createRefund(
    @Param('orderId') orderId: Types.ObjectId,
    @Req() req: any,
  ) {
    const userId = req.user._id;
    const refund = await this.paymentService.createRefund(orderId, userId);

    return refund;
  }

  @Get(':orderId')
  @UseGuards(AuthGuard)
  async getPayment(@Param('orderId') orderId: Types.ObjectId, @Req() req: any) {
    const userId = req.user.id;

    return this.paymentService.getPayment(orderId, userId);
  }
}
