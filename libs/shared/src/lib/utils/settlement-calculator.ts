import { Expense } from '../interfaces/expense.interface';
import { MemberBalance, Transaction } from '../interfaces/settlement.interface';

/**
 * Calculate settlement balances for all members.
 * If participantNames provided, split equally among ALL participants (not just payers).
 * All amounts rounded to integers (VND has no decimals).
 */
export function calculateBalances(
  expenses: Expense[],
  participantNames?: string[]
): MemberBalance[] {
  if (expenses.length === 0 && (!participantNames || participantNames.length === 0)) {
    return [];
  }

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const memberPayments = new Map<string, number>();

  expenses.forEach((expense) => {
    const current = memberPayments.get(expense.payer) || 0;
    memberPayments.set(expense.payer, current + expense.amount);
  });

  const members = participantNames && participantNames.length > 0
    ? participantNames
    : Array.from(memberPayments.keys());

  if (members.length === 0) {
    return [];
  }

  const sharePerPerson = Math.round(total / members.length);

  return members.map((member) => {
    const totalPaid = memberPayments.get(member) || 0;
    const balance = totalPaid - sharePerPerson;

    return {
      member,
      totalPaid,
      share: sharePerPerson,
      balance: Math.round(balance),
    };
  });
}

/**
 * Calculate optimal transactions to settle debts.
 * Uses greedy algorithm: match largest debtor with largest creditor.
 */
export function calculateTransactions(balances: MemberBalance[]): Transaction[] {
  const transactions: Transaction[] = [];

  const debtors = balances
    .filter((b) => b.balance < -1)
    .map((b) => ({ member: b.member, amount: -b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter((b) => b.balance > 1)
    .map((b) => ({ member: b.member, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount);

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);

    transactions.push({
      from: debtor.member,
      to: creditor.member,
      amount: Math.round(amount),
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 1) i++;
    if (creditor.amount < 1) j++;
  }

  return transactions;
}
