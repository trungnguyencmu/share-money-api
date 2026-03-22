import { randomUUID } from 'crypto';

export function generateTripId(): string {
  return randomUUID();
}

export function generateExpenseId(): string {
  return `exp-${randomUUID()}`;
}

export function generateTimestamp(): string {
  return new Date().toISOString();
}
