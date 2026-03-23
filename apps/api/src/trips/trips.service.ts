import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTripDto, UpdateTripDto, Trip, generateTripId, generateTimestamp } from '@share-money/shared';
import { TripMembersRepository } from '../database/repositories/trip-members.repository';
import { TripsRepository } from '../database/repositories/trips.repository';

@Injectable()
export class TripsService {
  constructor(
    private readonly tripsRepository: TripsRepository,
    private readonly tripMembersRepository: TripMembersRepository,
  ) {}

  async create(userId: string, createTripDto: CreateTripDto, email?: string, displayName?: string) {
    const trip = {
      tripId: generateTripId(),
      userId,
      tripName: createTripDto.tripName,
      createdAt: generateTimestamp(),
      isActive: true,
    };

    await this.tripsRepository.create(trip);

    // Auto-add owner as member
    await this.tripMembersRepository.create({
      tripId: trip.tripId,
      userId,
      displayName: displayName || email || userId,
      email: email || '',
      role: 'owner',
      joinedAt: trip.createdAt,
    });

    return trip;
  }

  async findAll(userId: string) {
    // Query owned trips and member trips in parallel
    const [ownedTrips, memberships] = await Promise.all([
      this.tripsRepository.findActiveByUserId(userId),
      this.tripMembersRepository.findByUserId(userId),
    ]);

    const ownedIds = new Set(ownedTrips.map((t) => t.tripId));
    const additionalTripIds = memberships
      .filter((m) => !ownedIds.has(m.tripId))
      .map((m) => m.tripId);

    const additionalTrips = await this.tripsRepository.findByIds(additionalTripIds);
    const activeAdditional = additionalTrips.filter((t) => t.isActive);

    return [...ownedTrips, ...activeAdditional];
  }

  async findOne(tripId: string, userId: string) {
    return this.verifyAccess(tripId, userId);
  }

  async update(tripId: string, userId: string, updateTripDto: UpdateTripDto) {
    await this.verifyAccess(tripId, userId);
    return this.tripsRepository.update(tripId, updateTripDto);
  }

  async remove(tripId: string, userId: string) {
    await this.getActiveOwnedTrip(tripId, userId);
    await this.tripsRepository.softDelete(tripId);
    await this.tripMembersRepository.deleteAllByTripId(tripId);
  }

  /** Check if user is owner OR member. Returns trip. */
  async verifyAccess(tripId: string, userId: string): Promise<Trip> {
    const trip = await this.tripsRepository.findById(tripId);
    if (!trip || !trip.isActive) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    // Owner always has access
    if (trip.userId === userId) return trip;

    // Check membership
    const isMember = await this.tripMembersRepository.isMember(tripId, userId);
    if (!isMember) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    return trip;
  }

  /** Check if user is the trip owner. Returns trip. */
  async verifyOwnership(tripId: string, userId: string): Promise<Trip> {
    return this.getActiveOwnedTrip(tripId, userId);
  }

  private async getActiveOwnedTrip(tripId: string, userId: string): Promise<Trip> {
    const trip = await this.tripsRepository.findById(tripId);
    if (!trip || !trip.isActive || trip.userId !== userId) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }
    return trip;
  }
}
