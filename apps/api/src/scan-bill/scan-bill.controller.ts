import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillUploadUrlResponseDto, RequestBillUploadUrlDto, ScanBillDto, ScanBillResponseDto } from '@share-money/shared';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { ScanBillService } from './scan-bill.service';

@ApiTags('scan-bill')
@ApiBearerAuth()
@Controller('trips/:tripId/scan-bill')
export class ScanBillController {
  constructor(private readonly scanBillService: ScanBillService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Get presigned URL for bill image upload' })
  @ApiResponse({
    status: 201,
    description: 'Presigned upload URL generated',
    type: BillUploadUrlResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async requestUploadUrl(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RequestBillUploadUrlDto,
  ): Promise<BillUploadUrlResponseDto> {
    return this.scanBillService.requestUploadUrl(tripId, user.userId, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Scan a bill image and extract total amount using Textract' })
  @ApiResponse({
    status: 201,
    description: 'Bill scanned successfully',
    type: ScanBillResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async scanBill(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ScanBillDto,
  ): Promise<ScanBillResponseDto> {
    return this.scanBillService.scanBill(tripId, user.userId, dto.s3Key);
  }
}
