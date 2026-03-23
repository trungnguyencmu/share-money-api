import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AddTripMemberDto, MarkSettledDto, TripMemberResponseDto } from '@share-money/shared';
import {
  CurrentUser,
  CurrentUserData,
} from '../auth/decorators/current-user.decorator';
import { MembersService } from './members.service';

@ApiTags('trip-members')
@ApiBearerAuth()
@Controller('trips/:tripId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @ApiOperation({ summary: 'Invite a member to the trip (owner only)' })
  @ApiResponse({
    status: 201,
    description: 'Member added',
    type: TripMemberResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not trip owner' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User already a member' })
  async addMember(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: AddTripMemberDto,
  ): Promise<TripMemberResponseDto> {
    return this.membersService.addMember(tripId, user.userId, dto.email);
  }

  @Get()
  @ApiOperation({ summary: 'List all members of the trip' })
  @ApiResponse({
    status: 200,
    description: 'List of members',
    type: [TripMemberResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMembers(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<TripMemberResponseDto[]> {
    return this.membersService.getMembers(tripId, user.userId);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the trip (owner only)' })
  @ApiResponse({ status: 204, description: 'Member removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not trip owner' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async removeMember(
    @Param('tripId') tripId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<void> {
    await this.membersService.removeMember(tripId, user.userId, targetUserId);
  }

  @Patch(':userId/settled')
  @ApiOperation({ summary: 'Mark a member as settled (owner only)' })
  @ApiResponse({ status: 200, description: 'Member settlement status updated', type: TripMemberResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not trip owner' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async markAsSettled(
    @Param('tripId') tripId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: MarkSettledDto,
  ): Promise<TripMemberResponseDto> {
    return this.membersService.markAsSettled(tripId, user.userId, targetUserId, dto.isSettled);
  }
}
