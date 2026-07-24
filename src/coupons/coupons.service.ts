import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import {
  Coupon,
  CouponType,
  HCouponDocument,
} from 'src/DB/Models/coupon.model';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { Cart, HCartDocument } from 'src/DB/Models/cart.model';
import { HProductDocument, Product } from 'src/DB/Models/products.model';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<HCouponDocument>,
    @InjectModel(Cart.name)
    private readonly cartModel: Model<HCartDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<HProductDocument>,
  ) {}

  private async reCalculateCartTotal(cart: HCartDocument) {
    let total = 0;

    for (const item of cart.items) {
      item.SubTotal = item.quantity * item.pricePerUnit;
      total += item.SubTotal;
    }
    cart.subTotal = total;

    if (cart.discount > total) {
      cart.discount = total;
    }

    cart.totalPrice = total - cart.discount;
  }

  async create(createCouponDto: CreateCouponDto, adminId: string) {
    const {
      code,
      name,
      description,
      type,
      value,
      expiresAt,
      maxUses,
      maxUsesPerUser,
      minimumPurchase,
      maximumDiscount,
      products,
      categories,
      brands,
      isActive,
    } = createCouponDto;

    const existingCoupon = await this.couponModel.findOne({
      code: code.toUpperCase(),
    });
    if (existingCoupon) {
      throw new ConflictException('Coupon code already exists.');
    }
    const coupon = await this.couponModel.create({
      code: code.toUpperCase(),
      name,
      description,
      type,
      value,
      expiresAt,
      maxUses,
      maxUsesPerUser,
      minimumPurchase,
      maximumDiscount,
      products,
      categories,
      brands,
      isActive,
      createdBy: adminId,
    });

    return {
      success: true,
      message: 'Coupon created successfully.',
      data: coupon,
    };
  }
  async findAll(query: any) {
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      isActive,
      expired,
    } = query;

    const filter: any = {};

    // Search
    if (search) {
      filter.$or = [
        {
          code: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          name: {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    // Active Filter
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Expiration Filter
    if (expired !== undefined) {
      if (expired === 'true') {
        filter.expiresAt = {
          $lt: new Date(),
        };
      } else {
        filter.expiresAt = {
          $gte: new Date(),
        };
      }
    }

    const totalCoupons = await this.couponModel.countDocuments(filter);

    const coupons = await this.couponModel
      .find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('products', 'title')
      .populate('categories', 'name')
      .populate('brands', 'name')
      .sort({
        [sortBy]: order === 'asc' ? 1 : -1,
      })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return {
      success: true,
      results: coupons.length,

      pagination: {
        totalCoupons,
        currentPage: Number(page),
        totalPages: Math.ceil(totalCoupons / Number(limit)),
        limit: Number(limit),
      },

      data: coupons,
    };
  }

  async findOne(id: string) {
    const coupon = await this.couponModel
      .findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('products', 'title')
      .populate('categories', 'name')
      .populate('brands', 'name');

    if (!coupon) {
      throw new NotFoundException('Coupon not found.');
    }
    return {
      success: true,
      data: coupon,
    };
  }

  async update(id: string, updateCouponDto: UpdateCouponDto) {
    const coupon = await this.couponModel.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found.');
    }
    if (updateCouponDto.code) {
      const existingCoupon = await this.couponModel.findOne({
        code: updateCouponDto.code.toUpperCase(),
        _id: { $ne: id },
      });
      if (existingCoupon) {
        throw new ConflictException('Coupon code already exists.');
      }
      updateCouponDto.code = updateCouponDto.code.toUpperCase();
    }
    const updatedCoupon = await this.couponModel.findByIdAndUpdate(
      id,
      updateCouponDto,
      {
        new: true,
        runValidators: true,
      },
    );
    return {
      success: true,
      message: 'Coupon updated successfully.',
      data: updatedCoupon,
    };
  }

  async delete(id: string) {
    const coupon = await this.couponModel.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found.');
    }
    coupon.isActive = false;
    await coupon.save();

    return { success: true, message: 'Coupon deleted successfully.' };
  }

  async restore(id: string) {
    const coupon = await this.couponModel.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found.');
    }

    if (coupon.isActive) {
      throw new BadRequestException('Coupon is already active.');
    }
    coupon.isActive = true;

    await coupon.save();

    return {
      success: true,
      message: 'Coupon restored successfully.',
      data: coupon,
    };
  }

  async toggleStatus(id: string) {
    const coupon = await this.couponModel.findById(id);

    if (!coupon) {
      throw new NotFoundException('Coupon not found.');
    }
    coupon.isActive = !coupon.isActive;

    await coupon.save();

    return {
      success: true,
      message: `Coupon ${
        coupon.isActive ? 'activated' : 'deactivated'
      } successfully.`,
      data: coupon,
    };
  }
  async applyCoupon(userId: string, dto: ApplyCouponDto) {
    const coupon = await this.couponModel
      .findOne({
        code: dto.code.toUpperCase(),
      })
      .populate('products')
      .populate('categories')
      .populate('brands');

    if (!coupon) {
      throw new NotFoundException('Coupon not found.');
    }
    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is inactive.');
    }
    if (coupon.expiresAt < new Date()) {
      throw new BadRequestException('Coupon has expired.');
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached.');
    }
    const cart = await this.cartModel.findOne({ user: userId }).populate({
      path: 'items.product',
      populate: [
        {
          path: 'category',
        },
        {
          path: 'brand',
        },
      ],
    });

    if (!cart) {
      throw new NotFoundException('Cart not found.');
    }

    if (!cart.items.length) {
      throw new BadRequestException('Your cart is empty.');
    }

    await this.reCalculateCartTotal(cart);

    if (coupon.minimumPurchase && cart.subTotal < coupon.minimumPurchase) {
      throw new BadRequestException(
        `Minimum purchase amount is ${coupon.minimumPurchase}.`,
      );
    }

    if (coupon.products && coupon.products.length > 0) {
      const allowedProducts = coupon.products.map((item: any) =>
        item._id.toString(),
      );
      const hasAllowedProduct = cart.items.some((item: any) =>
        allowedProducts.includes(item.product._id.toString()),
      );

      if (!hasAllowedProduct) {
        throw new BadRequestException(
          'Coupon is not applicable for selected products.',
        );
      }
    }

    if (coupon.categories && coupon.categories.length > 0) {
      const allowedCategories = coupon.categories.map((item: any) =>
        item._id.toString(),
      );

      const hasAllowedCategory = cart.items.some((item: any) =>
        allowedCategories.includes(item.product.category.toString()),
      );

      if (!hasAllowedCategory) {
        throw new BadRequestException(
          'Coupon is not valid for these categories.',
        );
      }
    }

    if (coupon.brands && coupon.brands.length > 0) {
      const allowedBrands = coupon.brands.map((item: any) =>
        item._id.toString(),
      );

      const hasAllowedBrand = cart.items.some((item: any) =>
        allowedBrands.includes(item.product.brand.toString()),
      );

      if (!hasAllowedBrand) {
        throw new BadRequestException('Coupon is not valid for these brands.');
      }
    }

    let discount = 0;
    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (cart.subTotal * coupon.value) / 100;

      if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
        discount = coupon.maximumDiscount;
      }
    }

    if (coupon.type === CouponType.FIXED) {
      discount = coupon.value;

      if (discount > cart.subTotal) {
        discount = cart.subTotal;
      }
    }

    cart.discount = discount;
    cart.totalPrice = cart.subTotal - discount;
    cart.coupon = coupon._id;

    await cart.save();

    return await this.cartModel
      .findById(cart._id)
      .populate('coupon')
      .populate('items.product');
  }

  async removeCoupon(userId: string) {
    const cart = await this.cartModel
      .findOne({ user: userId })
      .populate('items.product')
      .populate('coupon');

    if (!cart?.coupon) {
      throw new BadRequestException('No coupon has been applied.');
    }

    cart.discount = 0;
    cart.coupon = null;
    cart.totalPrice = cart.subTotal;

    await cart.save();

    return await this.cartModel
      .findById(cart._id)
      .populate('items.product')
      .populate('coupon');
  }
}
