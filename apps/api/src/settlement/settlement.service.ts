import { Injectable } from '@nestjs/common';
import {
  calculateBalances,
  calculateTransactions,
  SettlementResult,
} from '@share-money/shared';
import { ExpensesRepository } from '../database/repositories/expenses.repository';
import { TripMembersRepository } from '../database/repositories/trip-members.repository';
import { TripsService } from '../trips/trips.service';

@Injectable()
export class SettlementService {
  constructor(
    private readonly expensesRepository: ExpensesRepository,
    private readonly tripMembersRepository: TripMembersRepository,
    private readonly tripsService: TripsService,
  ) {}

  async calculateSettlement(tripId: string, userId: string): Promise<SettlementResult> {
    await this.tripsService.verifyAccess(tripId, userId);

    const [expenses, memberNames] = await Promise.all([
      this.expensesRepository.findByTripId(tripId),
      this.tripMembersRepository.getMemberDisplayNames(tripId),
    ]);

    const balances = calculateBalances(expenses, memberNames);
    const transactions = calculateTransactions(balances);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return {
      balances,
      transactions,
      totalExpenses,
      participantCount: memberNames.length || balances.length,
    };
  }
}
