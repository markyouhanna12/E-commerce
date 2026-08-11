import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, SortOrder, Types } from 'mongoose';
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
import {
  GetAdminPaymentsDto,
  PaymentSortEnum,
} from './dto/get-admin-payments.dto';
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

  async getMyPayments(userId: Types.ObjectId) {
    const orders = await this.orderModel
      .find(
        {
          user: userId,
        },
        {
          _id: 1,
          finalPrice: 1,
          paymentMethod: 1,
          paymentStatus: 1,
          stripeSessionId: 1,
          intentId: 1,
          refundId: 1,
          refundAt: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      )
      .sort({ createdAt: -1 });

    return {
      message: 'Payment history fetched successfully',
      status: 200,
      payments: orders.map((order) => ({
        orderId: order._id,
        amount: order.finalPrice,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        stripeSessionId: order.stripeSessionId,
        intentId: order.intentId,
        refundId: order.refundId,
        refundAt: order.refundAt,
      })),
    };
  }

  async getAllPayments(dto: GetAdminPaymentsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const skip = (page - 1) * limit;

    const filter: QueryFilter<Order> = {
      paymentMethod: PaymentMethodEnum.CARD,
    };

    if (dto.status) {
      filter.paymentStatus = dto.status;
    }

    if (dto.search) {
      const search = dto.search.trim();

      if (Types.ObjectId.isValid(search)) {
        filter.$or = [
          {
            _id: new Types.ObjectId(search),
          },
          {
            user: new Types.ObjectId(search),
          },
        ];
      }
    }

    const sort: Record<string, SortOrder> =
      dto.sort === PaymentSortEnum.OLDEST
        ? { createdAt: 1 }
        : { createdAt: -1 };

    const [payments, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('user', 'firstName lastName email phone')
        .select({
          _id: 1,
          user: 1,
          finalPrice: 1,
          subTotal: 1,
          discountAmount: 1,
          paymentMethod: 1,
          paymentStatus: 1,
          stripeSessionId: 1,
          intentId: 1,
          refundId: 1,
          refundAt: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .sort(sort)
        .skip(skip)
        .limit(limit),

      this.orderModel.countDocuments(filter),
    ]);

    return {
      message: 'Payments fetched successfully',
      status: 200,
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAdminPayment(orderId: Types.ObjectId) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }
    const order = await this.orderModel
      .findOne({
        _id: orderId,
        paymentMethod: PaymentMethodEnum.CARD,
      })
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name price');

    if (!order) {
      throw new NotFoundException('Payment not found');
    }

    return {
      message: 'Payment fetched successfully',
      status: 200,
      payment: {
        orderId: order._id,
        user: order.user,
        items: order.items,
        subTotal: order.subTotal,
        discountAmount: order.discountAmount,
        finalPrice: order.finalPrice,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        stripeSessionId: order.stripeSessionId,
        intentId: order.intentId,
        refundId: order.refundId,
        refundAt: order.refundAt,
      },
    };
  }

  async getPaymentStatistics() {
    const [
      totalPayments,
      paidPayments,
      pendingPayments,
      refundedPayments,
      revenueResult,
      refundedAmountResult,
    ] = await Promise.all([
      this.orderModel.countDocuments({
        paymentMethod: PaymentMethodEnum.CARD,
      }),
      this.orderModel.countDocuments({
        paymentMethod: PaymentMethodEnum.CARD,
        paymentStatus: PaymentStatusEnum.PAID,
      }),
      this.orderModel.countDocuments({
        paymentMethod: PaymentMethodEnum.CARD,
        paymentStatus: PaymentStatusEnum.PENDING,
      }),

      this.orderModel.countDocuments({
        paymentMethod: PaymentMethodEnum.CARD,
        paymentStatus: PaymentStatusEnum.REFUNDED,
      }),

      this.orderModel.aggregate([
        {
          $match: {
            paymentMethod: PaymentMethodEnum.CARD,
            paymentStatus: PaymentStatusEnum.PAID,
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: '$finalPrice',
            },
          },
        },
      ]),
      this.orderModel.aggregate([
        {
          $match: {
            paymentMethod: PaymentMethodEnum.CARD,
            paymentStatus: PaymentStatusEnum.REFUNDED,
          },
        },
        {
          $group: {
            _id: null,
            totalRefunded: {
              $sum: '$finalPrice',
            },
          },
        },
      ]),
    ]);
    return {
      message: 'Payment statistics fetched successfully',
      status: 200,
      statistics: {
        totalPayments,
        paidPayments,
        pendingPayments,
        refundedPayments,
        totalRevenue: revenueResult[0]?.totalRevenue ?? 0,
        totalRefunded: refundedAmountResult[0]?.totalRefunded ?? 0,
      },
    };
  }
}
