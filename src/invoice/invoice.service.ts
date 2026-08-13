import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Invoice,
  HInvoiceDocument,
  InvoiceItem,
} from 'src/DB/Models/invoice.model';
import { HOrderDocument, Order } from 'src/DB/Models/order.model';
import { HUserDocument } from 'src/DB/Models/user.model';
import { InvoicePdfService } from './invoice-pdf.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<HInvoiceDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<HOrderDocument>,
    private readonly invoicePdfService: InvoicePdfService,
    private readonly mailService: MailService,
  ) {}

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();

    const count = await this.invoiceModel.countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
      },
    });
    const sequence = String(count + 1).padStart(6, '0');

    return `INV-${year}-${sequence}`;
  }

  async createInvoice(orderId: Types.ObjectId) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const existingInvoice = await this.invoiceModel.findOne({
      order: orderId,
    });
    if (existingInvoice) {
      return existingInvoice;
    }

    const order = await this.orderModel
      .findById(orderId)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name');

    if (!order) {
      throw new NotFoundException('Order Not Found');
    }

    const user = order.user as unknown as HUserDocument;

    if (!user) {
      throw new NotFoundException('Order user not found');
    }

    if (!user.email) {
      throw new BadRequestException(
        'Customer email is required to create invoice',
      );
    }

    const invoiceItems: InvoiceItem[] = [];

    for (const item of order.items) {
      const product = item.product as any;

      invoiceItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.priceSnapshot,
        total: item.priceSnapshot * item.quantity,
      });
    }

    const invoiceNumber = await this.generateInvoiceNumber();

    const customerName =
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

    const invoice = await this.invoiceModel.create({
      invoiceNumber,
      order: order._id,
      user: user._id,
      customerName,
      customerEmail: user.email,
      items: invoiceItems,
      subtotal: order.subTotal,
      discountAmount: order.discountAmount,
      total: order.finalPrice,
      currency: 'USD',
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,

      shippingAddress: {
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        region: order.shippingAddress.region,
      },

      invoiceDate: new Date(),

      stripePaymentIntentId: order.intentId,
    });

    return invoice;
  }

  async generateInvoicePdf(invoiceId: string): Promise<Buffer> {
    if (!Types.ObjectId.isValid(invoiceId)) {
      throw new BadRequestException('Invalid invoice ID');
    }

    const invoice = await this.invoiceModel.findById(invoiceId);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.invoicePdfService.generateInvoicePdf(invoice);
  }

  async sendInvoiceEmail(invoiceId: string): Promise<void> {
    if (!Types.ObjectId.isValid(invoiceId)) {
      throw new BadRequestException('Invalid invoice ID');
    }

    const invoice = await this.invoiceModel.findById(invoiceId);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const pdfBuffer = await this.invoicePdfService.generateInvoicePdf(invoice);

    await this.mailService.sendInvoiceEmail(
      invoice.customerEmail,
      invoice.customerName,
      invoice.invoiceNumber,
      invoice.total,
      invoice.currency,
      pdfBuffer,
    );
  }

  async processInvoice(orderId: Types.ObjectId) {
    const invoice = await this.createInvoice(orderId);

    if (invoice.emailSentAt) {
      return {
        invoice,
        emailSent: false,
        message: 'Invoice email has already been sent',
      };
    }

    const pdfBuffer = await this.invoicePdfService.generateInvoicePdf(invoice);

    await this.mailService.sendInvoiceEmail(
      invoice.customerEmail,
      invoice.customerName,
      invoice.invoiceNumber,
      invoice.total,
      invoice.currency,
      pdfBuffer,
    );

    invoice.emailSentAt = new Date();
    invoice.pdfFileName = `${invoice.invoiceNumber}.pdf`;

    await invoice.save();

    return {
      invoice,
      emailSent: true,
    };
  }
}
