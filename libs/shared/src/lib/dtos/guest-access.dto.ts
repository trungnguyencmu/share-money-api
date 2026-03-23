import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, MaxLength } from 'class-validator';

export class JoinTripDto {
  @ApiProperty({
    description: 'Invite code for the trip',
    example: 'A3F1B2C4',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 8)
  code: string;

  @ApiProperty({
    description: 'Display name for the guest',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  displayName: string;
}

export class GuestTokenResponseDto {
  @ApiProperty({ description: 'Guest JWT token' })
  token: string;

  @ApiProperty({ description: 'Trip ID' })
  tripId: string;

  @ApiProperty({ description: 'Guest user ID' })
  userId: string;

  @ApiProperty({ description: 'Display name' })
  displayName: string;

  @ApiProperty({ description: 'Token expiry in seconds' })
  expiresIn: number;
}
