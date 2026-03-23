import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface GuestJwtPayload {
  sub: string;
  tripId: string;
  displayName: string;
  isGuest: boolean;
  iat: number;
  exp: number;
}

@Injectable()
export class GuestJwtStrategy extends PassportStrategy(Strategy, 'guest-jwt') {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('GUEST_JWT_SECRET');
    if (!secret) {
      throw new Error(
        'GUEST_JWT_SECRET is required for guest access. Set this environment variable.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: GuestJwtPayload) {
    if (!payload.isGuest || !payload.sub?.startsWith('guest-')) {
      throw new UnauthorizedException('Invalid guest token');
    }

    return {
      userId: payload.sub,
      tripId: payload.tripId,
      displayName: payload.displayName,
      isGuest: true,
    };
  }
}
