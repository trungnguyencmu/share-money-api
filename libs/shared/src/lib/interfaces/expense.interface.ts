export interface Expense {
  tripId: string;
  expenseId: string;
  payer: string;
  title: string;
  amount: number;
  date: string;
  createdAt: string;
  billId?: string;
}
