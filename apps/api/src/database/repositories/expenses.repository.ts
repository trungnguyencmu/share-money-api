import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Expense } from '@share-money/shared';
import { DynamoDBService } from '../dynamodb.service';

@Injectable()
export class ExpensesRepository {
  private readonly tableName: string;

  constructor(
    private readonly dynamodbService: DynamoDBService,
    private readonly configService: ConfigService
  ) {
    this.tableName =
      this.configService.get<string>('DYNAMODB_EXPENSES_TABLE') || 'share-money-expenses-dev';
  }

  /**
   * Create a new expense
   */
  async create(expense: Expense): Promise<Expense> {
    await this.dynamodbService.put({
      TableName: this.tableName,
      Item: expense,
    });
    return expense;
  }

  /**
   * Find expense by ID
   */
  async findById(tripId: string, expenseId: string): Promise<Expense | null> {
    const item = await this.dynamodbService.get({
      TableName: this.tableName,
      Key: { tripId, expenseId },
    });
    return item ? (item as Expense) : null;
  }

  /**
   * Find all expenses for a trip
   */
  async findByTripId(tripId: string): Promise<Expense[]> {
    const items = await this.dynamodbService.query({
      TableName: this.tableName,
      IndexName: 'TripId-CreatedAt-Index',
      KeyConditionExpression: 'tripId = :tripId',
      ExpressionAttributeValues: {
        ':tripId': tripId,
      },
      ScanIndexForward: false, // Sort by createdAt descending (newest first)
    });
    return items as Expense[];
  }

  /**
   * Find all expenses for a trip within a date range
   */
  async findByTripIdAndDateRange(
    tripId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Expense[]> {
    const expenses = await this.findByTripId(tripId);
    return expenses.filter((expense) => {
      if (!startDate && !endDate) return true;
      const expenseDate = expense.date;
      if (startDate && expenseDate < startDate) return false;
      if (endDate && expenseDate > endDate) return false;
      return true;
    });
  }

  /**
   * Update expense
   */
  async update(tripId: string, expenseId: string, updates: Partial<Expense>): Promise<Expense> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'tripId' && key !== 'expenseId') {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updateExpressions.length === 0) {
      const existing = await this.findById(tripId, expenseId);
      if (!existing) {
        throw new Error('Expense not found');
      }
      return existing;
    }

    const result = await this.dynamodbService.update({
      TableName: this.tableName,
      Key: { tripId, expenseId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    return result as Expense;
  }

  /**
   * Delete single expense
   */
  async delete(tripId: string, expenseId: string): Promise<void> {
    await this.dynamodbService.delete({
      TableName: this.tableName,
      Key: { tripId, expenseId },
    });
  }

  /**
   * Delete all expenses for a trip
   */
  async deleteAllByTripId(tripId: string): Promise<void> {
    const expenses = await this.findByTripId(tripId);
    const keys = expenses.map((expense) => ({
      tripId: expense.tripId,
      expenseId: expense.expenseId,
    }));
    await this.dynamodbService.batchDelete(this.tableName, keys);
  }
}
