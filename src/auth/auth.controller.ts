import {
  Body,
  Controller,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/createUser.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { LoginDto } from './dto/login.dto';
import { LoggingIntercepotor } from 'src/Common/Interceptors/logging.interceptor';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/Common/Utils/multer.utils';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.authService.register(createUserDto);
  }

  @Post('confirm-email')
  async confirmEmail(@Body() confirmEmailDto: ConfirmEmailDto) {
    return await this.authService.confirmEmail(confirmEmailDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Patch('profile-pic')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async updateProfilePic(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { userId } = req.body;
    const filePath = file.path;
    return await this.authService.updateProfilePic(filePath, userId);
  }
}
