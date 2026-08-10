import { BadRequestException, Injectable, RawBody } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  }

  async checkoutSession({
    success_url = process.env.SUCCESS_URL as string,
    cancel_url = process.env.CANCEL_URL as string,
    discounts = [],
    metadata = {},
    line_items,
    mode = 'payment',
    customer_email,
  }: Stripe.Checkout.SessionCreateParams) {
    const session = await this.stripe.checkout.sessions.create({
      success_url,
      cancel_url,
      line_items,
      mode,
      discounts,
      metadata,
      customer_email,
    });

    return session;
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  }

  async createCoupon(data: Stripe.CouponCreateParams) {
    const coupon = await this.stripe.coupons.create(data);

    return coupon;
  }

  async createPaymentMethod(data: Stripe.PaymentMethodCreateParams) {
    const method = await this.stripe.paymentMethods.create(data);

    return method;
  }

  async createPaymentIntent(data: Stripe.PaymentIntentCreateParams) {
    const intent = await this.stripe.paymentIntents.create(data);

    return intent;
  }

  async retrivePaymentIntents(id: string) {
    const intent = await this.stripe.paymentIntents.retrieve(id);

    return intent;
  }

  async confirmPaymentIntent(id: string) {
    const intent = await this.retrivePaymentIntents(id);

    if (!intent) {
      throw new BadRequestException('Invalid Payment Intent ID');
    }
    const confirmIntent = await this.stripe.paymentIntents.confirm(id);

    return confirmIntent;
  }
}
