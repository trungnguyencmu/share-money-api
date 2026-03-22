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
}
