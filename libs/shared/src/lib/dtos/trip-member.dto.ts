import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class AddTripMemberDto {
  @ApiProperty({
    description: 'Email of the user to invite',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class TripMemberResponseDto {
  @ApiProperty({ description: 'Trip ID' })
  tripId: string;

  @ApiProperty({ description: 'User ID (Cognito sub)' })
  userId: string;

  @ApiProperty({ description: 'Display name' })
  displayName: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'Role: owner or member', enum: ['owner', 'member'] })
  role: string;

  @ApiProperty({ description: 'When the user joined' })
  joinedAt: string;
}
