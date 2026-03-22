import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettlementResponseDto } from '@share-money/shared';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { SettlementService } from './settlement.service';

@ApiTags('settlement')
@ApiBearerAuth()
@Controller('trips/:tripId/settlement')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get()
  @ApiOperation({
    summary: 'Calculate settlement for a trip',
    description:
      'Calculates member balances and optimal transactions to settle all debts in the trip',
  })
  @ApiResponse({
    status: 200,
    description: 'Settlement calculation result',
    type: SettlementResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async calculateSettlement(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserData
  ): Promise<SettlementResponseDto> {
    return this.settlementService.calculateSettlement(tripId, user.userId);
  }
}
