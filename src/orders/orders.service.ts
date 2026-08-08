import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { HOrderDocument, Order } from 'src/DB/Models/order.model';
import { Model } from 'mongoose';
import { Cart, HCartDocument } from 'src/DB/Models/cart.model';
import { HProductDocument, Product } from 'src/DB/Models/products.model';
import {
  Coupon,
  CouponType,
  HCouponDocument,
} from 'src/DB/Models/coupon.model';
import { OrderStatusEnum } from 'src/Common/Enums/order.enums';

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
}
