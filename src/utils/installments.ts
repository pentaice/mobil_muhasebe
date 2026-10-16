import { Transaction } from '../types';

/**
 * Safely adds months to a date without overflowing into the next month.
 * For example: 31 Jan + 1 month => 28/29 Feb (not 2/3 Mar).
 */
export function addMonthsSafe(baseDate: Date, monthsToAdd: number): Date {
  const result = new Date(baseDate.getTime());
  const targetMonth = result.getMonth() + monthsToAdd;
  const originalDay = baseDate.getDate();

  // Set to day 1 to avoid automatic overflow when advancing months
  result.setDate(1);
  result.setMonth(targetMonth);

  // Find max days in target month
  const maxDaysInTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();

  // Clamp to the last day of target month if original day exceeds it
  result.setDate(Math.min(originalDay, maxDaysInTargetMonth));
  return result;
}

export interface SplitInstallmentOptions {
  installmentCount: number;
  startNextMonth?: boolean;
  totalWithInterest?: number;
  customNote?: string;
}

export interface InstallmentScheduleItem {
  installmentNumber: number;
  date: string;
  amount: number;
  monthName: string;
  isCurrentMonth: boolean;
  isFutureMonth: boolean;
}

export interface InstallmentImpactAnalysis {
  originalAmount: number;
  totalAmount: number;
  installmentCount: number;
  monthlyBaseAmount: number;
  currentMonthRelief: number; // Bu ay bütçede oluşacak rahatlama (+TL)
  currentMonthInstallmentAmount: number; // Bu ay ödenmesi gereken tutar
  futureTotalCommitment: number; // Gelecek aylara devreden taksit taahhüdü
  schedule: InstallmentScheduleItem[];
}

/**
 * Calculates a preview of installment impact and monthly schedule
 * before the user applies the plan.
 */
export function calculateInstallmentImpact(
  originalAmount: number,
  originalDateStr: string,
  options: SplitInstallmentOptions
): InstallmentImpactAnalysis {
  const count = Math.max(2, Math.min(36, options.installmentCount));
  const totalAmount = options.totalWithInterest && options.totalWithInterest > 0
    ? options.totalWithInterest
    : originalAmount;

  // Split cents with 2 decimals
  const monthlyBase = Math.floor((totalAmount / count) * 100) / 100;
  const remainder = Math.round((totalAmount - monthlyBase * count) * 100) / 100;

  const baseDate = new Date(originalDateStr);
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const schedule: InstallmentScheduleItem[] = [];
  let currentMonthInstallmentAmount = 0;

  for (let i = 1; i <= count; i++) {
    const monthOffset = options.startNextMonth ? i : i - 1;
    const instDate = addMonthsSafe(baseDate, monthOffset);
    const amount = i === 1 ? Number((monthlyBase + remainder).toFixed(2)) : monthlyBase;

    const instMonthKey = `${instDate.getFullYear()}-${String(instDate.getMonth() + 1).padStart(2, '0')}`;
    const isCurrentMonth = instMonthKey === currentMonthKey;
    const isFutureMonth = instDate.getTime() > now.getTime() && !isCurrentMonth;

    if (isCurrentMonth) {
      currentMonthInstallmentAmount += amount;
    }

    const monthName = new Intl.DateTimeFormat('tr-TR', {
      month: 'long',
      year: 'numeric',
    }).format(instDate);

    schedule.push({
      installmentNumber: i,
      date: instDate.toISOString(),
      amount,
      monthName,
      isCurrentMonth,
      isFutureMonth,
    });
  }

  // Bu ayki açığa rahatlama: Orijinal harcama tutarı - Bu ay ödenecek taksit tutarı
  // Eğer harcama zaten bu ay yapılmışsa ve taksite bölünüyorsa
  const isOriginalInCurrentMonth =
    baseDate.getFullYear() === now.getFullYear() &&
    baseDate.getMonth() === now.getMonth();

  const currentMonthRelief = isOriginalInCurrentMonth
    ? Math.max(0, originalAmount - currentMonthInstallmentAmount)
    : 0;

  // Gelecek ayların toplam taahhüdü
  const futureTotalCommitment = schedule
    .filter((s) => s.isFutureMonth)
    .reduce((sum, s) => sum + s.amount, 0);

  return {
    originalAmount,
    totalAmount,
    installmentCount: count,
    monthlyBaseAmount: monthlyBase,
    currentMonthRelief,
    currentMonthInstallmentAmount,
    futureTotalCommitment,
    schedule,
  };
}

/**
 * Splits a single transaction into N installment transactions.
 */
export function splitTransactionIntoInstallments(
  originalTx: Transaction,
  options: SplitInstallmentOptions
): Transaction[] {
  const count = Math.max(2, Math.min(36, options.installmentCount));
  const totalAmount = options.totalWithInterest && options.totalWithInterest > 0
    ? options.totalWithInterest
    : originalTx.amount;

  const monthlyBase = Math.floor((totalAmount / count) * 100) / 100;
  const remainder = Math.round((totalAmount - monthlyBase * count) * 100) / 100;

  const groupId = `inst-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const baseDate = new Date(originalTx.date);

  // Clean existing installment tags in note if any
  const cleanBaseNote = (options.customNote ?? originalTx.note ?? '')
    .replace(/\s*\(\d+\/\d+\s+Taksit\)/gi, '')
    .trim();

  const transactions: Transaction[] = [];

  for (let i = 1; i <= count; i++) {
    const monthOffset = options.startNextMonth ? i : i - 1;
    const instDate = addMonthsSafe(baseDate, monthOffset);
    const amount = i === 1 ? Number((monthlyBase + remainder).toFixed(2)) : monthlyBase;
    const noteWithTag = cleanBaseNote
      ? `${cleanBaseNote} (${i}/${count} Taksit)`
      : `Taksit ${i}/${count}`;

    transactions.push({
      ...originalTx,
      id: `tx-inst-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      amount,
      date: instDate.toISOString(),
      note: noteWithTag,
      createdAt: new Date().toISOString(),
      installmentGroupId: groupId,
      installmentNumber: i,
      installmentTotal: count,
      originalTransactionAmount: originalTx.originalTransactionAmount || originalTx.amount,
    });
  }

  return transactions;
}

/**
 * Reverts an installment group back to a single one-off transaction.
 */
export function mergeInstallmentsBackToSingle(
  allTransactions: Transaction[],
  groupId: string
): { singleTx: Transaction; removedIds: string[] } | null {
  const groupTxs = allTransactions.filter((t) => t.installmentGroupId === groupId);
  if (groupTxs.length === 0) return null;

  // Sort by installment number or date
  groupTxs.sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0));
  const firstTx = groupTxs[0];

  const totalAmount = firstTx.originalTransactionAmount && firstTx.originalTransactionAmount > 0
    ? firstTx.originalTransactionAmount
    : groupTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Clean note
  const cleanNote = (firstTx.note || '')
    .replace(/\s*\(\d+\/\d+\s+Taksit\)/gi, '')
    .trim() || undefined;

  const singleTx: Transaction = {
    ...firstTx,
    id: firstTx.id,
    amount: totalAmount,
    note: cleanNote,
    date: firstTx.date,
    installmentGroupId: undefined,
    installmentNumber: undefined,
    installmentTotal: undefined,
    originalTransactionAmount: undefined,
  };

  const removedIds = groupTxs.filter((t) => t.id !== singleTx.id).map((t) => t.id);

  return { singleTx, removedIds };
}
