import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ApplyCouponDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message:
      'Coupon code can only contain letters, numbers, hyphens, and underscores.',
  })
  code!: string;
}
