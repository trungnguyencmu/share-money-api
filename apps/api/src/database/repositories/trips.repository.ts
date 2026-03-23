import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Trip } from '@share-money/shared';
import { DynamoDBService } from '../dynamodb.service';

@Injectable()
export class TripsRepository {
  private readonly tableName: string;

  constructor(
    private readonly dynamodbService: DynamoDBService,
    private readonly configService: ConfigService
  ) {
    this.tableName = this.configService.get<string>('DYNAMODB_TRIPS_TABLE') || 'share-money-trips-dev';
  }

  /**
   * Create a new trip
   */
  async create(trip: Trip): Promise<Trip> {
    await this.dynamodbService.put({
      TableName: this.tableName,
      Item: trip,
    });
    return trip;
  }

  /**
   * Find trip by ID
   */
  async findById(tripId: string): Promise<Trip | null> {
    const item = await this.dynamodbService.get({
      TableName: this.tableName,
      Key: { tripId },
    });
    return item ? (item as Trip) : null;
  }

  /**
   * Find all trips for a user
   */
  async findByUserId(userId: string): Promise<Trip[]> {
    const items = await this.dynamodbService.query({
      TableName: this.tableName,
      IndexName: 'UserId-CreatedAt-Index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Sort by createdAt descending
    });
    return items as Trip[];
  }

  /**
   * Find active trips for a user
   */
  async findActiveByUserId(userId: string): Promise<Trip[]> {
    const items = await this.dynamodbService.query({
      TableName: this.tableName,
      IndexName: 'UserId-CreatedAt-Index',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isActive': true,
      },
      ScanIndexForward: false,
    });
    return items as Trip[];
  }

  /**
   * Find multiple trips by IDs
   */
  async findByIds(tripIds: string[]): Promise<Trip[]> {
    if (tripIds.length === 0) return [];
    const results = await Promise.all(tripIds.map((id) => this.findById(id)));
    return results.filter((t): t is Trip => t !== null);
  }

  /**
   * Update trip
   */
  async update(tripId: string, updates: Partial<Trip>): Promise<Trip> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'tripId' && key !== 'userId') {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updateExpressions.length === 0) {
      const existing = await this.findById(tripId);
      if (!existing) {
        throw new Error('Trip not found');
      }
      return existing;
    }

    const result = await this.dynamodbService.update({
      TableName: this.tableName,
      Key: { tripId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    return result as Trip;
  }

  /**
   * Soft delete trip
   */
  async softDelete(tripId: string): Promise<void> {
    await this.update(tripId, { isActive: false });
  }

  /**
   * Hard delete trip (use with caution)
   */
  async delete(tripId: string): Promise<void> {
    await this.dynamodbService.delete({
      TableName: this.tableName,
      Key: { tripId },
    });
  }
}
