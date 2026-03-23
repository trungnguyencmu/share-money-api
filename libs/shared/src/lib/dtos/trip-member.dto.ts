import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AddTripMemberDto {
  @ApiProperty({
    description: 'Email of the user to invite',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class MarkSettledDto {
  @ApiProperty({
    description: 'Whether the member has settled their balance',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isSettled: boolean;
}

export class UpdateDisplayNameDto {
  @ApiProperty({
    description: 'New display name',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName: string;
}

export class SearchUsersQueryDto {
  @ApiProperty({
    description: 'Search by email or display name prefix (min 3 characters)',
    example: 'john',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  query: string;
}

export class UserSearchResultDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'Display name' })
  displayName: string;
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

  @ApiProperty({ description: 'Whether the member has settled their balance' })
  isSettled: boolean;
}
