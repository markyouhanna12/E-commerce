import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { HOrderDocument, Order } from 'src/DB/Models/order.model';
import { Model, QueryFilter, SortOrder, Types } from 'mongoose';
import { Cart, HCartDocument } from 'src/DB/Models/cart.model';
import { HProductDocument, Product } from 'src/DB/Models/products.model';
import {
  Coupon,
  CouponType,
  HCouponDocument,
} from 'src/DB/Models/coupon.model';
import {
  OrderStatusEnum,
  PaymentMethodEnum,
} from 'src/Common/Enums/order.enums';
import { GetAdminOrdersDto, GetMyOrdersDto } from './dto/get-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { HUserDocument } from 'src/DB/Models/user.model';
import { PaymentStatusEnum } from 'src/Common/Enums/order.enums';
import Stripe from 'stripe';
import { StripeService } from 'src/Common/Services/payment/payment.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<HOrderDocument>,
    @InjectModel(Cart.name) private readonly cartModel: Model<HCartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<HProductDocument>,
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<HCouponDocument>,

    private readonly stripeService: StripeService,
  ) {}

  async checkout(userId: string, dto: CreateOrderDto) {
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException(
        'Your Checkout pipline failed : cart is currently empty ',
      );
    }
    const orderItems: any[] = [];
    let calculatedSubTotal = 0;

    for (const item of cart.items) {
      const dbProduct = await this.productModel.findById(item.product);
      if (!dbProduct) {
        throw new NotFoundException(
          `Checkout aborted . Product Id ${item.product} not longer exists `,
        );
      }
      if (dbProduct.stock < item.quantity) {
        throw new NotFoundException(
          `insufficient stock for item:${dbProduct.name}. stored stock : ${dbProduct.stock}`,
        );
      }

      calculatedSubTotal += dbProduct.price * item.quantity;
      orderItems.push({
        product: item.product,
        quantity: item.quantity,
        priceSnapshot: dbProduct.price,
      });
    }

    let discountAmount = 0;
    let targetCoupon: HCouponDocument | null = null;

    if (dto.couponCode) {
      targetCoupon = await this.couponModel.findOne({
        code: dto.couponCode.toUpperCase().trim(),
      });
      if (!targetCoupon) {
        throw new NotFoundException('This Coupon code provided is invalid');
      }
      if (new Date() > targetCoupon.expiresAt) {
        throw new BadRequestException('This Coupon has expired');
      }
      if (targetCoupon.usedCount >= targetCoupon.maxUses) {
        throw new BadRequestException('Coupon usage cap hit');
      }
    }

    for (const item of orderItems) {
      await this.productModel.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    if (targetCoupon) {
      await this.couponModel.findByIdAndUpdate(targetCoupon._id, {
        $inc: { usedCount: 1 },
        $push: {
          usedBy: userId,
        },
      });
    }

    const order = await this.orderModel.create({
      user: userId,
      items: orderItems,
      subTotal: calculatedSubTotal,
      discountAmount: cart.discount,
      finalPrice: cart.totalPrice,
      shippingAddress: dto.shippingAddress,
      ...(targetCoupon?._id && {
        appliedCoupon: targetCoupon._id,
      }),
      status: OrderStatusEnum.PROCESSING,
      paymentMethod: dto.paymentMethod,
    });

    await order.save();

    cart.items = [];
    cart.totalPrice = 0;
    cart.subTotal = 0;
    cart.discount = 0;
    cart.coupon = null;
    await cart.save();

    return {
      message: 'Checkout successful',
      status: 200,
      order: order,
    };
  }

  async getMyOrders(userId: string, dto: GetMyOrdersDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const skip = (page - 1) * limit;

    const filter: QueryFilter<Order> = {
      user: new Types.ObjectId(userId),
    };

    if (dto.status) {
      filter.status = dto.status;
    }

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('items.product')
        .populate('appliedCoupon')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      this.orderModel.countDocuments(filter),
    ]);

    return {
      message: 'Orders fetched successfully',
      status: 200,
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyOrder(userId: string, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel
      .findOne({
        _id: new Types.ObjectId(orderId),
        user: new Types.ObjectId(userId),
      })
      .populate('items.product')
      .populate('appliedCoupon');

    if (!order) {
      throw new NotFoundException(
        'Order not found or you do not have access to this order',
      );
    }

    return {
      message: 'Order fetched successfully',
      status: 200,
      order,
    };
  }

  async cancelOrder(userId: string, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      user: new Types.ObjectId(userId),
    });

    if (!order) {
      throw new NotFoundException(
        'Order not found or you do not have access to this order',
      );
    }

    if (order.status === OrderStatusEnum.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    if (
      order.status !== OrderStatusEnum.PENDING &&
      order.status !== OrderStatusEnum.CONFIRMED
    ) {
      throw new BadRequestException(
        `Order cannot be cancelled because its current status is ${order.status}`,
      );
    }

    for (const item of order.items) {
      await this.productModel.findByIdAndUpdate(item.product, {
        $inc: {
          stock: item.quantity,
        },
      });
    }

    if (order.appliedCoupon) {
      await this.couponModel.findByIdAndUpdate(order.appliedCoupon, {
        $inc: {
          usedCount: -1,
        },
        $pull: {
          usedBy: new Types.ObjectId(userId),
        },
      });
    }

    order.status = OrderStatusEnum.CANCELLED;

    await order.save();

    return {
      message: 'Order cancelled successfully',
      status: 200,
      order,
    };
  }

  async getOrderStatus(userId: string, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findOne(
      {
        _id: new Types.ObjectId(orderId),
        user: new Types.ObjectId(userId),
      },
      {
        _id: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    );
    if (!order) {
      throw new NotFoundException(
        'Order not found or you do not have access to this order',
      );
    }

    return {
      message: 'Order status fetched successfully',
      status: 200,
      order: {
        id: order._id,
        status: order.status,
      },
    };
  }

  async getAllOrders(dto: GetAdminOrdersDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const skip = (page - 1) * limit;

    const filter: QueryFilter<Order> = {};

    if (dto.status) {
      filter.status = dto.status;
    }

    // Search
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
      dto.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('user', 'name email phone')
        .populate('items.product')
        .populate('appliedCoupon')
        .sort(sort)
        .skip(skip)
        .limit(limit),

      this.orderModel.countDocuments(filter),
    ]);

    return {
      message: 'Orders fetched successfully',
      status: 200,
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAdminOrder(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }
    const order = await this.orderModel
      .findById(orderId)
      .populate('user', 'name email phone')
      .populate('items.product')
      .populate('appliedCoupon');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      message: 'Order fetched successfully',
      status: 200,
      order,
    };
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatusEnum.CANCELLED) {
      throw new BadRequestException('Cancelled orders cannot be updated');
    }

    if (order.status === OrderStatusEnum.DELIVERED) {
      throw new BadRequestException('Delivered orders cannot be updated');
    }

    order.status = dto.status;

    await order.save();

    return {
      message: 'Order status updated successfully',
      status: 200,
      order,
    };
  }

  // async createCheckoutSession(orderId: Types.ObjectId, userId: Types.ObjectId) {
  //   const order = await this.orderModel
  //     .findOne({
  //       _id: orderId,
  //       user: userId,
  //       status: OrderStatusEnum.PROCESSING,
  //       paymentMethod: PaymentMethodEnum.CARD,
  //     })
  //     .populate([
  //       {
  //         path: 'user',
  //       },
  //       {
  //         path: 'appliedCoupon',
  //       },
  //     ]);

  //   if (!order) {
  //     throw new NotFoundException('Order Not Found');
  //   }

  //   const amount = order.subTotal;

  //   const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
  //     {
  //       price_data: {
  //         currency: 'usd',
  //         product_data: {
  //           name: `Order ${(order.user as unknown as HUserDocument).firstName}`,
  //           description: `Payment for order on Address ${order.shippingAddress}`,
  //         },
  //         unit_amount: Math.round(amount * 100),
  //       },
  //       quantity: 1,
  //     },
  //   ];

  //   let discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];

  //   if (order.appliedCoupon) {
  //     const couponData = await this.couponModel.findById(order.appliedCoupon);

  //     if (!couponData) {
  //       throw new NotFoundException('Coupon Not Found');
  //     }

  //     const coupon = await this.paymentService.createCoupon({
  //       duration: 'once',
  //       currency: 'usd',
  //       percent_off: couponData?.value,
  //     });

  //     discounts.push({ coupon: coupon.id });
  //   }

  //   const session = await this.paymentService.checkoutSession({
  //     customer_email: (order.user as unknown as HUserDocument).email,
  //     line_items: line_items,
  //     mode: 'payment',
  //     discounts,
  //     metadata: { orderId: orderId.toString() },
  //   });

  //   await this.orderModel.updateOne(
  //     {
  //       _id: orderId,
  //       user: userId,
  //     },
  //     {
  //       $set: {
  //         stripeSessionId: session.id,
  //       },
  //     },
  //   );

  //   return session;
  // }

  // async handleStripeWebhook(rawBody: Buffer, signature: string) {
  //   const event = this.paymentService.constructWebhookEvent(rawBody, signature);

  //   switch (event.type) {
  //     case 'checkout.session.completed': {
  //       const session = event.data.object as Stripe.Checkout.Session;

  //       if (session.payment_status !== 'paid') {
  //         break;
  //       }
  //       const orderId = session.metadata?.orderId;

  //       if (!orderId) {
  //         throw new BadRequestException(
  //           'Order ID is missing from Stripe session metadata',
  //         );
  //       }

  //       if (!Types.ObjectId.isValid(orderId)) {
  //         throw new BadRequestException(
  //           'Invalid order ID in Stripe session metadata',
  //         );
  //       }

  //       const order = await this.orderModel.findOne({
  //         _id: new Types.ObjectId(orderId),
  //         paymentStatus: PaymentStatusEnum.PENDING,
  //       });
  //       if (!order) {
  //         break;
  //       }

  //       order.paymentStatus = PaymentStatusEnum.PAID;
  //       order.stripeSessionId = session.id;

  //       if (typeof session.payment_intent === 'string') {
  //         order.intentId = session.payment_intent;
  //       }

  //       await order.save();

  //       break;
  //     }
  //     default:
  //       break;
  //   }
  //   return {
  //     received: true,
  //   };
  // }

  // async createRefund(orderId: Types.ObjectId, userId: Types.ObjectId) {
  //   const order = await this.orderModel.findOne({
  //     _id: orderId,
  //     user: userId,
  //     paymentStatus: PaymentStatusEnum.PAID,
  //     paymentMethod: PaymentMethodEnum.CARD,
  //   });

  //   if (!order) {
  //     throw new NotFoundException('Order Not Found');
  //   }

  //   if (!order.intentId) {
  //     throw new BadRequestException(
  //       'Payment Intent ID is missing for this order',
  //     );
  //   }

  //   const refund = await this.paymentService.createRefund(order.intentId);

  //   const refundedOrder = await this.orderModel.findByIdAndUpdate(
  //     order.id,
  //     {
  //       status: OrderStatusEnum.CANCELLED,
  //       refundId: refund.id,
  //       refundAt: new Date(),
  //       paymentStatus: PaymentStatusEnum.REFUNDED,
  //       $unset: { intentId: true },
  //       $inc: { __v: 1 },
  //     },
  //     { new: true },
  //   );

  //   return refundedOrder;
  // }
}
