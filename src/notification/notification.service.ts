import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseProvider } from './providers/firebase.provider';
import { HUserDocument, User } from 'src/DB/Models/user.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class NotificationService {
  constructor(
    private readonly firebaseProvider: FirebaseProvider,

    @InjectModel(User.name)
    private readonly userModel: Model<HUserDocument>,
  ) {}

  async testFirebase() {
    return {
      success: true,
      message: 'Firebase Admin SDK initialized successfully',
    };
  }

  async registerDevice(user: HUserDocument, token: string) {
    if (!user.notificationTokens.includes(token)) {
      user.notificationTokens.push(token);
      await user.save();
    }
    return {
      success: true,
      message: 'Device registered successfully',
    };
  }

  async unregisterDevice(user: HUserDocument, token: string) {
    if (!token) {
      throw new BadRequestException('FCM token is required');
    }

    user.notificationTokens = user.notificationTokens.filter(
      (registeredToken) => registeredToken !== token,
    );
    await user.save();

    return {
      success: true,
      message: 'Device unregistered successfully',
    };
  }

  async sendNotification(token: string, title: string, body: string) {
    return this.firebaseProvider.sendToToken(token, title, body);
  }

  async testSend(user: HUserDocument) {
    const token = user.notificationTokens[0];

    if (!token) {
      throw new BadRequestException(
        'User has no registered notification device',
      );
    }

    return this.firebaseProvider.sendToToken(
      token,
      'Test Notification',
      'Hello from your NestJS e-commerce application!',
    );
  }

  async sendToUser(userId: string, title: string, body: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.notificationTokens || user.notificationTokens.length === 0) {
      return {
        success: false,
        message: 'User has no registered notification devices',
      };
    }

    const results = await Promise.allSettled(
      user.notificationTokens.map((token) =>
        this.firebaseProvider.sendToToken(token, title, body),
      ),
    );

    return {
      success: true,
      message: 'Notification sent',
      results,
    };
  }
}
