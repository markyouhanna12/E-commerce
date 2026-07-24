import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Coupon, HCouponDocument } from 'src/DB/Models/coupon.model';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<HCouponDocument>,
  ) {}

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
    if (!existingCoupon) {
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
  async applyCoupon(userId: string, applyCouponDto: ApplyCouponDto) {}

  async removeCoupon(userId: string) {}
}
