import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly ivLength = 16;
  private readonly encryptionKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.getOrThrow<string>('ENCRYPTION_SECRET_KEY');

    this.encryptionKey = Buffer.from(key, 'utf8');
    if (this.encryptionKey.length !== 32) {
      throw new Error('ENCRYPTION_SECRET_KEY must be exactly 32 bytes.');
    }
  }

  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}:${encrypted}`;
    } catch {
      throw new InternalServerErrorException('Encryption failed');
    }
  }

  decrypt(encryptedText: string): string {
    try {
      const [ivHex, encrypted] = encryptedText.split(':');

      if (!ivHex || !encrypted) {
        throw new Error('Invalid encrypted text.');
      }

      const iv = Buffer.from(ivHex, 'hex');

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');

      decrypted += decipher.final('utf8');

      return decrypted;
    } catch {
      throw new InternalServerErrorException('Decryption failed');
    }
  }
}
