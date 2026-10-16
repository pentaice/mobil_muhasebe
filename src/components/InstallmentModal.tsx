import React, { useState, useMemo } from 'react';
import { Transaction, Category, CreditCard } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { useBackHandler } from '../utils/backButton';
import {
  calculateInstallmentImpact,
  splitTransactionIntoInstallments,
  mergeInstallmentsBackToSingle,
  SplitInstallmentOptions,
} from '../utils/installments';
import {
  CalendarClock,
  Layers,
  ArrowRight,
  TrendingDown,
  Calendar,
  CreditCard as CardIcon,
  Wallet,
  AlertCircle,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CategoryIcon } from './CategoryIcon';

interface InstallmentModalProps {
  transaction: Transaction | null;
  allTransactions: Transaction[];
  categories: Category[];
  cards: CreditCard[];
  isOpen: boolean;
  onClose: () => void;
  onApplyInstallments: (originalTxId: string, newTransactions: Transaction[]) => void;
  onRevertInstallmentPlan: (groupId: string, singleTx: Transaction, removedIds: string[]) => void;
}

const PRESET_INSTALLMENTS = [2, 3, 4, 6, 9, 12];

export const InstallmentModal: React.FC<InstallmentModalProps> = ({
  transaction,
  allTransactions,
  categories,
  cards,
  isOpen,
  onClose,
  onApplyInstallments,
  onRevertInstallmentPlan,
}) => {
  const { t: i18n, formatCurrency, currency } = useI18n();

  useBackHandler(() => {
    if (isOpen) {
      onClose();
      return;
    }
  }, isOpen, 20);

  // Is this transaction already part of an existing installment plan?
  const isExistingPlan = Boolean(transaction?.installmentGroupId);

  // Find all transactions in this group if already an installment
  const groupTransactions = useMemo(() => {
    if (!transaction || !transaction.installmentGroupId) return [];
    return allTransactions
      .filter((t) => t.installmentGroupId === transaction.installmentGroupId)
      .sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0));
  }, [transaction, allTransactions]);

  // Form states for creating a new installment plan
  const [installmentCount, setInstallmentCount] = useState<number>(3);
  const [startNextMonth, setStartNextMonth] = useState<boolean>(false);
  const [hasInterest, setHasInterest] = useState<boolean>(false);
  const [totalWithInterestStr, setTotalWithInterestStr] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'configure' | 'schedule'>('configure');
  const [showRevertConfirm, setShowRevertConfirm] = useState<boolean>(false);

  // Original transaction metadata
  const originalAmount = transaction
    ? (transaction.originalTransactionAmount || transaction.amount)
    : 0;

  const card = cards.find((c) => c.id === transaction?.creditCardId);
  const category = categories.find((c) => c.id === transaction?.categoryId);

  // Computed impact analysis
  const impactAnalysis = useMemo(() => {
    if (!transaction) return null;
    const parsedWithInterest = hasInterest ? parseFloat(totalWithInterestStr) : undefined;
    const options: SplitInstallmentOptions = {
      installmentCount,
      startNextMonth,
      totalWithInterest: parsedWithInterest && parsedWithInterest > 0 ? parsedWithInterest : undefined,
    };
    return calculateInstallmentImpact(originalAmount, transaction.date, options);
  }, [transaction, originalAmount, installmentCount, startNextMonth, hasInterest, totalWithInterestStr]);

  if (!isOpen || !transaction) return null;

  const handleApply = () => {
    if (!transaction) return;
    const parsedWithInterest = hasInterest ? parseFloat(totalWithInterestStr) : undefined;
    const options: SplitInstallmentOptions = {
      installmentCount,
      startNextMonth,
      totalWithInterest: parsedWithInterest && parsedWithInterest > 0 ? parsedWithInterest : undefined,
    };
    const newTxs = splitTransactionIntoInstallments(transaction, options);
    onApplyInstallments(transaction.id, newTxs);
    onClose();
  };

  const handleRevert = () => {
    if (!transaction || !transaction.installmentGroupId) return;
    const result = mergeInstallmentsBackToSingle(allTransactions, transaction.installmentGroupId);
    if (result) {
      onRevertInstallmentPlan(transaction.installmentGroupId, result.singleTx, result.removedIds);
    }
    setShowRevertConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 80 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-lg shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-2xs border border-indigo-100 dark:border-indigo-900/60">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                {isExistingPlan ? 'Taksit Planı Detayları' : 'Harcamayı Taksitlendir'}
                {isExistingPlan && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {transaction.installmentNumber}/{transaction.installmentTotal} Taksit
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                {isExistingPlan
                  ? 'Bu harcama taksit planına bağlanmış durumda'
                  : 'Aylık bütçe açığını ve kart yükünü düzenleyin'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Original Transaction Summary Card */}
        <div className="bg-gray-50 dark:bg-slate-850 border border-gray-200/80 dark:border-slate-750 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{ backgroundColor: category?.color || '#64748b' }}
            >
              <CategoryIcon name={category?.icon || 'Coins'} size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
                  {category?.name || 'Harcama'}
                </span>
                {card ? (
                  <span className="text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-semibold border border-blue-200/50 dark:border-blue-800/50">
                    💳 {card.name}
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-semibold border border-emerald-200/50 dark:border-emerald-800/50">
                    💵 {i18n.cashBank}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate max-w-[200px]">
                {transaction.note || 'Açıklama yok'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold text-gray-900 dark:text-slate-100">
              {formatCurrency(originalAmount)}
            </p>
            <span className="text-[10px] text-gray-400 dark:text-slate-500">
              {isExistingPlan ? 'Toplam Tutar' : 'Tek Çekim'}
            </span>
          </div>
        </div>

        {/* MODE A: EXISTING INSTALLMENT PLAN MANAGEMENT */}
        {isExistingPlan ? (
          <div className="space-y-4">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-3">
                <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                  Aylık Taksit
                </span>
                <p className="text-base font-extrabold text-indigo-950 dark:text-indigo-200 mt-0.5">
                  {formatCurrency(transaction.amount)}
                </p>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {transaction.installmentTotal} ay boyunca
                </span>
              </div>

              <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-3">
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                  Kalan Taksitler
                </span>
                <p className="text-base font-extrabold text-amber-950 dark:text-amber-200 mt-0.5">
                  {(transaction.installmentTotal || 0) - (transaction.installmentNumber || 0)} ay
                </p>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  Mevcut: {transaction.installmentNumber}. taksit
                </span>
              </div>
            </div>

            {/* List of installments in this plan */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Taksit Çizelgesi ({groupTransactions.length} Taksit)</span>
                <span className="text-[10px] text-gray-400 lowercase font-normal">tüm aylar</span>
              </label>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {groupTransactions.map((tx) => {
                  const isCurrentSelected = tx.id === transaction.id;
                  const txDate = new Date(tx.date);
                  const isPast = txDate.getTime() < Date.now();

                  return (
                    <div
                      key={tx.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs ${
                        isCurrentSelected
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 font-bold'
                          : 'border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-850 text-gray-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                          {tx.installmentNumber}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-slate-100">
                            {new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(txDate)}
                          </p>
                          <span className="text-[10px] text-gray-400 dark:text-slate-500">
                            {new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(txDate)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-extrabold text-gray-900 dark:text-slate-100">
                          {formatCurrency(tx.amount)}
                        </p>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">
                          {isCurrentSelected ? 'Seçili Taksit' : isPast ? 'Geçmiş' : 'Gelecek'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Revert confirmation or Revert button */}
            {showRevertConfirm ? (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-950 dark:text-rose-200">
                      Taksit Planını İptal Etmek İstiyor Musunuz?
                    </h4>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                      Bu plana bağlı {groupTransactions.length} taksit silinecek ve toplam {formatCurrency(originalAmount)} tutarında tek bir harcamaya dönüştürülecektir.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRevertConfirm(false)}
                    className="flex-1 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100/50 dark:hover:bg-rose-900/40 cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleRevert}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer"
                  >
                    Evet, Tek Çekime Döndür
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowRevertConfirm(true)}
                className="w-full py-2.5 px-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Taksit Planını Kaldır (Tek Çekime Dönüştür)</span>
              </button>
            )}
          </div>
        ) : (
          /* MODE B: CONVERT SINGLE EXPENSE TO INSTALLMENTS */
          <div className="space-y-4">
            {/* Live Financial Impact Cards (Aylık Açık ve Aylık Borç Göstergeleri) */}
            {impactAnalysis && (
              <div className="grid grid-cols-2 gap-2.5">
                {/* Bu Ayki Açığa Etki */}
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 rounded-2xl p-3">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Bu Ay Bütçe Rahatlaması</span>
                  </div>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    +{formatCurrency(impactAnalysis.currentMonthRelief)}
                  </p>
                  <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium leading-tight block mt-0.5">
                    Bu ayki harcamanız azalır, aylık açık hafifler.
                  </span>
                </div>

                {/* Aylık Borç Yükü */}
                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 rounded-2xl p-3">
                  <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span>Aylık Taksit Yükü</span>
                  </div>
                  <p className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {formatCurrency(impactAnalysis.monthlyBaseAmount)} <span className="text-xs font-normal">/ay</span>
                  </p>
                  <span className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 font-medium leading-tight block mt-0.5">
                    {installmentCount} ay boyunca sabit aylık borç.
                  </span>
                </div>
              </div>
            )}

            {/* Installment Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Taksit Sayısı</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold lowercase">
                  {installmentCount} ay taksit
                </span>
              </label>

              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_INSTALLMENTS.map((count) => {
                  const isSelected = installmentCount === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setInstallmentCount(count)}
                      className={`py-2 px-1 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-102 ring-2 ring-indigo-400/30'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>

              {/* Custom number slider / input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="range"
                  min="2"
                  max="24"
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(Number(e.target.value))}
                  className="flex-1 accent-indigo-600 cursor-pointer"
                />
                <span className="text-xs font-extrabold text-gray-700 dark:text-slate-300 w-12 text-right">
                  {installmentCount} Ay
                </span>
              </div>
            </div>

            {/* Timing Option: Start This Month vs Next Month */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                İlk Taksit Başlangıcı
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStartNextMonth(false)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    !startNextMonth
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 font-bold'
                      : 'border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs text-gray-900 dark:text-slate-100 font-bold">
                    <span>⚡ Bu Aydan Başlasın</span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 leading-tight">
                    İlk taksit hemen cari aya yansıtılır.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStartNextMonth(true)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    startNextMonth
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 font-bold'
                      : 'border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs text-gray-900 dark:text-slate-100 font-bold">
                    <span>⏳ +1 Ay Ertelemeli</span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 leading-tight">
                    İlk taksit sonraki aydan başlar.
                  </p>
                </button>
              </div>
            </div>

            {/* Interest / Vade Farkı (Optional) */}
            <div className="p-3 bg-gray-50 dark:bg-slate-850 border border-gray-200/80 dark:border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-slate-100 block">
                    Vade Farkı / Ek Maliyet Var mı?
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400">
                    Banka sonradan taksitlendirmede faiz eklediyse
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHasInterest(!hasInterest)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    hasInterest ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                      hasInterest ? 'translate-x-5.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {hasInterest && (
                <div className="pt-2 border-t border-gray-200/60 dark:border-slate-800 space-y-1">
                  <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase">
                    Toplam Vade Farklı Tutar ({currency.symbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalWithInterestStr}
                    onChange={(e) => setTotalWithInterestStr(e.target.value)}
                    placeholder={originalAmount.toString()}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-gray-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Schedule Accordion / Preview */}
            {impactAnalysis && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 dark:text-slate-300">
                  <span>Ödeme Planı ({impactAnalysis.installmentCount} Ay)</span>
                  <span className="text-gray-400 font-normal">
                    Toplam: {formatCurrency(impactAnalysis.totalAmount)}
                  </span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-gray-100 dark:border-slate-800 rounded-2xl p-2 bg-gray-50/50 dark:bg-slate-850/50">
                  {impactAnalysis.schedule.map((item) => (
                    <div
                      key={item.installmentNumber}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-white dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-[9px] flex items-center justify-center">
                          {item.installmentNumber}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-slate-200">
                          {item.monthName}
                        </span>
                        {item.isCurrentMonth && (
                          <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1 py-0.2 rounded font-bold">
                            Bu Ay
                          </span>
                        )}
                      </div>
                      <span className="font-extrabold text-gray-900 dark:text-slate-100">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Sparkles className="w-4 h-4" />
                <span>Planı Uygula & Taksitlendir</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
