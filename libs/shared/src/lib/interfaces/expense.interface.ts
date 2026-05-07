export interface Expense {
  tripId: string;
  expenseId: string;
  payerUserId: string;
  payer: string;
  title: string;
  amount: number;
  date: string;
  createdAt: string;
  billId?: string;
}
