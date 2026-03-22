import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TripsModule } from '../trips/trips.module';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [DatabaseModule, TripsModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
