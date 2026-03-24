export interface Bill {
  tripId: string;
  billId: string;
  s3Key: string;
  totalAmount: number;
  currency?: string;
  billDate?: string;
  scannedAt: string;
  scannedByUserId: string;
}
