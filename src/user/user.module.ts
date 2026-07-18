import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserModel } from 'src/DB/Models/user.model';
import { TokenModule } from 'src/Common/Tokens/token.module';

@Module({
  imports: [UserModel, TokenModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
