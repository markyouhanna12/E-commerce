import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModel } from 'src/DB/Models/user.model';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [UserModel, MailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
