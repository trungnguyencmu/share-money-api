import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TripsModule } from '../trips/trips.module';
import { ScanBillController } from './scan-bill.controller';
import { ScanBillService } from './scan-bill.service';

@Module({
  imports: [DatabaseModule, TripsModule],
  controllers: [ScanBillController],
  providers: [ScanBillService],
  exports: [ScanBillService],
})
export class ScanBillModule {}
