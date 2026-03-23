import {
  Controller,
  Patch,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UpdateDisplayNameDto } from '@share-money/shared';
import {
  CurrentUser,
  CurrentUserData,
} from '../auth/decorators/current-user.decorator';
import { MembersService } from './members.service';

@ApiTags('user-profile')
@ApiBearerAuth()
@Controller('members')
export class UserProfileController {
  constructor(private readonly membersService: MembersService) {}

  @Patch('me')
  @ApiOperation({ summary: 'Update your display name across all trips' })
  @ApiResponse({
    status: 200,
    description: 'Display name updated',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateDisplayName(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateDisplayNameDto,
  ) {
    return this.membersService.updateDisplayName(user.userId, dto.displayName);
  }
}
