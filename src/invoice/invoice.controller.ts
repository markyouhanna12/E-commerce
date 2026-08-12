import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Types } from 'mongoose';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RoleEnum } from 'src/Common/Enums/user.enums';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post(':orderId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.USER)
  async createInvoice(@Param('orderId') orderId: string) {
    return this.invoiceService.createInvoice(new Types.ObjectId(orderId));
  }
}
