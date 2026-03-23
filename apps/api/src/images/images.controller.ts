import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  RequestUploadUrlDto,
  ConfirmImageUploadDto,
  UploadUrlResponseDto,
  ImageResponseDto,
} from '@share-money/shared';
import {
  CurrentUser,
  CurrentUserData,
} from '../auth/decorators/current-user.decorator';
import { ImagesService } from './images.service';

@ApiTags('images')
@ApiBearerAuth()
@Controller('trips/:tripId/images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Get presigned URL for image upload' })
  @ApiResponse({
    status: 201,
    description: 'Presigned upload URL generated',
    type: UploadUrlResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async requestUploadUrl(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RequestUploadUrlDto,
  ): Promise<UploadUrlResponseDto> {
    return this.imagesService.requestUploadUrl(tripId, user.userId, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Confirm image upload and save metadata' })
  @ApiResponse({
    status: 201,
    description: 'Image metadata saved',
    type: ImageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async confirmUpload(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ConfirmImageUploadDto,
  ): Promise<ImageResponseDto> {
    const displayName = user.displayName || user.username || user.email || user.userId;
    return this.imagesService.confirmUpload(
      tripId,
      user.userId,
      displayName,
      dto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all images for a trip' })
  @ApiResponse({
    status: 200,
    description: 'List of images with presigned view URLs',
    type: [ImageResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async findAll(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ImageResponseDto[]> {
    return this.imagesService.findAll(tripId, user.userId);
  }

  @Get(':imageId')
  @ApiOperation({ summary: 'Get image details with presigned view URL' })
  @ApiResponse({
    status: 200,
    description: 'Image details',
    type: ImageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Image or trip not found' })
  async findOne(
    @Param('tripId') tripId: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ImageResponseDto> {
    return this.imagesService.findOne(tripId, imageId, user.userId);
  }

  @Delete(':imageId')
  @ApiOperation({
    summary: 'Delete image (uploader or trip owner only)',
  })
  @ApiResponse({ status: 200, description: 'Image deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Only uploader or trip owner can delete',
  })
  @ApiResponse({ status: 404, description: 'Image or trip not found' })
  async remove(
    @Param('tripId') tripId: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<void> {
    await this.imagesService.remove(tripId, imageId, user.userId);
  }
}
