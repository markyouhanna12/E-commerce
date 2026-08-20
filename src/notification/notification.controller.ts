import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
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

  @Delete('unregister-device')
  @UseGuards(AuthGuard)
  async unregisterDevice(
    @CurrentUser() user: HUserDocument,
    @Body() registerDeviceDto: RegisterDeviceDto,
  ) {
    return this.notificationService.unregisterDevice(
      user,
      registerDeviceDto.token,
    );
  }

  @Post('test-send')
  @UseGuards(AuthGuard)
  async testSend(@CurrentUser() user: HUserDocument) {
    return this.notificationService.sendToUser({
      userId: user._id.toString(),

      title: 'Test Notification',

      body: 'Hello from your NestJS e-commerce application!',

      type: 'TEST_NOTIFICATION',

      data: {
        source: 'test-api',
      },
    });
  }
}
