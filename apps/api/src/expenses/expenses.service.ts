import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  generateExpenseId,
  generateTimestamp,
} from '@share-money/shared';
import { BillsRepository } from '../database/repositories/bills.repository';
import { ExpensesRepository } from '../database/repositories/expenses.repository';
import { TripMembersRepository } from '../database/repositories/trip-members.repository';
import { TripsService } from '../trips/trips.service';

@Injectable()
export class ExpensesService {
  private readonly adminPassword: string;

  constructor(
    private readonly expensesRepository: ExpensesRepository,
    private readonly billsRepository: BillsRepository,
    private readonly tripMembersRepository: TripMembersRepository,
    private readonly tripsService: TripsService,
    private readonly configService: ConfigService,
  ) {
    const password = this.configService.get<string>('ADMIN_PASSWORD');
    if (!password || password === 'ok' || password === 'CHANGE_ME_strong_password') {
      const nodeEnv = this.configService.get<string>('NODE_ENV');
      if (nodeEnv === 'production') {
        throw new Error(
          'ADMIN_PASSWORD must be set to a strong value in production. ' +
          'Do not use default or placeholder values.',
        );
      }
    }
    this.adminPassword = password || 'ok';
  }

  async create(tripId: string, userId: string, createExpenseDto: CreateExpenseDto) {
    await this.tripsService.verifyAccess(tripId, userId);
    await this.validatePayer(tripId, createExpenseDto.payer);

    let amount = createExpenseDto.amount;
    let date = createExpenseDto.date;
    let billId = createExpenseDto.billId;

    if (billId) {
      const bill = await this.billsRepository.findById(tripId, billId);
      if (!bill) {
        throw new NotFoundException(`Bill with ID ${billId} not found in this trip`);
      }
      amount = amount ?? bill.totalAmount;
      date = date ?? bill.billDate;
      billId = bill.billId;
    }

    if (!amount) {
      throw new BadRequestException('Amount is required. Provide amount or billId.');
    }
    if (!date) {
      throw new BadRequestException('Date is required. Provide date or billId.');
    }

    const expense = {
      tripId,
      expenseId: generateExpenseId(),
      payer: createExpenseDto.payer,
      title: createExpenseDto.title,
      amount,
      date,
      billId,
      createdAt: generateTimestamp(),
    };

    return this.expensesRepository.create(expense);
  }

  async findAll(tripId: string, userId: string) {
    await this.tripsService.verifyAccess(tripId, userId);
    return this.expensesRepository.findByTripId(tripId);
  }

  async findOne(tripId: string, expenseId: string, userId: string) {
    await this.tripsService.verifyAccess(tripId, userId);

    const expense = await this.expensesRepository.findById(tripId, expenseId);
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${expenseId} not found`);
    }

    return expense;
  }

  async update(
    tripId: string,
    expenseId: string,
    userId: string,
    updateExpenseDto: UpdateExpenseDto,
  ) {
    await this.tripsService.verifyAccess(tripId, userId);

    const expense = await this.expensesRepository.findById(tripId, expenseId);
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${expenseId} not found`);
    }

    if (updateExpenseDto.payer) {
      await this.validatePayer(tripId, updateExpenseDto.payer);
    }

    return this.expensesRepository.update(tripId, expenseId, updateExpenseDto);
  }

  async remove(tripId: string, expenseId: string, userId: string) {
    await this.tripsService.verifyAccess(tripId, userId);

    const expense = await this.expensesRepository.findById(tripId, expenseId);
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${expenseId} not found`);
    }

    await this.expensesRepository.delete(tripId, expenseId);
  }

  async removeAll(tripId: string, userId: string, password: string) {
    await this.tripsService.verifyAccess(tripId, userId);

    if (!this.verifyPassword(password)) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.expensesRepository.deleteAllByTripId(tripId);
  }

  private async validatePayer(tripId: string, payer: string): Promise<void> {
    const names = await this.tripMembersRepository.getMemberDisplayNames(tripId);
    const match = names.some(
      (name) => name.toLowerCase() === payer.trim().toLowerCase(),
    );

    if (!match) {
      throw new BadRequestException(
        `Payer "${payer}" is not a member of this trip. ` +
        `Members: ${names.join(', ') || '(none)'}`,
      );
    }
  }

  private verifyPassword(input: string): boolean {
    const expected = Buffer.from(this.adminPassword);
    const actual = Buffer.from(input);
    if (expected.length !== actual.length) {
      return false;
    }
    return timingSafeEqual(expected, actual);
  }
}
