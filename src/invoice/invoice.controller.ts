import { Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Types } from 'mongoose';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RoleEnum } from 'src/Common/Enums/user.enums';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { Response } from 'express';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post(':orderId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.USER)
  async createInvoice(@Param('orderId') orderId: string) {
    return this.invoiceService.createInvoice(new Types.ObjectId(orderId));
  }

  @Get(':invoiceId/pdf')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.USER)
  async downloadInvoicePdf(
    @Param('invoiceId') invoiceId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.invoiceService.generateInvoicePdf(invoiceId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoiceId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
