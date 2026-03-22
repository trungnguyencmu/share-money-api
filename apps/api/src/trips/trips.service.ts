import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTripDto, UpdateTripDto, Trip, generateTripId, generateTimestamp } from '@share-money/shared';
import { TripsRepository } from '../database/repositories/trips.repository';

@Injectable()
export class TripsService {
  constructor(private readonly tripsRepository: TripsRepository) {}

  async create(userId: string, createTripDto: CreateTripDto) {
    const trip = {
      tripId: generateTripId(),
      userId,
      tripName: createTripDto.tripName,
      createdAt: generateTimestamp(),
      isActive: true,
    };

    return this.tripsRepository.create(trip);
  }

  async findAll(userId: string) {
    return this.tripsRepository.findActiveByUserId(userId);
  }

  async findOne(tripId: string, userId: string) {
    return this.getActiveOwnedTrip(tripId, userId);
  }

  async update(tripId: string, userId: string, updateTripDto: UpdateTripDto) {
    await this.getActiveOwnedTrip(tripId, userId);
    return this.tripsRepository.update(tripId, updateTripDto);
  }

  async remove(tripId: string, userId: string) {
    await this.getActiveOwnedTrip(tripId, userId);
    await this.tripsRepository.softDelete(tripId);
  }

  async verifyOwnership(tripId: string, userId: string): Promise<void> {
    await this.getActiveOwnedTrip(tripId, userId);
  }

  private async getActiveOwnedTrip(tripId: string, userId: string): Promise<Trip> {
    const trip = await this.tripsRepository.findById(tripId);

    if (!trip || !trip.isActive || trip.userId !== userId) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    return trip;
  }
}
