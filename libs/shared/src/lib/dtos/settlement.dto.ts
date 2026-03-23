import { ApiProperty } from '@nestjs/swagger';
import { MemberBalance, Transaction } from '../interfaces/settlement.interface';

export class MemberBalanceDto implements MemberBalance {
  @ApiProperty({
    description: 'Member name',
    example: 'John Doe',
  })
  member: string;

  @ApiProperty({
    description: 'Total amount paid by this member',
    example: 1500000,
  })
  totalPaid: number;

  @ApiProperty({
    description: 'Equal share this member should pay',
    example: 1000000,
  })
  share: number;

  @ApiProperty({
    description: 'Balance (positive = should receive, negative = owes)',
    example: 500000,
  })
  balance: number;

  @ApiProperty({
    description: 'Whether the member has settled their balance',
    example: false,
  })
  isSettled: boolean;
}

export class TransactionDto implements Transaction {
  @ApiProperty({
    description: 'Person who owes money',
    example: 'Alice',
  })
  from: string;

  @ApiProperty({
    description: 'Person who should receive money',
    example: 'Bob',
  })
  to: string;

  @ApiProperty({
    description: 'Amount to transfer',
    example: 250000,
  })
  amount: number;
}

export class SettlementResponseDto {
  @ApiProperty({
    description: 'Balance information for each member',
    type: [MemberBalanceDto],
  })
  balances: MemberBalanceDto[];

  @ApiProperty({
    description: 'Optimal transactions to settle all debts',
    type: [TransactionDto],
  })
  transactions: TransactionDto[];

  @ApiProperty({
    description: 'Total expenses for the trip',
    example: 3000000,
  })
  totalExpenses: number;

  @ApiProperty({
    description: 'Number of participants',
    example: 3,
  })
  participantCount: number;
}
