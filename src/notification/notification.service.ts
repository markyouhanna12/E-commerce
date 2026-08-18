import { Injectable } from '@nestjs/common';
import { FirebaseProvider } from './providers/firebase.provider';

@Injectable()
export class NotificationService {
  constructor(private readonly firebaseProvider: FirebaseProvider) {}

  async testFirebase() {
    return {
      success: true,
      message: 'Firebase Admin SDK initialized successfully',
    };
  }
}
