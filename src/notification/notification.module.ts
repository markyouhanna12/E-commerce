import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { FirebaseProvider } from './providers/firebase.provider';
import { TokenService } from 'src/Common/Tokens/token.service';
import { JwtService } from '@nestjs/jwt';
import { UserModel } from 'src/DB/Models/user.model';

@Module({
  imports: [UserModel],
  controllers: [NotificationController],
  providers: [NotificationService, FirebaseProvider, TokenService, JwtService],
  exports: [NotificationService],
})
export class NotificationModule {}
