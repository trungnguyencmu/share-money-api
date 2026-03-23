import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { TripsModule } from '../trips/trips.module';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { UserProfileController } from './user-profile.controller';
import { UsersSearchController } from './users-search.controller';

@Module({
  imports: [DatabaseModule, TripsModule, AuthModule],
  controllers: [MembersController, UserProfileController, UsersSearchController],
  providers: [MembersService],
})
export class MembersModule {}
