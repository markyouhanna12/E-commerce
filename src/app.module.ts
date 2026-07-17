import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: resolve('./config/dev.env'),
      isGlobal: true,
    }),
    MongooseModule.forRoot('mongodb://localhost:27017/E-commerce', {
      onConnectionCreate: (connection: Connection) => {
        connection.on('connected', () => {
          console.log('MongoDB connected successfully');
        });
      },
    }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
