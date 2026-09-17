import { RecurringExpense, Transaction, CreditCard } from '../types';

export interface ProcessRecurringResult {
  newTransactions: Omit<Transaction, 'id' | 'createdAt'>[];
  updatedRecurringExpenses: RecurringExpense[];
}

/**
 * Checks all active recurring expenses for credit cards.
 * If the scheduled day of the month has arrived and has not yet been processed for the current month,
 * it automatically generates a transaction for that card.
 *
 * Rule: Recurring expenses only start after they are created ("girildikten sonra başlayacak şekilde").
 * If created on the 16th for the 5th of the month, the first charge will occur on the 5th of the NEXT month.
 */
export function processRecurringExpenses(
  recurringList: RecurringExpense[],
  cards: CreditCard[]
): ProcessRecurringResult {
  const newTransactions: Omit<Transaction, 'id' | 'createdAt'>[] = [];
  const validCardIds = new Set(cards.map((c) => c.id));

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 - 11
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const currentDay = now.getDate();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const updatedRecurringExpenses = recurringList.map((item) => {
    // 1. Skip if inactive
    if (!item.isActive) {
      return item;
    }

    const effectiveSource = item.sourceType || (item.cardId ? 'credit_card' : 'cash_bank');

    // If card payment but card no longer exists, skip
    if (effectiveSource === 'credit_card' && item.cardId && !validCardIds.has(item.cardId)) {
      return item;
    }

    // 2. Skip if already processed for this month
    if (item.lastProcessedMonth === currentMonthKey) {
      return item;
    }

    // 3. Check start date boundary
    const startDate = new Date(item.startDate);
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const startMonthKey = `${startYear}-${String(startMonth + 1).padStart(2, '0')}`;

    // If created this month, but the due day has already passed before creation,
    // advance lastProcessedMonth to current month so it begins on the next month's day
    if (startMonthKey === currentMonthKey && item.dayOfMonth < startDate.getDate()) {
      return {
        ...item,
        lastProcessedMonth: currentMonthKey,
      };
    }

    // 4. Determine effective day for this month (e.g. 31 in a 30-day month -> 30)
    const targetDay = Math.min(item.dayOfMonth, daysInCurrentMonth);

    // 5. If today is at or past the target day, trigger the transaction
    if (currentDay >= targetDay) {
      const txDate = new Date(currentYear, currentMonth, targetDay, 9, 0, 0).toISOString();

      newTransactions.push({
        type: 'expense',
        amount: item.amount,
        categoryId: item.categoryId || 'cat-fatura',
        sourceType: effectiveSource,
        creditCardId: effectiveSource === 'credit_card' ? item.cardId : undefined,
        date: txDate,
        note: `Düzenli Gider: ${item.title}`,
      });

      return {
        ...item,
        lastProcessedMonth: currentMonthKey,
      };
    }

    return item;
  });

  return {
    newTransactions,
    updatedRecurringExpenses,
  };
}
