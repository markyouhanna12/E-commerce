import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import type { HUserDocument } from 'src/DB/Models/user.model';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('test-firebase')
  async testFirebase() {
    return this.notificationService.testFirebase();
  }

  @Post('register-device')
  @UseGuards(AuthGuard)
  async registerDevice(
    @CurrentUser() user: HUserDocument,
    @Body() registerDeviceDto: RegisterDeviceDto,
  ) {
    return this.notificationService.registerDevice(
      user,
      registerDeviceDto.token,
    );
  }

  @Post('test-send')
  @UseGuards(AuthGuard)
  async testSend(@CurrentUser() user: HUserDocument) {
    return this.notificationService.testSend(user);
  }
}
