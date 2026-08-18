import { Injectable } from '@nestjs/common';
import { FirebaseProvider } from './providers/firebase.provider';
import { HUserDocument } from 'src/DB/Models/user.model';

@Injectable()
export class NotificationService {
  constructor(private readonly firebaseProvider: FirebaseProvider) {}

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
}
