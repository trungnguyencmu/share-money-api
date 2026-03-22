import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { AddParticipantDto, generateTimestamp } from '@share-money/shared';
import { ExpensesRepository } from '../database/repositories/expenses.repository';
import { ParticipantsRepository } from '../database/repositories/participants.repository';
import { TripsService } from '../trips/trips.service';

@Injectable()
export class ParticipantsService {
  constructor(
    private readonly participantsRepository: ParticipantsRepository,
    private readonly expensesRepository: ExpensesRepository,
    private readonly tripsService: TripsService
  ) {}

  async create(tripId: string, userId: string, addParticipantDto: AddParticipantDto) {
    await this.tripsService.verifyOwnership(tripId, userId);

    const exists = await this.participantsRepository.exists(
      tripId,
      addParticipantDto.participantName
    );

    if (exists) {
      throw new ConflictException('Participant already exists in this trip');
    }

    const participant = {
      tripId,
      participantName: addParticipantDto.participantName,
      addedAt: generateTimestamp(),
    };

    return this.participantsRepository.create(participant);
  }

  async findAll(tripId: string, userId: string) {
    await this.tripsService.verifyOwnership(tripId, userId);
    return this.participantsRepository.findByTripId(tripId);
  }

  async getNames(tripId: string, userId: string): Promise<string[]> {
    await this.tripsService.verifyOwnership(tripId, userId);
    return this.participantsRepository.getParticipantNames(tripId);
  }

  async remove(tripId: string, participantName: string, userId: string) {
    await this.tripsService.verifyOwnership(tripId, userId);

    const exists = await this.participantsRepository.exists(tripId, participantName);

    if (!exists) {
      throw new NotFoundException('Participant not found');
    }

    const expenses = await this.expensesRepository.findByTripId(tripId);
    const isReferenced = expenses.some((e) => e.payer === participantName);

    if (isReferenced) {
      throw new ConflictException(
        `Cannot delete participant "${participantName}" because they are referenced as a payer on existing expenses`
      );
    }

    await this.participantsRepository.delete(tripId, participantName);
  }
}
