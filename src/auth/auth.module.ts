import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModel } from 'src/DB/Models/user.model';
import { MailModule } from 'src/mail/mail.module';
import { TokenModule } from 'src/Common/Tokens/token.module';
import { EncryptionModule } from 'src/Common/Encryption/encryption.module';

@Module({
  imports: [UserModel, MailModule, TokenModule, EncryptionModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
