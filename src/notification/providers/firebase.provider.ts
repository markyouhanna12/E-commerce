import { Injectable } from '@nestjs/common';
import { cert, getApps, initializeApp } from 'firebase-admin';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseProvider {
  private readonly firebaseMessaging: Messaging;

  constructor(private readonly configService: ConfigService) {
    const firebaseConfigPath = this.configService.get<string>(
      'FIREBASE_CONFIG_PATH',
    );
    if (!firebaseConfigPath) {
      throw new Error('FIREBASE_CONFIG_PATH is not configured');
    }
    const absolutePath = path.resolve(firebaseConfigPath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(
        `Firebase service account file not found: ${absolutePath}`,
      );
    }

    const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));

    const app =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            credential: cert(serviceAccount),
          });

    this.firebaseMessaging = getMessaging(app);
  }

  async sendToToken(token: string, title: string, body: string) {
    return this.firebaseMessaging.send({
      token,
      notification: {
        title,
        body,
      },
    });
  }
}
