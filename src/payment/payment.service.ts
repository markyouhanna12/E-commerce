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
import { HProductDocument, Product } from 'src/DB/Models/products.model';
import { HUserDocument } from 'src/DB/Models/user.model';
import Stripe from 'stripe';
@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<HOrderDocument>,
    @InjectModel(Cart.name) private readonly cartModel: Model<HCartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<HProductDocument>,
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<HCouponDocument>,

    private readonly stripeService: StripeService,
  ) {}

  async createCheckoutSession(orderId: Types.ObjectId, userId: Types.ObjectId) {
    const order = await this.orderModel
      .findOne({
        _id: orderId,
        user: userId,
        status: OrderStatusEnum.PROCESSING,
        paymentMethod: PaymentMethodEnum.CARD,
      })
      .populate([
        {
          path: 'user',
        },
        {
          path: 'appliedCoupon',
        },
      ]);

    if (!order) {
      throw new NotFoundException('Order Not Found');
    }

    const amount = order.subTotal;

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Order ${(order.user as unknown as HUserDocument).firstName}`,
            description: `Payment for order on Address ${order.shippingAddress}`,
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
      customer_email: (order.user as unknown as HUserDocument).email,
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
        $unset: { intentId: true },
        $inc: { __v: 1 },
      },
      { new: true },
    );

    return refundedOrder;
  }
}
