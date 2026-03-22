import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

// --- Request DTOs ---

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password (min 8 chars, must include uppercase, lowercase, and numbers)',
    example: 'MyPass123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({
    description: 'Display name',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;
}

export class ConfirmRegistrationDto {
  @ApiProperty({
    description: 'Email used during registration',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Verification code sent to email',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  confirmationCode: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'MyPass123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token from login response' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ResendConfirmationCodeDto {
  @ApiProperty({
    description: 'Email used during registration',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

// --- Response DTOs ---

export class AuthTokensResponseDto {
  @ApiProperty({ description: 'JWT ID token' })
  idToken: string;

  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token for obtaining new tokens' })
  refreshToken: string;

  @ApiProperty({ description: 'Token expiration time in seconds', example: 3600 })
  expiresIn: number;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Status message',
    example: 'Operation completed successfully',
  })
  message: string;
}
