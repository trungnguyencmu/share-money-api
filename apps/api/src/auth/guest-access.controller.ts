import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  JoinTripDto,
  GuestTokenResponseDto,
  generateTimestamp,
} from '@share-money/shared';
import { randomUUID } from 'crypto';
import { Public } from './decorators/public.decorator';
import { GuestJwtTokenService } from './guest-jwt-token.service';
import { TripMembersRepository } from '../database/repositories/trip-members.repository';
import { TripsService } from '../trips/trips.service';

@ApiTags('guest-access')
@Controller('trips')
export class GuestAccessController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly tripMembersRepository: TripMembersRepository,
    private readonly guestJwtTokenService: GuestJwtTokenService,
  ) {}

  @Post('join')
  @Public()
  @ApiOperation({ summary: 'Join a trip as guest using invite code' })
  @ApiResponse({
    status: 201,
    description: 'Joined trip successfully',
    type: GuestTokenResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Invalid invite code' })
  async joinTrip(@Body() dto: JoinTripDto): Promise<GuestTokenResponseDto> {
    const trip = await this.tripsService.findByInviteCode(dto.code);

    const guestId = `guest-${randomUUID()}`;

    await this.tripMembersRepository.create({
      tripId: trip.tripId,
      userId: guestId,
      displayName: dto.displayName,
      email: '',
      role: 'guest',
      joinedAt: generateTimestamp(),
    });

    const token = this.guestJwtTokenService.signGuestToken(
      guestId,
      trip.tripId,
      dto.displayName,
    );

    return {
      token,
      tripId: trip.tripId,
      userId: guestId,
      displayName: dto.displayName,
      expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
    };
  }
}
