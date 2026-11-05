import { Category, CreditCard, Transaction, RecurringExpense, IncomeCategory, InvestmentAsset, InvestmentTransaction, CustomThemeId, LocalSnapshot, LocalBackupSettings } from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CREDIT_CARDS,
  INITIAL_TRANSACTIONS,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_INVESTMENT_ASSETS,
} from '../data/initialData';

const STORAGE_KEYS = {
  CATEGORIES: 'cebim_categories_v5',
  CARDS: 'cebim_cards_v5',
  TRANSACTIONS: 'cebim_transactions_v5',
  QUICK_AMOUNTS: 'cebim_quick_amounts_v5',
  THEME: 'cebim_theme_mode_v5',
  APPS_SCRIPT_URL: 'cebim_apps_script_url_v5',
  NOTIFICATIONS: 'cebim_notifications_v5',
  AUTO_SAVE: 'cebim_auto_save_v5',
  RECURRING_EXPENSES: 'cebim_recurring_expenses_v5',
  INCOME_CATEGORIES: 'cebim_income_categories_v5',
  INVESTMENT_ASSETS: 'cebim_investment_assets_v5',
  INVESTMENT_TRANSACTIONS: 'cebim_investment_transactions_v5',
  INITIAL_CASH_BALANCE: 'cebim_initial_cash_balance_v5',
  CUSTOM_THEME: 'cebim_custom_ui_theme_v5',
  LOCAL_SNAPSHOTS: 'cebim_local_snapshots_v1',
  LOCAL_BACKUP_SETTINGS: 'cebim_local_backup_settings_v1',
};

export const DEFAULT_QUICK_AMOUNTS = [10, 50, 100, 250, 500, 1000];

export function loadCustomTheme(): CustomThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_THEME);
    if (saved && ['default', 'aurora', 'cyber', 'brutalist', 'emerald', 'sunset'].includes(saved)) {
      return saved as CustomThemeId;
    }
    return 'default';
  } catch (e) {
    return 'default';
  }
}

export function saveCustomTheme(theme: CustomThemeId) {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_THEME, theme);
  } catch (e) {
    console.error('Error saving custom theme:', e);
  }
}

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

export interface NotificationSettings {
  enabled: boolean;
  frequency: 'twice_daily' | 'daily' | 'weekly' | 'monthly';
  time: string; // HH:mm format
  lastNotified?: string; // ISO date string of last notification
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  frequency: 'daily',
  time: '14:30',
};

export function loadNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function saveNotificationSettings(settings: NotificationSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving notification settings:', e);
  }
}

export interface AutoSaveSettings {
  enabled: boolean;
  lastAutoSaveDate?: string;
}

export const DEFAULT_AUTO_SAVE_SETTINGS: AutoSaveSettings = {
  enabled: false,
};

export function loadAutoSaveSettings(): AutoSaveSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE);
    if (!raw) return DEFAULT_AUTO_SAVE_SETTINGS;
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_AUTO_SAVE_SETTINGS;
  }
}

export function saveAutoSaveSettings(settings: AutoSaveSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTO_SAVE, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving auto save settings:', e);
  }
}

// --- Storage Loaders ---

let isLegacyMigrated = false;

/**
 * Scans older storage keys (v1, v2, v3, v4 and unversioned) for data that might have been
 * stranded during prior version jumps, and safely merges them into the current v5 keys.
 */
export function migrateLegacyStorageData(): number {
  try {
    const LEGACY_TX_KEYS = [
      'cebim_transactions_v4',
      'cebim_transactions_v3',
      'cebim_transactions_v2',
      'cebim_transactions_v1',
      'cebim_transactions',
    ];

    const currentV5Raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    let currentV5Txs: Transaction[] = [];
    if (currentV5Raw) {
      try {
        const parsed = JSON.parse(currentV5Raw);
        if (Array.isArray(parsed)) currentV5Txs = parsed;
      } catch (e) {
        currentV5Txs = [];
      }
    }

    const existingIds = new Set(currentV5Txs.map((t) => t.id));
    const existingFingerprints = new Set(
      currentV5Txs.map((t) => `${t.date}_${t.amount}_${t.categoryId}_${t.note || ''}`)
    );

    let recoveredCount = 0;
    const recoveredTxs: Transaction[] = [];

    for (const key of LEGACY_TX_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const legacyList = JSON.parse(raw);
        if (Array.isArray(legacyList)) {
          for (const item of legacyList) {
            if (!item || typeof item !== 'object') continue;
            const fp = `${item.date}_${item.amount}_${item.categoryId}_${item.note || ''}`;
            if (!existingIds.has(item.id) && !existingFingerprints.has(fp)) {
              existingIds.add(item.id);
              existingFingerprints.add(fp);
              recoveredTxs.push(item);
              recoveredCount++;
            }
          }
        }
      } catch (e) {
        console.warn(`Failed to parse legacy key ${key}:`, e);
      }
    }

    if (recoveredCount > 0) {
      const merged = [...recoveredTxs, ...currentV5Txs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(merged));
      console.log(`[Storage Migration] Successfully recovered ${recoveredCount} legacy transactions into v5!`);
    }

    // Also migrate cards if v5 has none or missing cards
    const LEGACY_CARD_KEYS = ['cebim_cards_v3', 'cebim_cards_v2', 'cebim_cards_v1', 'cebim_cards'];
    const currentCardsRaw = localStorage.getItem(STORAGE_KEYS.CARDS);
    let currentCards: CreditCard[] = [];
    if (currentCardsRaw) {
      try {
        const p = JSON.parse(currentCardsRaw);
        if (Array.isArray(p)) currentCards = p;
      } catch (e) {}
    }
    const cardIds = new Set(currentCards.map((c) => c.id));
    let cardsRecovered = 0;
    for (const key of LEGACY_CARD_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const legacyCards = JSON.parse(raw);
        if (Array.isArray(legacyCards)) {
          for (const c of legacyCards) {
            if (c && c.id && !cardIds.has(c.id)) {
              cardIds.add(c.id);
              currentCards.push(c);
              cardsRecovered++;
            }
          }
        }
      } catch (e) {}
    }
    if (cardsRecovered > 0) {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(currentCards));
      console.log(`[Storage Migration] Successfully recovered ${cardsRecovered} legacy credit cards into v5!`);
    }

    isLegacyMigrated = true;
    return recoveredCount;
  } catch (err) {
    console.error('Error during legacy storage migration:', err);
    return 0;
  }
}

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
    if (!isLegacyMigrated) {
      migrateLegacyStorageData();
    }
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
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  localStorage.removeItem(STORAGE_KEYS.RECURRING_EXPENSES);
  localStorage.removeItem(STORAGE_KEYS.INCOME_CATEGORIES);
  localStorage.removeItem(STORAGE_KEYS.INVESTMENT_ASSETS);
  localStorage.removeItem(STORAGE_KEYS.INVESTMENT_TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.INITIAL_CASH_BALANCE);
}

// --- Income Categories Storage ---

export function loadIncomeCategories(): IncomeCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INCOME_CATEGORIES);
    if (!raw) return DEFAULT_INCOME_CATEGORIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_INCOME_CATEGORIES;
  } catch (e) {
    return DEFAULT_INCOME_CATEGORIES;
  }
}

export function saveIncomeCategories(categories: IncomeCategory[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.INCOME_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving income categories:', e);
  }
}

// --- Investment Assets Storage ---

export function loadInvestmentAssets(): InvestmentAsset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVESTMENT_ASSETS);
    if (!raw) return DEFAULT_INVESTMENT_ASSETS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_INVESTMENT_ASSETS;
  } catch (e) {
    return DEFAULT_INVESTMENT_ASSETS;
  }
}

export function saveInvestmentAssets(assets: InvestmentAsset[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.INVESTMENT_ASSETS, JSON.stringify(assets));
  } catch (e) {
    console.error('Error saving investment assets:', e);
  }
}

// --- Investment Transactions Storage ---

export function loadInvestmentTransactions(): InvestmentTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVESTMENT_TRANSACTIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveInvestmentTransactions(txs: InvestmentTransaction[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.INVESTMENT_TRANSACTIONS, JSON.stringify(txs));
  } catch (e) {
    console.error('Error saving investment transactions:', e);
  }
}

// --- Initial Cash Balance ---

export function loadInitialCashBalance(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INITIAL_CASH_BALANCE);
    return raw ? parseFloat(raw) || 0 : 0;
  } catch (e) {
    return 0;
  }
}

export function saveInitialCashBalance(amount: number) {
  try {
    localStorage.setItem(STORAGE_KEYS.INITIAL_CASH_BALANCE, amount.toString());
  } catch (e) {
    console.error('Error saving initial cash balance:', e);
  }
}

// --- Core Financial Calculations ---

/**
 * Calculates current liquid cash / bank balance.
 *
 * Inflow (+):
 * - Initial cash balance
 * - All income transactions ('income')
 * - All investment withdrawals ('investment_withdraw')
 *
 * Outflow (-):
 * - Cash expenses ('expense' where sourceType === 'cash_bank')
 * - Credit card debt payments ('card_payment' paid from cash)
 * - Cash moved into investments ('investment_deposit')
 *
 * Note: Card expenses do NOT decrease liquid cash when purchased;
 * cash is decreased only when the credit card debt is actually paid ('card_payment')!
 */
export function calculateLiquidCashBalance(
  transactions: Transaction[],
  initialBalance: number = 0
): number {
  let balance = initialBalance;

  transactions.forEach((t) => {
    const amount = Number(t.amount) || 0;

    switch (t.type) {
      case 'income':
        balance += amount;
        break;
      case 'investment_withdraw':
        balance += amount;
        break;
      case 'expense':
        if (t.sourceType === 'cash_bank') {
          balance -= amount;
        }
        break;
      case 'card_payment':
        balance -= amount;
        break;
      case 'investment_deposit':
        balance -= amount;
        break;
      default:
        break;
    }
  });

  return balance;
}

export interface InvestmentStats {
  totalInvested: number; // Total net principal in active assets
  totalCurrentValue: number; // Current valuation across all assets
  unrealizedProfitLoss: number; // currentValue - investedAmount
  realizedProfitLoss: number; // Net profit from closed/withdrawn positions
  totalProfitLoss: number; // unrealized + realized
  returnPercentage: number; // Overall return rate %
}

export function calculateInvestmentStats(
  assets: InvestmentAsset[],
  transactions: Transaction[]
): InvestmentStats {
  const totalInvested = assets.reduce((sum, a) => sum + (Number(a.investedAmount) || 0), 0);
  const totalCurrentValue = assets.reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0);
  const unrealizedProfitLoss = totalCurrentValue - totalInvested;

  // Realized profit from withdrawals
  const realizedProfitLoss = transactions
    .filter((t) => t.type === 'investment_withdraw')
    .reduce((sum, t) => sum + (Number(t.profitOrLoss) || 0), 0);

  const totalProfitLoss = unrealizedProfitLoss + realizedProfitLoss;
  const returnPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  return {
    totalInvested,
    totalCurrentValue,
    unrealizedProfitLoss,
    realizedProfitLoss,
    totalProfitLoss,
    returnPercentage,
  };
}

/**
 * Net Worth = Liquid Cash + Current Investments Value - Total Unpaid Card Debts
 */
export function calculateNetWorth(
  cashBalance: number,
  investmentAssets: InvestmentAsset[],
  totalCardDebt: number
): number {
  const totalInvestments = investmentAssets.reduce(
    (sum, a) => sum + (Number(a.currentValue) || 0),
    0
  );
  return cashBalance + totalInvestments - totalCardDebt;
}

export function loadRecurringExpenses(): RecurringExpense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECURRING_EXPENSES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error loading recurring expenses:', e);
    return [];
  }
}

export function saveRecurringExpenses(items: RecurringExpense[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.RECURRING_EXPENSES, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving recurring expenses:', e);
  }
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

// --- Local Snapshots & Periodic Rolling Backups ---

export const DEFAULT_LOCAL_BACKUP_SETTINGS: LocalBackupSettings = {
  autoBackupEnabled: true,
  intervalDays: 3,
  overwriteMode: 'rolling', // 'rolling' (üstüne yaz) | 'keep_all' (yeni kayıt aç)
  maxRollingSlots: 5,
};

export function loadLocalBackupSettings(): LocalBackupSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_BACKUP_SETTINGS);
    if (!raw) return DEFAULT_LOCAL_BACKUP_SETTINGS;
    return { ...DEFAULT_LOCAL_BACKUP_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_LOCAL_BACKUP_SETTINGS;
  }
}

export function saveLocalBackupSettings(settings: LocalBackupSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCAL_BACKUP_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving local backup settings:', e);
  }
}

export function loadLocalSnapshots(): LocalSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_SNAPSHOTS);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    return [];
  }
}

export function saveLocalSnapshots(snapshots: LocalSnapshot[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCAL_SNAPSHOTS, JSON.stringify(snapshots));
  } catch (e) {
    console.error('Error saving local snapshots:', e);
  }
}

export function createLocalSnapshot(
  title?: string,
  type: 'auto_3day' | 'manual' = 'manual'
): LocalSnapshot {
  const categories = loadCategories();
  const incomeCategories = loadIncomeCategories();
  const investmentAssets = loadInvestmentAssets();
  const investmentTransactions = loadInvestmentTransactions();
  const cards = loadCards();
  const transactions = loadTransactions();
  const recurringExpenses = loadRecurringExpenses();
  const initialCashBalance = loadInitialCashBalance();
  const now = new Date();

  const formattedDate = now.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const autoTitle = type === 'auto_3day' 
    ? 'Otomatik Döngü (3 Günlük)' 
    : (title?.trim() || `Manuel Yedek (${formattedDate})`);

  const snapshot: LocalSnapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now.toISOString(),
    title: autoTitle,
    type,
    meta: {
      transactionCount: transactions.length,
      cardCount: cards.length,
      categoryCount: categories.length + incomeCategories.length,
      cashBalance: initialCashBalance,
    },
    data: {
      categories,
      incomeCategories,
      investmentAssets,
      investmentTransactions,
      cards,
      transactions,
      recurringExpenses,
      initialCashBalance,
      exportedAt: now.toISOString(),
    },
  };

  const currentList = loadLocalSnapshots();
  const settings = loadLocalBackupSettings();

  let updatedList = [snapshot, ...currentList];

  // If this is an auto_3day snapshot and overwriteMode is 'rolling', keep at most maxRollingSlots auto snapshots
  if (type === 'auto_3day' && settings.overwriteMode === 'rolling') {
    const autoSnaps = updatedList.filter((s) => s.type === 'auto_3day');
    const manualSnaps = updatedList.filter((s) => s.type !== 'auto_3day');
    const trimmedAuto = autoSnaps.slice(0, settings.maxRollingSlots || 5);
    updatedList = [...manualSnaps, ...trimmedAuto].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  saveLocalSnapshots(updatedList);
  return snapshot;
}

export function deleteLocalSnapshot(id: string): LocalSnapshot[] {
  const current = loadLocalSnapshots();
  const filtered = current.filter((s) => s.id !== id);
  saveLocalSnapshots(filtered);
  return filtered;
}

export function checkAndRunAutoLocalBackup(): LocalSnapshot | null {
  const settings = loadLocalBackupSettings();
  if (!settings.autoBackupEnabled) return null;

  const now = new Date();
  if (settings.lastAutoBackupDate) {
    const lastDate = new Date(settings.lastAutoBackupDate);
    const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < (settings.intervalDays || 3)) {
      return null;
    }
  }

  const snapshot = createLocalSnapshot('Otomatik Döngü (3 Günlük)', 'auto_3day');
  settings.lastAutoBackupDate = now.toISOString();
  saveLocalBackupSettings(settings);
  return snapshot;
}

