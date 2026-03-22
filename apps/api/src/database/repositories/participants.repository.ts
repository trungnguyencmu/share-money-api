import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Participant } from '@share-money/shared';
import { DynamoDBService } from '../dynamodb.service';

@Injectable()
export class ParticipantsRepository {
  private readonly tableName: string;

  constructor(
    private readonly dynamodbService: DynamoDBService,
    private readonly configService: ConfigService
  ) {
    this.tableName =
      this.configService.get<string>('DYNAMODB_PARTICIPANTS_TABLE') ||
      'share-money-participants-dev';
  }

  /**
   * Add a participant to a trip
   */
  async create(participant: Participant): Promise<Participant> {
    await this.dynamodbService.put({
      TableName: this.tableName,
      Item: participant,
    });
    return participant;
  }

  /**
   * Find all participants for a trip
   */
  async findByTripId(tripId: string): Promise<Participant[]> {
    const items = await this.dynamodbService.query({
      TableName: this.tableName,
      KeyConditionExpression: 'tripId = :tripId',
      ExpressionAttributeValues: {
        ':tripId': tripId,
      },
    });
    return items as Participant[];
  }

  /**
   * Get participant names only (for settlement calculations)
   */
  async getParticipantNames(tripId: string): Promise<string[]> {
    const participants = await this.findByTripId(tripId);
    return participants.map((p) => p.participantName).sort();
  }

  /**
   * Check if participant exists
   */
  async exists(tripId: string, participantName: string): Promise<boolean> {
    const item = await this.dynamodbService.get({
      TableName: this.tableName,
      Key: { tripId, participantName },
    });
    return !!item;
  }

  /**
   * Delete a participant
   */
  async delete(tripId: string, participantName: string): Promise<void> {
    await this.dynamodbService.delete({
      TableName: this.tableName,
      Key: { tripId, participantName },
    });
  }

  /**
   * Delete all participants for a trip
   */
  async deleteAllByTripId(tripId: string): Promise<void> {
    const participants = await this.findByTripId(tripId);
    const keys = participants.map((p) => ({
      tripId: p.tripId,
      participantName: p.participantName,
    }));
    await this.dynamodbService.batchDelete(this.tableName, keys);
  }
}
