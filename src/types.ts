export type TransactionType = 'expense' | 'card_payment';

export type PaymentSourceType = 'cash_bank' | 'credit_card';

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name string
  color: string; // Tailwind color class or hex
  isCustom?: boolean;
}

export interface CreditCard {
  id: string;
  name: string;
  cardNetwork: 'visa' | 'mastercard' | 'troy' | 'amex';
  last4: string;
  limit: number;
  cutoffDay: number; // e.g., 15 (15th of the month)
  dueDayOffsetDays: number; // e.g., 10 days after cutoff
  color: string; // Gradient background style
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string; // Category ID or 'card_payment'
  sourceType: PaymentSourceType;
  creditCardId?: string; // If sourceType === 'credit_card' or if paying a credit card
  date: string; // ISO string e.g. "2026-08-08T14:30:00.000Z"
  note?: string;
  createdAt: string;
}

export interface MonthlySummary {
  monthKey: string; // YYYY-MM
  totalExpense: number;
  totalCardPayments: number;
  byCategory: Record<string, number>;
  byCard: Record<string, number>;
}
