import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TripMember } from '@share-money/shared';
import { DynamoDBService } from '../dynamodb.service';

@Injectable()
export class TripMembersRepository {
  private readonly tableName: string;

  constructor(
    private readonly dynamodbService: DynamoDBService,
    private readonly configService: ConfigService,
  ) {
    this.tableName =
      this.configService.get<string>('DYNAMODB_TRIP_MEMBERS_TABLE') ||
      'share-money-trip-members-dev';
  }

  async create(member: TripMember): Promise<TripMember> {
    await this.dynamodbService.put({
      TableName: this.tableName,
      Item: member,
    });
    return member;
  }

  async findByTripAndUser(tripId: string, userId: string): Promise<TripMember | null> {
    const item = await this.dynamodbService.get({
      TableName: this.tableName,
      Key: { tripId, userId },
    });
    return item ? (item as TripMember) : null;
  }

  async findByTripId(tripId: string): Promise<TripMember[]> {
    const items = await this.dynamodbService.query({
      TableName: this.tableName,
      KeyConditionExpression: 'tripId = :tripId',
      ExpressionAttributeValues: { ':tripId': tripId },
    });
    return items as TripMember[];
  }

  async findByUserId(userId: string): Promise<TripMember[]> {
    const items = await this.dynamodbService.query({
      TableName: this.tableName,
      IndexName: 'UserId-JoinedAt-Index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false,
    });
    return items as TripMember[];
  }

  async isMember(tripId: string, userId: string): Promise<boolean> {
    const item = await this.findByTripAndUser(tripId, userId);
    return !!item;
  }

  async getMemberDisplayNames(tripId: string): Promise<string[]> {
    const members = await this.findByTripId(tripId);
    return members.map((m) => m.displayName).sort();
  }

  async findByTripIdAndDisplayName(
    tripId: string,
    displayName: string,
  ): Promise<TripMember | null> {
    const members = await this.findByTripId(tripId);
    return members.find((m) => m.displayName === displayName) ?? null;
  }

  async updateDisplayName(tripId: string, userId: string, displayName: string): Promise<void> {
    await this.dynamodbService.update({
      TableName: this.tableName,
      Key: { tripId, userId },
      UpdateExpression: 'SET displayName = :displayName',
      ExpressionAttributeValues: { ':displayName': displayName },
    });
  }

  async delete(tripId: string, userId: string): Promise<void> {
    await this.dynamodbService.delete({
      TableName: this.tableName,
      Key: { tripId, userId },
    });
  }

  async deleteAllByTripId(tripId: string): Promise<void> {
    const members = await this.findByTripId(tripId);
    const keys = members.map((m) => ({ tripId: m.tripId, userId: m.userId }));
    await this.dynamodbService.batchDelete(this.tableName, keys);
  }
}
