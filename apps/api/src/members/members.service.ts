import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { generateTimestamp } from '@share-money/shared';
import { CognitoUserLookupService } from '../auth/cognito-user-lookup.service';
import { TripMembersRepository } from '../database/repositories/trip-members.repository';
import { TripsService } from '../trips/trips.service';

@Injectable()
export class MembersService {
  constructor(
    private readonly tripMembersRepository: TripMembersRepository,
    private readonly tripsService: TripsService,
    private readonly cognitoLookup: CognitoUserLookupService,
  ) {}

  async addMember(tripId: string, ownerUserId: string, email: string) {
    await this.tripsService.verifyOwnership(tripId, ownerUserId);

    const cognitoUser = await this.cognitoLookup.findUserByEmail(email);
    if (!cognitoUser) {
      throw new NotFoundException(
        `No registered user found with email "${email}"`,
      );
    }

    const existing = await this.tripMembersRepository.findByTripAndUser(
      tripId,
      cognitoUser.userId,
    );
    if (existing) {
      throw new ConflictException('User is already a member of this trip');
    }

    const member = {
      tripId,
      userId: cognitoUser.userId,
      displayName: cognitoUser.displayName,
      email: cognitoUser.email,
      role: 'member' as const,
      joinedAt: generateTimestamp(),
    };

    await this.tripMembersRepository.create(member);
    return member;
  }

  async getMembers(tripId: string, userId: string) {
    await this.tripsService.verifyAccess(tripId, userId);
    return this.tripMembersRepository.findByTripId(tripId);
  }

  async updateDisplayName(userId: string, displayName: string) {
    // Update displayName across all trips for this user
    const memberships = await this.tripMembersRepository.findByUserId(userId);

    await Promise.all(
      memberships.map((m) =>
        this.tripMembersRepository.updateDisplayName(m.tripId, userId, displayName),
      ),
    );

    return {
      userId,
      displayName,
    };
  }

  async removeMember(
    tripId: string,
    ownerUserId: string,
    targetUserId: string,
  ) {
    await this.tripsService.verifyOwnership(tripId, ownerUserId);

    if (ownerUserId === targetUserId) {
      throw new BadRequestException('Cannot remove the trip owner');
    }

    const member = await this.tripMembersRepository.findByTripAndUser(
      tripId,
      targetUserId,
    );
    if (!member) {
      throw new NotFoundException('Member not found in this trip');
    }

    await this.tripMembersRepository.delete(tripId, targetUserId);
  }
}
