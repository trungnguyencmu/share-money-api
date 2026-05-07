import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({
    description: 'User ID (Cognito sub) of the trip member who paid',
    example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  payerUserId: string;

  @ApiProperty({
    description: 'Description of the expense',
    example: 'Dinner at restaurant',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Amount in VND (must be positive). If billId is provided, this is optional.',
    example: 500000,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Date of expense (ISO 8601). If billId is provided, this is auto-filled.',
    example: '2025-01-05',
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    description: 'Bill ID from scan-bill to auto-fill amount and date',
    example: 'bill-550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsOptional()
  billId?: string;
}

export class UpdateExpenseDto {
  @ApiPropertyOptional({
    description: 'User ID (Cognito sub) of the trip member who paid',
    example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  payerUserId?: string;

  @ApiPropertyOptional({
    description: 'Description of the expense',
    example: 'Updated expense description',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Amount in VND (must be positive)',
    example: 500000,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Date of expense (ISO 8601)',
    example: '2025-01-05',
  })
  @IsDateString()
  @IsOptional()
  date?: string;
}

export class ExpenseResponseDto {
  @ApiProperty({
    description: 'Trip identifier this expense belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  tripId: string;

  @ApiProperty({
    description: 'Unique expense identifier',
    example: 'exp-123456',
  })
  expenseId: string;

  @ApiProperty({
    description: 'User ID (Cognito sub) of the member who paid',
    example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
  })
  payerUserId: string;

  @ApiProperty({
    description: 'Current display name of the payer (resolved from member record)',
    example: 'John Doe',
  })
  payer: string;

  @ApiProperty({
    description: 'Description of the expense',
    example: 'Dinner at restaurant',
  })
  title: string;

  @ApiProperty({
    description: 'Amount in VND',
    example: 500000,
  })
  amount: number;

  @ApiProperty({
    description: 'Date of expense',
    example: '2025-01-05',
  })
  date: string;

  @ApiProperty({
    description: 'ISO timestamp when expense was created',
    example: '2025-01-05T10:30:00.000Z',
  })
  createdAt: string;

  @ApiPropertyOptional({
    description: 'Bill ID used to create this expense (if any)',
    example: 'bill-550e8400-e29b-41d4-a716-446655440000',
  })
  billId?: string;

  @ApiPropertyOptional({
    description: 'Presigned URL to view the bill image (expires in 15 min)',
    example: 'https://s3.amazonaws.com/...',
  })
  billImageUrl?: string;
}
