import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  RegisterDto,
  ConfirmRegistrationDto,
  LoginDto,
  RefreshTokenDto,
  ResendConfirmationCodeDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthTokensResponseDto,
  MessageResponseDto,
} from '@share-money/shared';
import { mapCognitoError } from './cognito-error-mapper';

@Injectable()
export class AuthService {
  private readonly client: CognitoIdentityProviderClient;
  private readonly clientId: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = configService.getOrThrow<string>('COGNITO_CLIENT_ID');
    this.client = new CognitoIdentityProviderClient({
      region: configService.getOrThrow<string>('COGNITO_REGION'),
    });
  }

  async register(dto: RegisterDto): Promise<MessageResponseDto> {
    const userAttributes = [{ Name: 'email', Value: dto.email }];
    // Use provided name, or derive from email (part before @)
    const displayName = dto.name || dto.email.split('@')[0];
    userAttributes.push({ Name: 'name', Value: displayName });

    try {
      await this.client.send(
        new SignUpCommand({
          ClientId: this.clientId,
          Username: dto.email,
          Password: dto.password,
          UserAttributes: userAttributes,
        }),
      );
      return {
        message:
          'Registration successful. Please check your email for the verification code.',
      };
    } catch (error) {
      mapCognitoError(error);
    }
  }

  async confirmRegistration(
    dto: ConfirmRegistrationDto,
  ): Promise<MessageResponseDto> {
    try {
      await this.client.send(
        new ConfirmSignUpCommand({
          ClientId: this.clientId,
          Username: dto.email,
          ConfirmationCode: dto.confirmationCode,
        }),
      );
      return { message: 'Email confirmed successfully. You can now log in.' };
    } catch (error) {
      mapCognitoError(error);
    }
  }

  async login(dto: LoginDto): Promise<AuthTokensResponseDto> {
    try {
      const result = await this.client.send(
        new InitiateAuthCommand({
          ClientId: this.clientId,
          AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
          AuthParameters: {
            USERNAME: dto.email,
            PASSWORD: dto.password,
          },
        }),
      );

      const auth = result.AuthenticationResult;
      if (!auth) {
        throw new UnauthorizedException('Authentication failed');
      }

      return {
        idToken: auth.IdToken!,
        accessToken: auth.AccessToken!,
        refreshToken: auth.RefreshToken!,
        expiresIn: auth.ExpiresIn!,
      };
    } catch (error) {
      mapCognitoError(error);
    }
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthTokensResponseDto> {
    try {
      const result = await this.client.send(
        new InitiateAuthCommand({
          ClientId: this.clientId,
          AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
          AuthParameters: {
            REFRESH_TOKEN: dto.refreshToken,
          },
        }),
      );

      const auth = result.AuthenticationResult;
      if (!auth) {
        throw new UnauthorizedException('Token refresh failed');
      }

      return {
        idToken: auth.IdToken!,
        accessToken: auth.AccessToken!,
        refreshToken: dto.refreshToken, // Cognito doesn't return new refresh token
        expiresIn: auth.ExpiresIn!,
      };
    } catch (error) {
      mapCognitoError(error);
    }
  }

  async resendConfirmationCode(
    dto: ResendConfirmationCodeDto,
  ): Promise<MessageResponseDto> {
    try {
      await this.client.send(
        new ResendConfirmationCodeCommand({
          ClientId: this.clientId,
          Username: dto.email,
        }),
      );
      return { message: 'Confirmation code resent. Please check your email.' };
    } catch (error) {
      mapCognitoError(error);
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<MessageResponseDto> {
    try {
      await this.client.send(
        new ForgotPasswordCommand({
          ClientId: this.clientId,
          Username: dto.email,
        }),
      );
      return {
        message:
          'Password reset code sent. Please check your email.',
      };
    } catch (error) {
      mapCognitoError(error);
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<MessageResponseDto> {
    try {
      await this.client.send(
        new ConfirmForgotPasswordCommand({
          ClientId: this.clientId,
          Username: dto.email,
          ConfirmationCode: dto.confirmationCode,
          Password: dto.newPassword,
        }),
      );
      return {
        message: 'Password reset successfully. You can now log in with your new password.',
      };
    } catch (error) {
      mapCognitoError(error);
    }
  }
}
