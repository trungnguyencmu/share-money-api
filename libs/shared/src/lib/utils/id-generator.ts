import { randomBytes, randomUUID } from 'crypto';

export function generateTripId(): string {
  return randomUUID();
}

export function generateExpenseId(): string {
  return `exp-${randomUUID()}`;
}

export function generateInviteCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

export function generateTimestamp(): string {
  return new Date().toISOString();
}
