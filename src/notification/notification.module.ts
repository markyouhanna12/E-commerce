import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { FirebaseProvider } from './providers/firebase.provider';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, FirebaseProvider],
  exports: [NotificationService],
})
export class NotificationModule {}
