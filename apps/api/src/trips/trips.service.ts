import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTripDto, UpdateTripDto, generateTripId, generateTimestamp } from '@share-money/shared';
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
    const trip = await this.tripsRepository.findById(tripId);

    if (!trip || !trip.isActive || trip.userId !== userId) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    return trip;
  }

  async update(tripId: string, userId: string, updateTripDto: UpdateTripDto) {
    const trip = await this.tripsRepository.findById(tripId);

    if (!trip || !trip.isActive) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    if (trip.userId !== userId) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    return this.tripsRepository.update(tripId, updateTripDto);
  }

  async remove(tripId: string, userId: string) {
    const trip = await this.tripsRepository.findById(tripId);

    if (!trip || !trip.isActive) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    if (trip.userId !== userId) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    await this.tripsRepository.softDelete(tripId);
  }

  /**
   * Check if user owns trip (helper for other modules)
   */
  async verifyOwnership(tripId: string, userId: string): Promise<void> {
    const trip = await this.tripsRepository.findById(tripId);

    if (!trip || !trip.isActive || trip.userId !== userId) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }
  }
}
