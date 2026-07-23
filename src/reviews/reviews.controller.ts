import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RoleEnum } from 'src/Common/Enums/user.enums';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':productId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.USER, RoleEnum.ADMIN)
  async findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }
  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.USER)
  async create(@Body() dto: CreateReviewDto, @Req() req: any) {
    const userId = req.user._id;
    return this.reviewsService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.USER)
  async update(
    @Body() dto: UpdateReviewDto,
    @Req() req: any,
    @Param('id') ReviewId: string,
  ) {
    const userId = req.user._id;
    return this.reviewsService.update(ReviewId, dto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  async delete(@Req() req: any, @Param('id') ReviewId: string) {
    const userId = req.user._id;
    return this.reviewsService.delete(ReviewId, userId);
  }
}
