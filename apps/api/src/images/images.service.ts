import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  RequestUploadUrlDto,
  ConfirmImageUploadDto,
  ImageResponseDto,
  UploadUrlResponseDto,
  TripImage,
  generateImageId,
  generateTimestamp,
} from '@share-money/shared';
import { ImagesRepository } from '../database/repositories/images.repository';
import { S3Service } from '../storage/s3.service';
import { TripsService } from '../trips/trips.service';

@Injectable()
export class ImagesService {
  constructor(
    private readonly imagesRepository: ImagesRepository,
    private readonly s3Service: S3Service,
    private readonly tripsService: TripsService,
  ) {}

  async requestUploadUrl(
    tripId: string,
    userId: string,
    dto: RequestUploadUrlDto,
  ): Promise<UploadUrlResponseDto> {
    await this.tripsService.verifyAccess(tripId, userId);

    const imageId = generateImageId();
    const s3Key = `trips/${tripId}/${imageId}/${dto.fileName}`;

    const uploadUrl = await this.s3Service.generatePresignedUploadUrl(
      s3Key,
      dto.contentType,
    );

    return {
      uploadUrl,
      imageId,
      s3Key,
      expiresIn: this.s3Service.getUploadUrlExpiry(),
    };
  }

  async confirmUpload(
    tripId: string,
    userId: string,
    displayName: string,
    dto: ConfirmImageUploadDto,
  ): Promise<ImageResponseDto> {
    await this.tripsService.verifyAccess(tripId, userId);

    const s3Key = `trips/${tripId}/${dto.imageId}/${dto.fileName}`;

    const image: TripImage = {
      tripId,
      imageId: dto.imageId,
      uploadedBy: userId,
      uploaderDisplayName: displayName,
      fileName: dto.fileName,
      s3Key,
      contentType: dto.contentType,
      size: dto.size,
      createdAt: generateTimestamp(),
    };

    await this.imagesRepository.create(image);
    return this.attachPresignedUrl(image);
  }

  async findAll(
    tripId: string,
    userId: string,
  ): Promise<ImageResponseDto[]> {
    await this.tripsService.verifyAccess(tripId, userId);

    const images = await this.imagesRepository.findByTripId(tripId);
    return Promise.all(images.map((img) => this.attachPresignedUrl(img)));
  }

  async findOne(
    tripId: string,
    imageId: string,
    userId: string,
  ): Promise<ImageResponseDto> {
    await this.tripsService.verifyAccess(tripId, userId);

    const image = await this.imagesRepository.findById(tripId, imageId);
    if (!image) {
      throw new NotFoundException(`Image with ID ${imageId} not found`);
    }

    return this.attachPresignedUrl(image);
  }

  async remove(
    tripId: string,
    imageId: string,
    userId: string,
  ): Promise<void> {
    const trip = await this.tripsService.verifyAccess(tripId, userId);

    const image = await this.imagesRepository.findById(tripId, imageId);
    if (!image) {
      throw new NotFoundException(`Image with ID ${imageId} not found`);
    }

    if (image.uploadedBy !== userId && trip.userId !== userId) {
      throw new ForbiddenException(
        'Only the uploader or trip owner can delete images',
      );
    }

    await Promise.all([
      this.s3Service.deleteObject(image.s3Key),
      this.imagesRepository.delete(tripId, imageId),
    ]);
  }

  private async attachPresignedUrl(image: TripImage): Promise<ImageResponseDto> {
    const url = await this.s3Service.generatePresignedGetUrl(image.s3Key);
    return {
      tripId: image.tripId,
      imageId: image.imageId,
      uploadedBy: image.uploadedBy,
      uploaderDisplayName: image.uploaderDisplayName,
      fileName: image.fileName,
      contentType: image.contentType,
      size: image.size,
      createdAt: image.createdAt,
      url,
    };
  }
}
