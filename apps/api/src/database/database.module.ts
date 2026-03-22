import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamoDBService } from './dynamodb.service';
import { ExpensesRepository } from './repositories/expenses.repository';
import { ParticipantsRepository } from './repositories/participants.repository';
import { TripsRepository } from './repositories/trips.repository';

@Module({
  imports: [ConfigModule],
  providers: [DynamoDBService, TripsRepository, ExpensesRepository, ParticipantsRepository],
  exports: [DynamoDBService, TripsRepository, ExpensesRepository, ParticipantsRepository],
})
export class DatabaseModule {}
