import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateTripDto, UpdateTripDto, TripResponseDto } from '@share-money/shared';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { TripsService } from './trips.service';

@ApiTags('trips')
@ApiBearerAuth()
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new trip' })
  @ApiResponse({ status: 201, description: 'Trip created successfully', type: TripResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() createTripDto: CreateTripDto
  ): Promise<TripResponseDto> {
    return this.tripsService.create(user.userId, createTripDto, user.email, user.username);
  }

  @Get()
  @ApiOperation({ summary: 'Get all trips for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of trips',
    type: [TripResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@CurrentUser() user: CurrentUserData): Promise<TripResponseDto[]> {
    if (user.isGuest && user.tripId) {
      const trip = await this.tripsService.verifyAccess(user.tripId, user.userId);
      const { inviteCode, ...tripWithoutCode } = trip;
      return [tripWithoutCode as TripResponseDto];
    }
    return this.tripsService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trip by ID' })
  @ApiResponse({ status: 200, description: 'Trip found', type: TripResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData
  ): Promise<TripResponseDto> {
    const trip = await this.tripsService.findOne(id, user.userId);
    // Only show invite code to trip owner
    if (trip.userId !== user.userId) {
      const { inviteCode, ...tripWithoutCode } = trip;
      return tripWithoutCode as TripResponseDto;
    }
    return trip;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update trip' })
  @ApiResponse({ status: 200, description: 'Trip updated successfully', type: TripResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() updateTripDto: UpdateTripDto
  ): Promise<TripResponseDto> {
    return this.tripsService.update(id, user.userId, updateTripDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete trip (soft delete)' })
  @ApiResponse({ status: 200, description: 'Trip deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData): Promise<void> {
    await this.tripsService.remove(id, user.userId);
  }

  @Post(':id/regenerate-invite-code')
  @ApiOperation({ summary: 'Regenerate invite code (owner only)' })
  @ApiResponse({ status: 200, description: 'New invite code generated', type: TripResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async regenerateInviteCode(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData
  ): Promise<TripResponseDto> {
    return this.tripsService.regenerateInviteCode(id, user.userId);
  }
}
