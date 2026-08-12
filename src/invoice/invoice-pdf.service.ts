import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { HInvoiceDocument } from 'src/DB/Models/invoice.model';

@Injectable()
export class InvoicePdfService {
  private formatMoney(amount: number, currency: string): string {
    return `${currency} ${amount.toFixed(2)}`;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  }

  async generateInvoicePdf(invoice: HInvoiceDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', reject);

      // HEADER

      doc.fontSize(24).font('Helvetica-Bold').text('Betak ElTani', 50, 50);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Official Purchase Invoice', 50, 80);

      doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', 380, 50, {
        width: 165,
        align: 'right',
      });

      doc.fontSize(10).font('Helvetica').text(invoice.invoiceNumber, 380, 80, {
        width: 165,
        align: 'right',
      });

      doc
        .fontSize(10)
        .text(`Date: ${this.formatDate(invoice.invoiceDate)}`, 380, 95, {
          width: 165,
          align: 'right',
        });

      // DIVIDER

      doc.moveTo(50, 125).lineTo(545, 125).stroke();

      // CUSTOMER

      doc.fontSize(12).font('Helvetica-Bold').text('BILL TO', 50, 150);

      doc.fontSize(10).font('Helvetica').text(invoice.customerName, 50, 172);

      doc.text(invoice.customerEmail, 50, 187);

      // ORDER INFO
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('ORDER INFORMATION', 300, 150);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Order ID: ${invoice.order}`, 300, 172);

      doc.text(`Payment: ${invoice.paymentMethod}`, 300, 187);

      doc.text(`Status: ${invoice.paymentStatus}`, 300, 202);

      // SHIPPING

      doc.fontSize(12).font('Helvetica-Bold').text('SHIPPING ADDRESS', 50, 240);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`City: ${invoice.shippingAddress.city}`, 50, 262);

      doc.text(`Region: ${invoice.shippingAddress.region}`, 50, 277);

      doc.text(`Postal Code: ${invoice.shippingAddress.postalCode}`, 50, 292);

      // ITEMS TABLE

      const tableTop = 335;

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('PURCHASE DETAILS', 50, tableTop);

      const headerY = tableTop + 30;

      doc.fontSize(9).font('Helvetica-Bold').text('PRODUCT', 50, headerY);

      doc.text('QTY', 300, headerY, {
        width: 40,
        align: 'center',
      });

      doc.text('UNIT PRICE', 350, headerY, {
        width: 80,
        align: 'right',
      });

      doc.text('TOTAL', 455, headerY, {
        width: 90,
        align: 'right',
      });

      doc
        .moveTo(50, headerY + 18)
        .lineTo(545, headerY + 18)
        .stroke();

      let currentY = headerY + 30;

      doc.font('Helvetica').fontSize(9);

      for (const item of invoice.items) {
        doc.text(item.productName, 50, currentY, {
          width: 230,
        });

        doc.text(String(item.quantity), 300, currentY, {
          width: 40,
          align: 'center',
        });

        doc.text(
          this.formatMoney(item.unitPrice, invoice.currency),
          350,
          currentY,
          {
            width: 80,
            align: 'right',
          },
        );

        doc.text(
          this.formatMoney(item.total, invoice.currency),
          455,
          currentY,
          {
            width: 90,
            align: 'right',
          },
        );

        currentY += 25;

        doc
          .moveTo(50, currentY - 8)
          .lineTo(545, currentY - 8)
          .stroke();
      }

      // SUMMARY
      currentY += 20;

      doc.fontSize(10).font('Helvetica');

      doc.text('Subtotal:', 350, currentY);

      doc.text(
        this.formatMoney(invoice.subtotal, invoice.currency),
        455,
        currentY,
        {
          width: 90,
          align: 'right',
        },
      );

      currentY += 20;

      doc.text('Discount:', 350, currentY);

      doc.text(
        `-${this.formatMoney(invoice.discountAmount, invoice.currency)}`,
        455,
        currentY,
        {
          width: 90,
          align: 'right',
        },
      );

      currentY += 15;

      doc.moveTo(350, currentY).lineTo(545, currentY).stroke();

      currentY += 15;

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('TOTAL PAID:', 350, currentY);

      doc.text(
        this.formatMoney(invoice.total, invoice.currency),
        455,
        currentY,
        {
          width: 90,
          align: 'right',
        },
      );

      // PAYMENT INFORMATION

      currentY += 55;

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('PAYMENT INFORMATION', 50, currentY);

      currentY += 22;

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Payment Method: ${invoice.paymentMethod}`, 50, currentY);

      currentY += 17;

      doc.text(`Payment Status: ${invoice.paymentStatus}`, 50, currentY);

      if (invoice.stripePaymentIntentId) {
        currentY += 17;

        doc.text(
          `Stripe Payment ID: ${invoice.stripePaymentIntentId}`,
          50,
          currentY,
        );
      }

      // FOOTER
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Thank you for your purchase!', 50, 730, {
          width: 495,
          align: 'center',
        });

      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          'This invoice was generated automatically by the e-commerce system.',
          50,
          750,
          {
            width: 495,
            align: 'center',
          },
        );

      doc.end();
    });
  }
}
