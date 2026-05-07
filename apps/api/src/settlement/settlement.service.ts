import { Injectable } from '@nestjs/common';
import {
  calculateBalances,
  calculateTransactions,
  SettlementResponseDto,
} from '@share-money/shared';
import { ExpensesRepository } from '../database/repositories/expenses.repository';
import { TripMembersRepository } from '../database/repositories/trip-members.repository';
import { TripsService } from '../trips/trips.service';

@Injectable()
export class SettlementService {
  constructor(
    private readonly expensesRepository: ExpensesRepository,
    private readonly tripMembersRepository: TripMembersRepository,
    private readonly tripsService: TripsService
  ) {}

  async calculateSettlement(
    tripId: string,
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<SettlementResponseDto> {
    const trip = await this.tripsService.verifyAccess(tripId, userId);

    const effectiveStartDate = startDate || trip.startDate;
    const effectiveEndDate = endDate || trip.endDate;

    const [expenses, members] = await Promise.all([
      this.expensesRepository.findByTripIdAndDateRange(
        tripId,
        effectiveStartDate,
        effectiveEndDate
      ),
      this.tripMembersRepository.findByTripId(tripId),
    ]);

    const memberNames = members.map((m) => m.displayName).sort();

    // Re-map each expense's payer to the CURRENT display name via payerUserId so
    // renames don't cause expenses to attribute to a stale name.
    const nameByUserId = new Map(members.map((m) => [m.userId, m.displayName]));
    const expensesWithCurrentPayer = expenses.map((e) => ({
      ...e,
      payer: nameByUserId.get(e.payerUserId) ?? e.payer,
    }));

    const balances = calculateBalances(expensesWithCurrentPayer, memberNames);

    // Merge isSettled status into balances
    const balancesWithSettled = balances.map((balance) => {
      const member = members.find((m) => m.displayName === balance.member);
      return {
        ...balance,
        isSettled: member?.isSettled ?? false,
      };
    });

    const transactions = calculateTransactions(balancesWithSettled);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return {
      balances: balancesWithSettled,
      transactions,
      totalExpenses,
      participantCount: memberNames.length || balances.length,
    };
  }
}
