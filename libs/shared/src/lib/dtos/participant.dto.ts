import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddParticipantDto {
  @ApiProperty({
    description: 'Name of the participant',
    example: 'Jane Smith',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  participantName: string;
}

export class ParticipantResponseDto {
  @ApiProperty({
    description: 'Trip identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  tripId: string;

  @ApiProperty({
    description: 'Name of the participant',
    example: 'Jane Smith',
  })
  participantName: string;

  @ApiProperty({
    description: 'ISO timestamp when participant was added',
    example: '2025-01-05T10:30:00.000Z',
  })
  addedAt: string;
}
