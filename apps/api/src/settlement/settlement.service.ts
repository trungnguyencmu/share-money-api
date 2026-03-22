import { Injectable } from '@nestjs/common';
import {
  calculateBalances,
  calculateTransactions,
  SettlementResult,
} from '@share-money/shared';
import { ExpensesRepository } from '../database/repositories/expenses.repository';
import { ParticipantsRepository } from '../database/repositories/participants.repository';
import { TripsService } from '../trips/trips.service';

@Injectable()
export class SettlementService {
  constructor(
    private readonly expensesRepository: ExpensesRepository,
    private readonly participantsRepository: ParticipantsRepository,
    private readonly tripsService: TripsService
  ) {}

  async calculateSettlement(tripId: string, userId: string): Promise<SettlementResult> {
    // Verify user has access to this trip
    await this.tripsService.verifyOwnership(tripId, userId);

    // Get all expenses for the trip
    const expenses = await this.expensesRepository.findByTripId(tripId);

    // Get participant names
    const participantNames = await this.participantsRepository.getParticipantNames(tripId);

    // Calculate balances
    const balances = calculateBalances(expenses, participantNames);

    // Calculate optimal transactions
    const transactions = calculateTransactions(balances);

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return {
      balances,
      transactions,
      totalExpenses,
      participantCount: participantNames.length || balances.length,
    };
  }
}
