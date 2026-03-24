import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bill } from '@share-money/shared';
import { DynamoDBService } from '../dynamodb.service';

@Injectable()
export class BillsRepository {
  private readonly tableName: string;

  constructor(
    private readonly dynamodbService: DynamoDBService,
    private readonly configService: ConfigService,
  ) {
    this.tableName =
      this.configService.get<string>('DYNAMODB_BILLS_TABLE') || 'share-money-bills-dev';
  }

  async create(bill: Bill): Promise<Bill> {
    await this.dynamodbService.put({
      TableName: this.tableName,
      Item: bill,
    });
    return bill;
  }

  async findById(tripId: string, billId: string): Promise<Bill | null> {
    const item = await this.dynamodbService.get({
      TableName: this.tableName,
      Key: { tripId, billId },
    });
    return item ? (item as Bill) : null;
  }

  async findByTripId(tripId: string): Promise<Bill[]> {
    const items = await this.dynamodbService.query({
      TableName: this.tableName,
      KeyConditionExpression: 'tripId = :tripId',
      ExpressionAttributeValues: {
        ':tripId': tripId,
      },
      ScanIndexForward: false,
    });
    return items as Bill[];
  }

  async delete(tripId: string, billId: string): Promise<void> {
    await this.dynamodbService.delete({
      TableName: this.tableName,
      Key: { tripId, billId },
    });
  }
}
