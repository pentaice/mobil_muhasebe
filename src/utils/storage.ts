import { Category, CreditCard, Transaction } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_CREDIT_CARDS, INITIAL_TRANSACTIONS } from '../data/initialData';

const STORAGE_KEYS = {
  CATEGORIES: 'cebim_categories_v3',
  CARDS: 'cebim_cards_v3',
  TRANSACTIONS: 'cebim_transactions_v3',
  QUICK_AMOUNTS: 'cebim_quick_amounts_v3',
  THEME: 'cebim_theme_mode_v3',
  APPS_SCRIPT_URL: 'cebim_apps_script_url_v3',
};

export const DEFAULT_QUICK_AMOUNTS = [10, 50, 100, 250, 500, 1000];

export function loadTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    // Default to dark or system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch (e) {
    return 'light';
  }
}

export function saveTheme(theme: 'light' | 'dark') {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {
    console.error('Error saving theme:', e);
  }
}

export function loadAppsScriptUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.APPS_SCRIPT_URL) || '';
  } catch (e) {
    return '';
  }
}

export function saveAppsScriptUrl(url: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.APPS_SCRIPT_URL, url);
  } catch (e) {
    console.error('Error saving apps script url:', e);
  }
}

export function loadQuickAmounts(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUICK_AMOUNTS);
    if (!raw) return DEFAULT_QUICK_AMOUNTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_QUICK_AMOUNTS;
  } catch (e) {
    return DEFAULT_QUICK_AMOUNTS;
  }
}

export function saveQuickAmounts(amounts: number[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.QUICK_AMOUNTS, JSON.stringify(amounts));
  } catch (e) {
    console.error('Error saving quick amounts:', e);
  }
}

// --- Storage Loaders ---

export function loadCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch (e) {
    console.error('Error loading categories:', e);
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: Category[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving categories:', e);
  }
}

export function loadCards(): CreditCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
    if (!raw) return DEFAULT_CREDIT_CARDS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_CREDIT_CARDS;
  } catch (e) {
    console.error('Error loading cards:', e);
    return DEFAULT_CREDIT_CARDS;
  }
}

export function saveCards(cards: CreditCard[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  } catch (e) {
    console.error('Error saving cards:', e);
  }
}

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) return INITIAL_TRANSACTIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_TRANSACTIONS;
  } catch (e) {
    console.error('Error loading transactions:', e);
    return INITIAL_TRANSACTIONS;
  }
}

export function saveTransactions(transactions: Transaction[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Error saving transactions:', e);
  }
}

export function resetAllData() {
  localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  localStorage.removeItem(STORAGE_KEYS.CARDS);
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.QUICK_AMOUNTS);
}

// --- Card Cycle Calculations ---

export interface CardCycleInfo {
  cycleStartDate: Date;
  cutoffDate: Date;
  dueDate: Date;
  daysUntilCutoff: number;
  currentCycleExpenses: number;
  currentCyclePayments: number;
  currentCycleNetDebt: number; // expenses - payments
  totalUnpaidDebt: number; // all-time expenses on card - all-time payments to card
  availableLimit: number;
}

export function calculateCardCycleInfo(card: CreditCard, transactions: Transaction[]): CardCycleInfo {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayDay = now.getDate();

  let cutoffDate: Date;
  let cycleStartDate: Date;

  if (todayDay > card.cutoffDay) {
    cutoffDate = new Date(currentYear, currentMonth + 1, card.cutoffDay, 23, 59, 59);
    cycleStartDate = new Date(currentYear, currentMonth, card.cutoffDay + 1, 0, 0, 0);
  } else {
    cutoffDate = new Date(currentYear, currentMonth, card.cutoffDay, 23, 59, 59);
    cycleStartDate = new Date(currentYear, currentMonth - 1, card.cutoffDay + 1, 0, 0, 0);
  }

  const dueDate = new Date(cutoffDate);
  dueDate.setDate(dueDate.getDate() + card.dueDayOffsetDays);

  const diffTime = cutoffDate.getTime() - now.getTime();
  const daysUntilCutoff = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const cardTx = transactions.filter(
    (t) => t.creditCardId === card.id || (t.type === 'expense' && t.sourceType === 'credit_card' && t.creditCardId === card.id)
  );

  let currentCycleExpenses = 0;
  let currentCyclePayments = 0;
  let totalExpensesAllTime = 0;
  let totalPaymentsAllTime = 0;

  cardTx.forEach((t) => {
    const tDate = new Date(t.date);
    const amount = Number(t.amount) || 0;

    if (t.type === 'expense' && t.sourceType === 'credit_card') {
      totalExpensesAllTime += amount;
      if (tDate >= cycleStartDate && tDate <= cutoffDate) {
        currentCycleExpenses += amount;
      }
    } else if (t.type === 'card_payment') {
      totalPaymentsAllTime += amount;
      if (tDate >= cycleStartDate && tDate <= cutoffDate) {
        currentCyclePayments += amount;
      }
    }
  });

  const currentCycleNetDebt = Math.max(0, currentCycleExpenses - currentCyclePayments);
  const totalUnpaidDebt = Math.max(0, totalExpensesAllTime - totalPaymentsAllTime);
  const availableLimit = Math.max(0, card.limit - totalUnpaidDebt);

  return {
    cycleStartDate,
    cutoffDate,
    dueDate,
    daysUntilCutoff,
    currentCycleExpenses,
    currentCyclePayments,
    currentCycleNetDebt,
    totalUnpaidDebt,
    availableLimit,
  };
}

// --- Format Currency & Dates ---

export function formatTL(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortDate(dateString: string): string {
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatFullDate(dateString: string): string {
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}
