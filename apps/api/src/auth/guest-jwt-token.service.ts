import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GuestJwtTokenService {
  constructor(private readonly jwtService: JwtService) {}

  signGuestToken(
    guestId: string,
    tripId: string,
    displayName: string,
  ): string {
    return this.jwtService.sign({
      sub: guestId,
      tripId,
      displayName,
      isGuest: true,
    });
  }
}
