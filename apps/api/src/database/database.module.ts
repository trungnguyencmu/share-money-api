import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamoDBService } from './dynamodb.service';
import { ExpensesRepository } from './repositories/expenses.repository';
import { ImagesRepository } from './repositories/images.repository';
import { TripMembersRepository } from './repositories/trip-members.repository';
import { TripsRepository } from './repositories/trips.repository';

@Module({
  imports: [ConfigModule],
  providers: [DynamoDBService, TripsRepository, ExpensesRepository, TripMembersRepository, ImagesRepository],
  exports: [DynamoDBService, TripsRepository, ExpensesRepository, TripMembersRepository, ImagesRepository],
})
export class DatabaseModule {}
