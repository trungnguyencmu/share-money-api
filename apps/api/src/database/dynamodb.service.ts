import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  BatchWriteCommand,
  DeleteCommand,
  DeleteCommandInput,
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const BATCH_WRITE_MAX_ITEMS = 25;
const MAX_PAGINATION_PAGES = 100;

@Injectable()
export class DynamoDBService {
  private readonly logger = new Logger(DynamoDBService.name);
  private readonly client: DynamoDBDocumentClient;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');

    const dynamoClient = new DynamoDBClient({ region });

    this.client = DynamoDBDocumentClient.from(dynamoClient, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    });

    this.logger.log(`DynamoDB client initialized for region: ${region}`);
  }

  /**
   * Get a single item
   */
  async get(params: GetCommandInput) {
    try {
      const command = new GetCommand(params);
      const result = await this.client.send(command);
      return result.Item;
    } catch (error) {
      this.logger.error(`Error getting item from ${params.TableName}`, error);
      throw error;
    }
  }

  /**
   * Put (create or replace) an item
   */
  async put(params: PutCommandInput) {
    try {
      const command = new PutCommand(params);
      await this.client.send(command);
      return params.Item;
    } catch (error) {
      this.logger.error(`Error putting item to ${params.TableName}`, error);
      throw error;
    }
  }

  /**
   * Update an item
   */
  async update(params: UpdateCommandInput) {
    try {
      const command = new UpdateCommand(params);
      const result = await this.client.send(command);
      return result.Attributes;
    } catch (error) {
      this.logger.error(`Error updating item in ${params.TableName}`, error);
      throw error;
    }
  }

  /**
   * Delete an item
   */
  async delete(params: DeleteCommandInput) {
    try {
      const command = new DeleteCommand(params);
      await this.client.send(command);
    } catch (error) {
      this.logger.error(`Error deleting item from ${params.TableName}`, error);
      throw error;
    }
  }

  /**
   * Query items with automatic pagination to retrieve all results.
   */
  async query(params: QueryCommandInput) {
    try {
      const allItems: Record<string, any>[] = [];
      let lastEvaluatedKey: Record<string, any> | undefined = undefined;
      let pages = 0;

      do {
        const result: QueryCommandOutput = await this.client.send(
          new QueryCommand({ ...params, ExclusiveStartKey: lastEvaluatedKey })
        );
        allItems.push(...(result.Items || []));
        lastEvaluatedKey = result.LastEvaluatedKey;
        pages++;

        if (pages >= MAX_PAGINATION_PAGES) {
          this.logger.warn(
            `Query pagination limit reached (${MAX_PAGINATION_PAGES} pages) for ${params.TableName}`
          );
          break;
        }
      } while (lastEvaluatedKey);

      return allItems;
    } catch (error) {
      this.logger.error(`Error querying ${params.TableName}`, error);
      throw error;
    }
  }

  /**
   * Scan items with automatic pagination (use sparingly).
   */
  async scan(params: ScanCommandInput) {
    try {
      const allItems: Record<string, any>[] = [];
      let lastEvaluatedKey: Record<string, any> | undefined = undefined;
      let pages = 0;

      do {
        const result: ScanCommandOutput = await this.client.send(
          new ScanCommand({ ...params, ExclusiveStartKey: lastEvaluatedKey })
        );
        allItems.push(...(result.Items || []));
        lastEvaluatedKey = result.LastEvaluatedKey;
        pages++;

        if (pages >= MAX_PAGINATION_PAGES) {
          this.logger.warn(
            `Scan pagination limit reached (${MAX_PAGINATION_PAGES} pages) for ${params.TableName}`
          );
          break;
        }
      } while (lastEvaluatedKey);

      return allItems;
    } catch (error) {
      this.logger.error(`Error scanning ${params.TableName}`, error);
      throw error;
    }
  }

  /**
   * Batch delete items using DynamoDB BatchWriteItem (25 items per batch)
   * with retry for unprocessed items.
   */
  async batchDelete(tableName: string, keys: Array<Record<string, any>>) {
    if (keys.length === 0) return;

    try {
      const chunks = this.chunkArray(keys, BATCH_WRITE_MAX_ITEMS);

      for (const chunk of chunks) {
        let unprocessedItems: Record<string, any>[] = chunk;
        let retries = 0;
        const maxRetries = 5;

        while (unprocessedItems.length > 0 && retries < maxRetries) {
          const command = new BatchWriteCommand({
            RequestItems: {
              [tableName]: unprocessedItems.map((key) => ({
                DeleteRequest: { Key: key },
              })),
            },
          });

          const result = await this.client.send(command);

          const remaining = result.UnprocessedItems?.[tableName];
          if (remaining && remaining.length > 0) {
            unprocessedItems = remaining.map(
              (item) => item.DeleteRequest?.Key as Record<string, any>
            ).filter(Boolean);
            retries++;
            // Exponential backoff
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 100));
          } else {
            unprocessedItems = [];
          }
        }

        if (unprocessedItems.length > 0) {
          this.logger.error(
            `Failed to delete ${unprocessedItems.length} items from ${tableName} after ${maxRetries} retries`
          );
        }
      }

      this.logger.log(`Batch deleted ${keys.length} items from ${tableName}`);
    } catch (error) {
      this.logger.error(`Error batch deleting from ${tableName}`, error);
      throw error;
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
