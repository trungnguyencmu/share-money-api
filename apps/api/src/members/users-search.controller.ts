import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SearchUsersQueryDto, UserSearchResultDto } from '@share-money/shared';
import { CognitoUserLookupService } from '../auth/cognito-user-lookup.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersSearchController {
  constructor(private readonly cognitoLookup: CognitoUserLookupService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search registered users by email or display name' })
  @ApiResponse({
    status: 200,
    description: 'Matching users',
    type: [UserSearchResultDto],
  })
  async searchUsers(
    @Query() dto: SearchUsersQueryDto,
  ): Promise<UserSearchResultDto[]> {
    return this.cognitoLookup.searchUsers(dto.query);
  }
}
