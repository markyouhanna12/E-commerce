import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationOtp(email: string, otp: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your activation Code',
        template: './otp',
        context: { confirmEmailOTP: otp },
      });
      this.logger.log(`Verfication code successfully sent to : ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to : ${email}`);
    }
  }
}
