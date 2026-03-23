import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TripImage } from '@share-money/shared';
import { DynamoDBService } from '../dynamodb.service';

@Injectable()
export class ImagesRepository {
  private readonly tableName: string;

  constructor(
    private readonly dynamodbService: DynamoDBService,
    private readonly configService: ConfigService,
  ) {
    this.tableName =
      this.configService.get<string>('DYNAMODB_IMAGES_TABLE') ||
      'share-money-images-dev';
  }

  async create(image: TripImage): Promise<TripImage> {
    await this.dynamodbService.put({
      TableName: this.tableName,
      Item: image,
    });
    return image;
  }

  async findById(tripId: string, imageId: string): Promise<TripImage | null> {
    const item = await this.dynamodbService.get({
      TableName: this.tableName,
      Key: { tripId, imageId },
    });
    return item ? (item as TripImage) : null;
  }

  async findByTripId(tripId: string): Promise<TripImage[]> {
    const items = await this.dynamodbService.query({
      TableName: this.tableName,
      IndexName: 'TripId-CreatedAt-Index',
      KeyConditionExpression: 'tripId = :tripId',
      ExpressionAttributeValues: {
        ':tripId': tripId,
      },
      ScanIndexForward: false,
    });
    return items as TripImage[];
  }

  async delete(tripId: string, imageId: string): Promise<void> {
    await this.dynamodbService.delete({
      TableName: this.tableName,
      Key: { tripId, imageId },
    });
  }

  async deleteAllByTripId(tripId: string): Promise<void> {
    const images = await this.findByTripId(tripId);
    const keys = images.map((image) => ({
      tripId: image.tripId,
      imageId: image.imageId,
    }));
    await this.dynamodbService.batchDelete(this.tableName, keys);
  }
}
