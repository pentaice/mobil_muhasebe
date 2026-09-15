import { Capacitor, registerPlugin } from '@capacitor/core';
import { Category, Transaction } from '../types';

export interface WidgetBridgePlugin {
  getPendingTransactions(): Promise<{ transactions: any[] }>;
  clearPendingTransactions(): Promise<void>;
  syncCategories(options: { categories: Array<{ id: string; name: string }> }): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

/**
 * Sends top 4 categories to Android SharedPreferences so the widget buttons
 * dynamically show the user's current categories.
 */
export async function syncCategoriesToWidget(categories: Category[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const top4 = categories.slice(0, 4).map((c) => ({
      id: c.id,
      name: c.name,
    }));
    await WidgetBridge.syncCategories({ categories: top4 });
  } catch (err) {
    console.warn('Failed to sync categories to widget:', err);
  }
}

/**
 * Checks for any transactions recorded from the home screen widget while the app was closed.
 * Adds them to the application state and clears the queue.
 */
export async function checkAndImportWidgetTransactions(
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void,
  showToast?: (message: string, type: 'success' | 'info' | 'error') => void
): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;

  try {
    const res = await WidgetBridge.getPendingTransactions();
    if (!res || !res.transactions || res.transactions.length === 0) {
      return 0;
    }

    const txs = res.transactions;
    for (const rawTx of txs) {
      onAddTransaction({
        type: 'expense',
        amount: Number(rawTx.amount) || 0,
        categoryId: rawTx.categoryId || 'cat-diger',
        sourceType: rawTx.sourceType === 'cash_bank' ? 'cash_bank' : 'credit_card',
        date: rawTx.date || new Date().toISOString(),
        note: rawTx.note || 'Widget ile eklendi',
      });
    }

    await WidgetBridge.clearPendingTransactions();

    if (showToast && txs.length > 0) {
      showToast(`Widget üzerinden ${txs.length} harcama aktarıldı`, 'success');
    }

    return txs.length;
  } catch (err) {
    console.warn('Failed to import widget transactions:', err);
    return 0;
  }
}
