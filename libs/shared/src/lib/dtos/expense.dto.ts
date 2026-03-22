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
    description: 'Name of the person who paid',
    example: 'John Doe',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  payer: string;

  @ApiProperty({
    description: 'Description of the expense',
    example: 'Dinner at restaurant',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Amount in VND (must be positive)',
    example: 500000,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Date of expense (ISO 8601)',
    example: '2025-01-05',
  })
  @IsDateString()
  date: string;
}

export class UpdateExpenseDto {
  @ApiPropertyOptional({
    description: 'Name of the person who paid',
    example: 'John Doe',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  payer?: string;

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
    description: 'Name of the person who paid',
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
}
