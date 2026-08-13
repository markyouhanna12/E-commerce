import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoiceModel } from 'src/DB/Models/invoice.model';
import { OrderModel } from 'src/DB/Models/order.model';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from 'src/Common/Tokens/token.service';
import { MailModule } from 'src/mail/mail.module';
import { UserModel } from 'src/DB/Models/user.model';
import { InvoicePdfService } from './invoice-pdf.service';

@Module({
  imports: [InvoiceModel, OrderModel, UserModel, MailModule],
  controllers: [InvoiceController],
  providers: [InvoiceService, JwtService, TokenService, InvoicePdfService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
