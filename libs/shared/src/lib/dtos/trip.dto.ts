import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTripDto {
  @ApiProperty({
    description: 'Name of the trip',
    example: 'Fuji Trip 2025',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tripName: string;

  @ApiPropertyOptional({
    description: 'S3 key of the trip cover image (from upload-url flow)',
    example: 'trips/abc123/img-xyz/photo.jpg',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  imageS3Key?: string;
}

export class UpdateTripDto {
  @ApiPropertyOptional({
    description: 'Name of the trip',
    example: 'Updated Trip Name',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  tripName?: string;

  @ApiPropertyOptional({
    description: 'S3 key of the trip cover image (from upload-url flow)',
    example: 'trips/abc123/img-xyz/photo.jpg',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  imageS3Key?: string;
}

export class TripResponseDto {
  @ApiProperty({
    description: 'Unique trip identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  tripId: string;

  @ApiProperty({
    description: 'User ID who owns the trip',
    example: 'user-123',
  })
  userId: string;

  @ApiProperty({
    description: 'Name of the trip',
    example: 'Fuji Trip 2025',
  })
  tripName: string;

  @ApiProperty({
    description: 'ISO timestamp when trip was created',
    example: '2025-01-05T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Whether the trip is active',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Invite code (visible to trip owner only)',
    example: 'A3F1B2C4',
  })
  inviteCode?: string;

  @ApiPropertyOptional({
    description: 'Presigned URL for the trip cover image',
    example: 'https://s3.amazonaws.com/...',
  })
  imageUrl?: string;
}
