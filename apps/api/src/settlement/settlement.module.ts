import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TripsModule } from '../trips/trips.module';
import { SettlementController } from './settlement.controller';
import { SettlementService } from './settlement.service';

@Module({
  imports: [DatabaseModule, TripsModule],
  controllers: [SettlementController],
  providers: [SettlementService],
})
export class SettlementModule {}
