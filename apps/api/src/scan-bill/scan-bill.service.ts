import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AnalyzeExpenseCommand,
  AnalyzeExpenseCommandInput,
  AnalyzeExpenseCommandOutput,
  TextractClient,
} from '@aws-sdk/client-textract';
import { Bill, BillUploadUrlResponseDto, RequestBillUploadUrlDto, ScanBillResponseDto, generateTimestamp } from '@share-money/shared';
import { BillsRepository } from '../database/repositories/bills.repository';
import { S3Service } from '../storage/s3.service';
import { TripsService } from '../trips/trips.service';

@Injectable()
export class ScanBillService {
  private readonly textract: TextractClient;
  private readonly imagesBucket: string;

  constructor(
    private readonly billsRepository: BillsRepository,
    private readonly tripsService: TripsService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {
    this.textract = new TextractClient({
      region: this.configService.get<string>('AWS_REGION') || 'ap-southeast-1',
    });
    this.imagesBucket =
      this.configService.get<string>('S3_IMAGES_BUCKET') || 'share-money-images-dev';
  }

  async requestUploadUrl(
    tripId: string,
    userId: string,
    dto: RequestBillUploadUrlDto,
  ): Promise<BillUploadUrlResponseDto> {
    await this.tripsService.verifyAccess(tripId, userId);

    const billId = `bill-${crypto.randomUUID()}`;
    const s3Key = `trips/${tripId}/bills/${billId}/${dto.fileName}`;

    const uploadUrl = await this.s3Service.generatePresignedUploadUrl(
      s3Key,
      dto.contentType,
    );

    return {
      uploadUrl,
      billId,
      s3Key,
      expiresIn: this.s3Service.getUploadUrlExpiry(),
    };
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

    // Handle Vietnamese thousands separator (e.g., "48.000" = 48000)
    // If last decimal part has exactly 3 digits and those digits are "000",
    // treat the dots as thousands separators and remove them
    const cleaned = value.replace(/[^0-9.]/g, '');

    // Check if this looks like Vietnamese format: "48.000" or "1.234.567"
    const parts = cleaned.split('.');
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1];
      // If last part is exactly 3 digits and all are zeros (e.g., "48.000" -> 48000)
      // or has thousands separators (e.g., "1.234.567" -> 1234567)
      if (/^\d{1,3}$/.test(lastPart) && lastPart === '000') {
        // Vietnamese format with . as thousands separator
        return parseInt(cleaned.replace(/\./g, ''), 10) || 0;
      }
      if (parts.length >= 3 && parts.every((p, i) => i === parts.length - 1 || p.length === 3)) {
        // Multiple groups of 3 digits separated by dots (e.g., "1.234.567")
        return parseInt(cleaned.replace(/\./g, ''), 10) || 0;
      }
    }

    return parseFloat(cleaned) || 0;
  }

  private normalizeDate(value?: string): string | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toISOString().split('T')[0];
  }
}
