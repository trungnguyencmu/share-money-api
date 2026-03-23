import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '../database/database.module';
import { TripsModule } from '../trips/trips.module';
import { JwtStrategy } from './jwt.strategy';
import { GuestJwtStrategy } from './guest-jwt.strategy';
import { GuestJwtTokenService } from './guest-jwt-token.service';
import { AuthController } from './auth.controller';
import { GuestAccessController } from './guest-access.controller';
import { AuthService } from './auth.service';
import { CognitoUserLookupService } from './cognito-user-lookup.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('GUEST_JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    TripsModule,
  ],
  controllers: [AuthController, GuestAccessController],
  providers: [
    JwtStrategy,
    GuestJwtStrategy,
    AuthService,
    CognitoUserLookupService,
    GuestJwtTokenService,
  ],
  exports: [PassportModule, CognitoUserLookupService, GuestJwtTokenService],
})
export class AuthModule {}
