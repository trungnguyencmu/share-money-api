import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AddParticipantDto, ParticipantResponseDto } from '@share-money/shared';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { ParticipantsService } from './participants.service';

@ApiTags('participants')
@ApiBearerAuth()
@Controller('trips/:tripId/participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a participant to a trip' })
  @ApiResponse({
    status: 201,
    description: 'Participant added successfully',
    type: ParticipantResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  @ApiResponse({ status: 409, description: 'Participant already exists' })
  async create(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() addParticipantDto: AddParticipantDto
  ): Promise<ParticipantResponseDto> {
    return this.participantsService.create(tripId, user.userId, addParticipantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all participants for a trip' })
  @ApiResponse({
    status: 200,
    description: 'List of participants',
    type: [ParticipantResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async findAll(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserData
  ): Promise<ParticipantResponseDto[]> {
    return this.participantsService.findAll(tripId, user.userId);
  }

  @Get('names')
  @ApiOperation({ summary: 'Get participant names only (for dropdowns)' })
  @ApiResponse({
    status: 200,
    description: 'List of participant names',
    type: [String],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async getNames(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserData
  ): Promise<string[]> {
    return this.participantsService.getNames(tripId, user.userId);
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Remove a participant from a trip' })
  @ApiResponse({ status: 200, description: 'Participant removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Participant or trip not found' })
  async remove(
    @Param('tripId') tripId: string,
    @Param('name') name: string,
    @CurrentUser() user: CurrentUserData
  ): Promise<void> {
    await this.participantsService.remove(tripId, decodeURIComponent(name), user.userId);
  }
}
