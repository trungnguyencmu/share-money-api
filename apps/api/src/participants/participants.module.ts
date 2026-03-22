import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TripsModule } from '../trips/trips.module';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';

@Module({
  imports: [DatabaseModule, TripsModule],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
