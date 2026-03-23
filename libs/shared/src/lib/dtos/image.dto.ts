import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class RequestUploadUrlDto {
  @ApiProperty({
    description: 'Original file name',
    example: 'trip-photo.jpg',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({
    description: 'MIME type of the image',
    example: 'image/jpeg',
    enum: ALLOWED_CONTENT_TYPES,
  })
  @IsString()
  @IsIn(ALLOWED_CONTENT_TYPES, {
    message: `Content type must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
  })
  contentType: string;

  @ApiProperty({
    description: 'File size in bytes (max 10MB)',
    example: 2048000,
    maximum: MAX_FILE_SIZE,
  })
  @IsNumber()
  @IsPositive()
  @Max(MAX_FILE_SIZE, { message: 'File size must not exceed 10MB' })
  size: number;
}

export class ConfirmImageUploadDto {
  @ApiProperty({
    description: 'Image ID returned from upload-url endpoint',
    example: 'img-550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  imageId: string;

  @ApiProperty({
    description: 'Original file name',
    example: 'trip-photo.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({
    description: 'MIME type of the image',
    example: 'image/jpeg',
  })
  @IsString()
  @IsIn(ALLOWED_CONTENT_TYPES, {
    message: `Content type must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
  })
  contentType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048000,
  })
  @IsNumber()
  @IsPositive()
  @Max(MAX_FILE_SIZE, { message: 'File size must not exceed 10MB' })
  size: number;
}

export class UploadUrlResponseDto {
  @ApiProperty({
    description: 'Presigned S3 PUT URL for direct upload',
    example: 'https://s3.amazonaws.com/...',
  })
  uploadUrl: string;

  @ApiProperty({
    description: 'Generated image ID to use when confirming upload',
    example: 'img-550e8400-e29b-41d4-a716-446655440000',
  })
  imageId: string;

  @ApiProperty({
    description: 'S3 object key where the file will be stored',
    example: 'trips/abc123/img-xyz/photo.jpg',
  })
  s3Key: string;

  @ApiProperty({
    description: 'Seconds until the presigned URL expires',
    example: 3600,
  })
  expiresIn: number;
}

export class ImageResponseDto {
  @ApiProperty({
    description: 'Trip identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  tripId: string;

  @ApiProperty({
    description: 'Unique image identifier',
    example: 'img-550e8400-e29b-41d4-a716-446655440000',
  })
  imageId: string;

  @ApiProperty({
    description: 'User ID of the uploader',
    example: 'user-123',
  })
  uploadedBy: string;

  @ApiProperty({
    description: 'Display name of the uploader',
    example: 'John Doe',
  })
  uploaderDisplayName: string;

  @ApiProperty({
    description: 'Original file name',
    example: 'trip-photo.jpg',
  })
  fileName: string;

  @ApiProperty({
    description: 'MIME type',
    example: 'image/jpeg',
  })
  contentType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048000,
  })
  size: number;

  @ApiProperty({
    description: 'ISO timestamp when image was uploaded',
    example: '2025-01-05T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Presigned URL for viewing the image (expires in 15 minutes)',
    example: 'https://s3.amazonaws.com/...',
  })
  url: string;
}
