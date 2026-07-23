import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HProductDocument, Product } from 'src/DB/Models/products.model';
import { HReviewDocument, Review } from 'src/DB/Models/review.model';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<HReviewDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<HProductDocument>,
  ) {}

  async create(dto: CreateReviewDto, userId: string) {
    const productExists = await this.productModel.exists({ _id: dto.product });

    if (!productExists) {
      throw new NotFoundException('Product not found');
    }

    const alreadyReviewed = await this.reviewModel.exists({
      product: dto.product,
      user: userId,
    });
    if (alreadyReviewed) {
      throw new ConflictException('You have already reviewed this product');
    }

    const newReview = new this.reviewModel({
      ...dto,
      user: userId,
    });
    return (await newReview.save()).populate(
      'user',
      'firstName lastName email',
    );
  }

  async update(reviewId: string, dto: UpdateReviewDto, userId: string) {
    const review = await this.reviewModel.findOne({
      _id: reviewId,
      user: userId,
    });
    if (!review) {
      throw new NotFoundException(
        'Review not found or you are not authorized to update it',
      );
    }
    if (dto.rating) {
      review.rating = dto.rating;
    }
    if (dto.comment) {
      review.comment = dto.comment;
    }

    return (await review.save()).populate('user', 'firstName lastName email');
  }

  async findByProduct(productId: string) {
    return this.reviewModel
      .find({
        product: productId,
      })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  async delete(reviewId: string, userId: string) {
    const review = await this.reviewModel.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review not found');
    }
    await review.deleteOne();

    return { message: 'Review deleted successfully' };
  }
}
