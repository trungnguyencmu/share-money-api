import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AnalyzeExpenseCommand,
  AnalyzeExpenseCommandInput,
  AnalyzeExpenseCommandOutput,
  TextractClient,
} from '@aws-sdk/client-textract';
import { Bill, ScanBillResponseDto, generateTimestamp } from '@share-money/shared';
import { BillsRepository } from '../database/repositories/bills.repository';
import { TripsService } from '../trips/trips.service';

@Injectable()
export class ScanBillService {
  private readonly textract: TextractClient;
  private readonly imagesBucket: string;

  constructor(
    private readonly billsRepository: BillsRepository,
    private readonly tripsService: TripsService,
    private readonly configService: ConfigService,
  ) {
    this.textract = new TextractClient({
      region: this.configService.get<string>('AWS_REGION') || 'ap-southeast-1',
    });
    this.imagesBucket =
      this.configService.get<string>('S3_IMAGES_BUCKET') || 'share-money-images-dev';
  }

  async scanBill(
    tripId: string,
    userId: string,
    s3Key: string,
  ): Promise<ScanBillResponseDto> {
    await this.tripsService.verifyAccess(tripId, userId);

    const input: AnalyzeExpenseCommandInput = {
      Document: {
        S3Object: {
          Bucket: this.imagesBucket,
          Name: s3Key,
        },
      },
    };

    const command = new AnalyzeExpenseCommand(input);
    const response: AnalyzeExpenseCommandOutput = await this.textract.send(command);

    const expenseResult = this.extractExpenseResult(response);
    const billId = `bill-${crypto.randomUUID()}`;

    const bill: Bill = {
      tripId,
      billId,
      s3Key,
      totalAmount: expenseResult.totalAmount,
      currency: expenseResult.currency,
      billDate: expenseResult.billDate,
      scannedAt: generateTimestamp(),
      scannedByUserId: userId,
    };

    await this.billsRepository.create(bill);

    return {
      billId,
      totalAmount: expenseResult.totalAmount,
      currency: expenseResult.currency,
      billDate: expenseResult.billDate,
      s3Key,
    };
  }

  private extractExpenseResult(
    response: AnalyzeExpenseCommandOutput,
  ): { totalAmount: number; currency?: string; billDate?: string } {
    const expenseDocuments = response.ExpenseDocuments || [];

    for (const doc of expenseDocuments) {
      const summaryFields = doc.SummaryFields || [];

      let totalAmount = 0;
      let currency: string | undefined;
      let billDate: string | undefined;

      for (const field of summaryFields) {
        const type = field.Type?.Text;
        const value = field.ValueDetection?.Text;

        if (type === 'TOTAL' || type === 'TOTAL_AMOUNT') {
          totalAmount = this.parseAmount(value);
        } else if (type === 'CURRENCY') {
          currency = value;
        } else if (type === 'INVOICE_RECEIPT_DATE' || type === 'DATE') {
          billDate = this.normalizeDate(value);
        }
      }

      if (totalAmount > 0) {
        return { totalAmount, currency, billDate };
      }
    }

    return { totalAmount: 0 };
  }

  private parseAmount(value?: string): number {
    if (!value) return 0;
    const cleaned = value.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  private normalizeDate(value?: string): string | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toISOString().split('T')[0];
  }
}
