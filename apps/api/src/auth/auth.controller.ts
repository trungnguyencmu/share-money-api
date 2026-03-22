import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  RegisterDto,
  ConfirmRegistrationDto,
  LoginDto,
  RefreshTokenDto,
  ResendConfirmationCodeDto,
  AuthTokensResponseDto,
  MessageResponseDto,
} from '@share-money/shared';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  @ApiConflictResponse({ description: 'Email already registered' })
  @ApiBadRequestResponse({ description: 'Invalid input or weak password' })
  async register(@Body() dto: RegisterDto): Promise<MessageResponseDto> {
    return this.authService.register(dto);
  }

  @Post('confirm')
  @Public()
  @ApiOperation({ summary: 'Confirm email with verification code' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid or expired code' })
  async confirmRegistration(
    @Body() dto: ConfirmRegistrationDto,
  ): Promise<MessageResponseDto> {
    return this.authService.confirmRegistration(dto);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Log in and receive auth tokens' })
  @ApiResponse({ status: 201, type: AuthTokensResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBadRequestResponse({ description: 'Email not confirmed' })
  async login(@Body() dto: LoginDto): Promise<AuthTokensResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Refresh expired tokens' })
  @ApiResponse({ status: 201, type: AuthTokensResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
  ): Promise<AuthTokensResponseDto> {
    return this.authService.refreshToken(dto);
  }

  @Post('resend-code')
  @Public()
  @ApiOperation({ summary: 'Resend email verification code' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  async resendConfirmationCode(
    @Body() dto: ResendConfirmationCodeDto,
  ): Promise<MessageResponseDto> {
    return this.authService.resendConfirmationCode(dto);
  }
}
