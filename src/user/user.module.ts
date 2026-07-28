import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserModel } from 'src/DB/Models/user.model';
import { TokenModule } from 'src/Common/Tokens/token.module';
import { EncryptionModule } from 'src/Common/Encryption/encryption.module';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [UserModel, TokenModule, EncryptionModule, CacheModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
