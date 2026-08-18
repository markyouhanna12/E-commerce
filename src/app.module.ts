import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join, resolve } from 'path';
import { DatabaseModule } from './DB/database.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { LoggerMiddleware } from './Common/Middlewares/logger.middleware';
import { AuthController } from './auth/auth.controller';
import { CategoryModule } from './category/category.module';
import { BrandModule } from './brand/brand.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CouponsModule } from './coupons/coupons.module';
import { CacheModule } from './cache/cache.module';
import { OrdersModule } from './orders/orders.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { PaymentModule } from './payment/payment.module';
import { InvoiceModule } from './invoice/invoice.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: resolve('./config/dev.env'),
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      context: ({ req }) => ({ req }),
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
    MailModule,
    CategoryModule,
    BrandModule,
    ProductsModule,
    CartModule,
    ReviewsModule,
    CouponsModule,
    CacheModule,
    OrdersModule,
    PaymentModule,
    InvoiceModule,
    WishlistModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes(AuthController);
  }
}
