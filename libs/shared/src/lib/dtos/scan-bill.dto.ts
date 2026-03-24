import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ScanBillDto {
  @ApiProperty({
    description: 'S3 key of the uploaded bill image',
    example: 'trips/123/bills/bill-abc123/receipt.jpg',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  s3Key: string;
}

export class ScanBillResponseDto {
  @ApiProperty({
    description: 'Unique bill identifier',
    example: 'bill-550e8400-e29b-41d4-a716-446655440000',
  })
  billId: string;

  @ApiProperty({
    description: 'Extracted total amount from the bill',
    example: 45.99,
  })
  totalAmount: number;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'USD',
  })
  currency?: string;

  @ApiPropertyOptional({
    description: 'Detected bill date (ISO date string)',
    example: '2026-03-24',
  })
  billDate?: string;

  @ApiProperty({
    description: 'S3 key of the bill image',
    example: 'trips/123/bills/bill-abc123/receipt.jpg',
  })
  s3Key: string;
}
