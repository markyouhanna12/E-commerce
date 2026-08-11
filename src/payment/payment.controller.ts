import { Controller } from '@nestjs/common';
import { PaymentsService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentsService) {}
}
