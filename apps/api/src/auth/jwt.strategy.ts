import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';

export interface JwtPayload {
  sub: string; // Cognito user ID
  email?: string;
  username?: string;
  'cognito:username'?: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private static readonly logger = new Logger(JwtStrategy.name);

  private static buildConfig(configService: ConfigService): StrategyOptionsWithoutRequest {
    const userPoolId = configService.get<string>('COGNITO_USER_POOL_ID');
    const region = configService.get<string>('COGNITO_REGION');
    const nodeEnv = configService.get<string>('NODE_ENV');

    if (!userPoolId || !region) {
      if (nodeEnv === 'production') {
        throw new Error(
          'COGNITO_USER_POOL_ID and COGNITO_REGION are required in production. ' +
          'Set these environment variables to enable authentication.'
        );
      }

      JwtStrategy.logger.warn(
        'Cognito not configured - using JWT_SECRET for local development only'
      );

      const jwtSecret = configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new Error(
          'JWT_SECRET is required when Cognito is not configured. ' +
          'Set COGNITO_USER_POOL_ID + COGNITO_REGION for Cognito auth, or JWT_SECRET for local dev.'
        );
      }

      return {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: jwtSecret,
        algorithms: ['HS256'],
      };
    }

    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

    return {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: configService.get<string>('COGNITO_CLIENT_ID'),
      issuer,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${issuer}/.well-known/jwks.json`,
      }),
    };
  }

  constructor(private configService: ConfigService) {
    super(JwtStrategy.buildConfig(configService));
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.username || payload['cognito:username'],
    };
  }
}
