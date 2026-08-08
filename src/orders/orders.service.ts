import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { HOrderDocument, Order } from 'src/DB/Models/order.model';
import { Model, QueryFilter, Types } from 'mongoose';
import { Cart, HCartDocument } from 'src/DB/Models/cart.model';
import { HProductDocument, Product } from 'src/DB/Models/products.model';
import {
  Coupon,
  CouponType,
  HCouponDocument,
} from 'src/DB/Models/coupon.model';
import { OrderStatusEnum } from 'src/Common/Enums/order.enums';
import { GetMyOrdersDto } from './dto/get-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<HOrderDocument>,
    @InjectModel(Cart.name) private readonly cartModel: Model<HCartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<HProductDocument>,
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<HCouponDocument>,
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
      status: OrderStatusEnum.PENDING,
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
      order.status !== OrderStatusEnum.PAID
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
}
