export type TransactionType =
  | 'expense'
  | 'income'
  | 'card_payment'
  | 'investment_deposit'
  | 'investment_withdraw';

export type PaymentSourceType = 'cash_bank' | 'credit_card';

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name string
  color: string; // Tailwind color class or hex
  isCustom?: boolean;
}

export interface IncomeCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
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
  categoryId: string; // Category ID, Income Category ID, 'card_payment' or 'investment'
  sourceType: PaymentSourceType;
  creditCardId?: string; // If sourceType === 'credit_card' or if paying a credit card
  investmentAssetId?: string; // If related to an investment asset
  profitOrLoss?: number; // Realized gain/loss if type === 'investment_withdraw'
  date: string; // ISO string e.g. "2026-08-08T14:30:00.000Z"
  note?: string;
  createdAt: string;
}

export type InvestmentCategory = 'gold' | 'forex' | 'stock' | 'fund' | 'crypto' | 'deposit' | 'other';

export interface InvestmentAsset {
  id: string;
  name: string; // e.g. "Gram Altın", "Dolar (USD)", "BIST 100", "Eurobond"
  category: InvestmentCategory;
  investedAmount: number; // Total net cash invested as principal
  currentValue: number; // Latest market valuation
  color: string;
  icon: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentTransaction {
  id: string;
  assetId: string;
  type: 'deposit' | 'withdraw' | 'valuation_update';
  amount: number; // Cash transferred or valuation difference
  costBasis?: number; // Principal portion for withdrawals
  profitOrLoss?: number; // Realized gain/loss for withdrawals
  currentValuation: number; // Asset valuation after this transaction
  date: string;
  note?: string;
  createdAt: string;
}

export interface MonthlySummary {
  monthKey: string; // YYYY-MM
  totalExpense: number;
  totalIncome: number;
  totalCardPayments: number;
  totalInvested: number;
  byCategory: Record<string, number>;
  byCard: Record<string, number>;
}

export interface RecurringExpense {
  id: string;
  title: string; // e.g. "Netflix", "Kira", "Aidat"
  amount: number;
  categoryId: string;
  sourceType: PaymentSourceType;
  cardId?: string; // Credit card ID if sourceType === 'credit_card'
  dayOfMonth: number; // 1 - 31
  startDate: string; // ISO date string when added
  lastProcessedMonth?: string; // YYYY-MM
  isActive: boolean;
  createdAt: string;
}

