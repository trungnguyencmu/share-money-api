export interface MemberBalance {
  member: string;
  totalPaid: number;
  share: number;
  balance: number;
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

export interface SettlementResult {
  balances: MemberBalance[];
  transactions: Transaction[];
  totalExpenses: number;
  participantCount: number;
}
