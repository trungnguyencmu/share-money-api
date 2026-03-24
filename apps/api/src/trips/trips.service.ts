import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateTripDto,
  UpdateTripDto,
  Trip,
  generateTripId,
  generateTimestamp,
  generateInviteCode,
} from '@share-money/shared';
import { TripMembersRepository } from '../database/repositories/trip-members.repository';
import { TripsRepository } from '../database/repositories/trips.repository';
import { S3Service } from '../storage/s3.service';

@Injectable()
export class TripsService {
  constructor(
    private readonly tripsRepository: TripsRepository,
    private readonly tripMembersRepository: TripMembersRepository,
    private readonly s3Service: S3Service,
  ) {}

  async create(userId: string, createTripDto: CreateTripDto, email?: string, displayName?: string) {
    const trip: Trip = {
      tripId: generateTripId(),
      userId,
      tripName: createTripDto.tripName,
      createdAt: generateTimestamp(),
      isActive: true,
      status: 'active',
      inviteCode: generateInviteCode(),
      memberCount: 1,
      ...(createTripDto.imageS3Key && { imageS3Key: createTripDto.imageS3Key }),
      ...(createTripDto.startDate && { startDate: createTripDto.startDate }),
      ...(createTripDto.endDate && { endDate: createTripDto.endDate }),
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
      isSettled: false,
    });

    return this.buildTripResponse(trip);
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

    const allTrips = [...ownedTrips, ...activeAdditional];
    return Promise.all(allTrips.map((t) => this.buildTripResponse(t)));
  }

  async findOne(tripId: string, userId: string) {
    const trip = await this.verifyAccess(tripId, userId);
    return this.buildTripResponse(trip);
  }

  async update(tripId: string, userId: string, updateTripDto: UpdateTripDto) {
    const trip = await this.verifyOwnership(tripId, userId);

    // Delete old S3 image when replacing or removing
    if (updateTripDto.imageS3Key !== undefined && trip.imageS3Key) {
      await this.s3Service.deleteObject(trip.imageS3Key);
    }

    const updated = await this.tripsRepository.update(tripId, updateTripDto);
    return this.buildTripResponse(updated);
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

  async findByInviteCode(code: string): Promise<Trip> {
    const trip = await this.tripsRepository.findByInviteCode(code);
    if (!trip || !trip.isActive) {
      throw new NotFoundException('Invalid or expired invite code');
    }
    return trip;
  }

  async regenerateInviteCode(tripId: string, userId: string) {
    await this.getActiveOwnedTrip(tripId, userId);
    const updated = await this.tripsRepository.update(tripId, { inviteCode: generateInviteCode() });
    return this.buildTripResponse(updated);
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

  private async buildTripResponse(trip: Trip) {
    const imageUrl = trip.imageS3Key
      ? await this.s3Service.generatePresignedGetUrl(trip.imageS3Key)
      : undefined;

    const status = this.calculateStatus(trip);

    return {
      ...trip,
      memberCount: trip.memberCount ?? 0,
      status,
      imageUrl,
    };
  }

  private calculateStatus(trip: Trip): 'active' | 'upcoming' | 'settled' {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (trip.startDate) {
      const startDate = new Date(trip.startDate);
      if (startDate > today) {
        return 'upcoming';
      }
    }

    if (trip.endDate) {
      const endDate = new Date(trip.endDate);
      if (endDate < today) {
        return 'settled';
      }
    }

    return 'active';
  }
}
