import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
} from 'src/Common/Enums/order.enums';
import { StripeService } from 'src/Common/Services/payment/payment.service';
import { Cart, HCartDocument } from 'src/DB/Models/cart.model';
import { Coupon, HCouponDocument } from 'src/DB/Models/coupon.model';
import { HOrderDocument, Order } from 'src/DB/Models/order.model';
import { HUserDocument } from 'src/DB/Models/user.model';
import Stripe from 'stripe';
@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<HOrderDocument>,
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<HCouponDocument>,

    private readonly stripeService: StripeService,
  ) {}

  async createCheckoutSession(orderId: Types.ObjectId, userId: Types.ObjectId) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel
      .findOne({
        _id: orderId,
        user: userId,
        status: OrderStatusEnum.PROCESSING,
        paymentMethod: PaymentMethodEnum.CARD,
        paymentStatus: PaymentStatusEnum.PENDING,
      })
      .populate('user');

    if (!order) {
      throw new NotFoundException(
        'Order not found or is not available for payment',
      );
    }

    if (order.finalPrice <= 0) {
      throw new BadRequestException(
        'Order final price must be greater than zero',
      );
    }

    if (order.stripeSessionId) {
      throw new BadRequestException(
        'Checkout session already exists for this order',
      );
    }

    const user = order.user as unknown as HUserDocument;

    const amount = order.subTotal;

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Order for ${user.firstName}`,
            description: `Payment for order ${order._id}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ];

    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];

    if (order.appliedCoupon) {
      const couponData = await this.couponModel.findById(order.appliedCoupon);

      if (!couponData) {
        throw new NotFoundException('Coupon Not Found');
      }

      const coupon = await this.stripeService.createCoupon({
        duration: 'once',
        currency: 'usd',
        percent_off: couponData?.value,
      });

      discounts.push({ coupon: coupon.id });
    }

    const session = await this.stripeService.checkoutSession({
      customer_email: user.email,
      line_items: line_items,
      mode: 'payment',
      discounts,
      metadata: { orderId: orderId.toString() },
    });

    await this.orderModel.updateOne(
      {
        _id: orderId,
        user: userId,
      },
      {
        $set: {
          stripeSessionId: session.id,
        },
      },
    );

    return session;
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const event = this.stripeService.constructWebhookEvent(rawBody, signature);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status !== 'paid') {
          break;
        }
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          throw new BadRequestException(
            'Order ID is missing from Stripe session metadata',
          );
        }

        if (!Types.ObjectId.isValid(orderId)) {
          throw new BadRequestException(
            'Invalid order ID in Stripe session metadata',
          );
        }

        const order = await this.orderModel.findOne({
          _id: new Types.ObjectId(orderId),
          paymentStatus: PaymentStatusEnum.PENDING,
        });
        if (!order) {
          break;
        }

        order.paymentStatus = PaymentStatusEnum.PAID;
        order.stripeSessionId = session.id;

        if (typeof session.payment_intent === 'string') {
          order.intentId = session.payment_intent;
        }

        await order.save();

        break;
      }
      default:
        break;
    }
    return {
      received: true,
    };
  }

  async createRefund(orderId: Types.ObjectId, userId: Types.ObjectId) {
    const order = await this.orderModel.findOne({
      _id: orderId,
      user: userId,
      paymentStatus: PaymentStatusEnum.PAID,
      paymentMethod: PaymentMethodEnum.CARD,
    });

    if (!order) {
      throw new NotFoundException('Order Not Found');
    }

    if (!order.intentId) {
      throw new BadRequestException(
        'Payment Intent ID is missing for this order',
      );
    }

    const refund = await this.stripeService.createRefund(order.intentId);

    const refundedOrder = await this.orderModel.findByIdAndUpdate(
      order.id,
      {
        status: OrderStatusEnum.CANCELLED,
        refundId: refund.id,
        refundAt: new Date(),
        paymentStatus: PaymentStatusEnum.REFUNDED,
        $inc: { __v: 1 },
      },
      { new: true },
    );

    return refundedOrder;
  }

  async getPayment(orderId: Types.ObjectId, userId: Types.ObjectId) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findOne({
      _id: orderId,
      user: userId,
      paymentMethod: PaymentMethodEnum.CARD,
    });

    if (!order) {
      throw new NotFoundException(
        'Order not found or you do not have access to this payment',
      );
    }

    return {
      message: 'Payment fetched successfully',
      status: 200,
      payment: {
        orderId: order._id,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        amount: order.finalPrice,
        stripeSessionId: order.stripeSessionId,
        intentId: order.intentId,
        refundId: order.refundId,
        refundAt: order.refundAt,
      },
    };
  }
}
