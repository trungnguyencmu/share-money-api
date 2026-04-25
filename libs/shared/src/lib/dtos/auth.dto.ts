import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

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
    description: 'Password (min 6 characters)',
    example: 'mypass1',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
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
    example: 123456,
    type: 'integer',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  confirmationCode: number;
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

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address of the account',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Email address of the account',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Reset code sent to email',
    example: 123456,
    type: 'integer',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  code: number;

  @ApiProperty({
    description: 'New password (min 6 characters)',
    example: 'newpass1',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  newPassword: string;
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
