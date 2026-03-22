import {
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
import { ExpensesRepository } from '../database/repositories/expenses.repository';
import { TripsService } from '../trips/trips.service';

@Injectable()
export class ExpensesService {
  private readonly adminPassword: string;

  constructor(
    private readonly expensesRepository: ExpensesRepository,
    private readonly tripsService: TripsService,
    private readonly configService: ConfigService
  ) {
    const password = this.configService.get<string>('ADMIN_PASSWORD');
    if (!password || password === 'ok' || password === 'CHANGE_ME_strong_password') {
      const nodeEnv = this.configService.get<string>('NODE_ENV');
      if (nodeEnv === 'production') {
        throw new Error(
          'ADMIN_PASSWORD must be set to a strong value in production. ' +
          'Do not use default or placeholder values.'
        );
      }
    }
    this.adminPassword = password || 'ok';
  }

  async create(tripId: string, userId: string, createExpenseDto: CreateExpenseDto) {
    await this.tripsService.verifyOwnership(tripId, userId);

    const expense = {
      tripId,
      expenseId: generateExpenseId(),
      ...createExpenseDto,
      createdAt: generateTimestamp(),
    };

    return this.expensesRepository.create(expense);
  }

  async findAll(tripId: string, userId: string) {
    await this.tripsService.verifyOwnership(tripId, userId);
    return this.expensesRepository.findByTripId(tripId);
  }

  async findOne(tripId: string, expenseId: string, userId: string) {
    await this.tripsService.verifyOwnership(tripId, userId);

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
    updateExpenseDto: UpdateExpenseDto
  ) {
    await this.tripsService.verifyOwnership(tripId, userId);

    const expense = await this.expensesRepository.findById(tripId, expenseId);

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${expenseId} not found`);
    }

    return this.expensesRepository.update(tripId, expenseId, updateExpenseDto);
  }

  async remove(tripId: string, expenseId: string, userId: string, password: string) {
    await this.tripsService.verifyOwnership(tripId, userId);

    if (!this.verifyPassword(password)) {
      throw new UnauthorizedException('Invalid password');
    }

    const expense = await this.expensesRepository.findById(tripId, expenseId);

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${expenseId} not found`);
    }

    await this.expensesRepository.delete(tripId, expenseId);
  }

  async removeAll(tripId: string, userId: string, password: string) {
    await this.tripsService.verifyOwnership(tripId, userId);

    if (!this.verifyPassword(password)) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.expensesRepository.deleteAllByTripId(tripId);
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
