
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  isCompleted: boolean;
  budgetPlan?: string;
  planStatus?: 'idle' | 'generating' | 'generated' | 'error';
}

export type View = 'dashboard' | 'transactions' | 'goals';

export type Category = string;