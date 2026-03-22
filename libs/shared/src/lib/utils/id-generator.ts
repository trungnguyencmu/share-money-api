import { randomUUID } from 'crypto';

/**
 * Generate a unique trip ID
 */
export function generateTripId(): string {
  return randomUUID();
}

/**
 * Generate a unique expense ID
 */
export function generateExpenseId(): string {
  return `exp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate ISO timestamp string
 */
export function generateTimestamp(): string {
  return new Date().toISOString();
}
