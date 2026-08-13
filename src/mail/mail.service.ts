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
        template: './otp.ejs',
        context: { confirmEmailOTP: otp },
      });
      this.logger.log(`Verfication code successfully sent to : ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to : ${email}`);
    }
  }

  async sendInvoiceEmail(
    email: string,
    customerName: string,
    invoiceNumber: string,
    total: number,
    currency: string,
    pdfBuffer: Buffer,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Your Invoice ${invoiceNumber}`,
        template: './invoice.ejs',
        context: {
          customerName,
          invoiceNumber,
          total: total.toFixed(2),
          currency,
        },
        attachments: [
          {
            filename: `${invoiceNumber}.pdf`,
            content: pdfBuffer,
            conentType: 'application/pdf',
          },
        ],
      });

      this.logger.log(
        `Invoice ${invoiceNumber} successfully sent to : ${email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send invoice ${invoiceNumber} to : ${email}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
