import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HProductDocument, Product } from 'src/DB/Models/products.model';
import { HWishlistDocument, Wishlist } from 'src/DB/Models/wishlist.model';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name)
    private readonly wishlistModel: Model<HWishlistDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<HProductDocument>,
  ) {}

  async addProduct(userId: string, productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let wishlist = await this.wishlistModel.findOne({
      user: new Types.ObjectId(userId),
    });

    if (!wishlist) {
      wishlist = await this.wishlistModel.create({
        user: new Types.ObjectId(userId),
        products: [new Types.ObjectId(productId)],
      });

      return {
        message: 'Product added to wishlist',
        status: 201,
        wishlist,
      };
    }

    const alreadyExists = wishlist.products.some(
      (id) => id.toString() === productId,
    );

    if (alreadyExists) {
      throw new BadRequestException('Product is already in your wishlist');
    }

    wishlist.products.push(new Types.ObjectId(productId));

    await wishlist.save();

    return {
      message: 'Product added to wishlist',
      status: 200,
      wishlist,
    };
  }

  async removeProduct(userId: string, productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const wishlist = await this.wishlistModel.findOne({
      user: new Types.ObjectId(userId),
    });

    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }

    const productExists = wishlist.products.some(
      (id) => id.toString() === productId,
    );

    if (!productExists) {
      throw new NotFoundException('Product is not in your wishlist');
    }

    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId,
    );

    await wishlist.save();

    return {
      message: 'Product removed from wishlist',
      status: 200,
      wishlist,
    };
  }

  async getWishlist(userId: string) {
    const wishlist = await this.wishlistModel
      .findOne({
        user: new Types.ObjectId(userId),
      })
      .populate('products');

    if (!wishlist) {
      return {
        message: 'Wishlist fetched successfully',
        status: 200,
        wishlist: {
          products: [],
        },
      };
    }
    return {
      message: 'Wishlist fetched successfully',
      status: 200,
      wishlist,
    };
  }

  async checkProduct(userId: string, productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const wishlist = await this.wishlistModel.findOne({
      user: new Types.ObjectId(userId),
      products: new Types.ObjectId(productId),
    });

    return {
      message: 'Wishlist status fetched successfully',
      status: 200,
      isInWishlist: !!wishlist,
    };
  }

  async clearWishlist(userId: string) {
    const wishlist = await this.wishlistModel.findOne({
      user: new Types.ObjectId(userId),
    });
    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }

    wishlist.products = [];

    await wishlist.save();

    return {
      message: 'Wishlist cleared successfully',
      status: 200,
    };
  }
}
