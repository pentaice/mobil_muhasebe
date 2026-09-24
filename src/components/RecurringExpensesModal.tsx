import React, { useState, useMemo } from 'react';
import { RecurringExpense, Category, CreditCard, PaymentSourceType } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { useBackHandler } from '../utils/backButton';
import { CategoryIcon } from './CategoryIcon';
import {
  CalendarClock,
  X,
  Plus,
  Trash2,
  Pencil,
  Sparkles,
  Check,
  AlertTriangle,
  CreditCard as CardIcon,
  Wallet,
  Clock,
  Calendar,
  ChevronRight,
  Zap,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecurringExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringExpenses: RecurringExpense[];
  categories: Category[];
  cards: CreditCard[];
  onAddRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'createdAt'>) => void;
  onUpdateRecurringExpense: (expense: RecurringExpense) => void;
  onDeleteRecurringExpense: (id: string) => void;
}

// Quick templates definition
const QUICK_PRESETS_BASE = [
  { titleKey: 'Netflix', categoryKeyword: 'fatura', isRaw: true },
  { titleKey: 'Spotify', categoryKeyword: 'fatura', isRaw: true },
  { titleKey: 'YouTube Premium', categoryKeyword: 'fatura', isRaw: true },
  { titleKey: 'templateRent', categoryKeyword: 'kira' },
  { titleKey: 'templateInternet', categoryKeyword: 'fatura' },
  { titleKey: 'templateDues', categoryKeyword: 'kira' },
  { titleKey: 'templateElectricity', categoryKeyword: 'fatura' },
  { titleKey: 'templateGas', categoryKeyword: 'fatura' },
  { titleKey: 'templateGym', categoryKeyword: 'saglik' },
];

export const RecurringExpensesModal: React.FC<RecurringExpensesModalProps> = ({
  isOpen,
  onClose,
  recurringExpenses,
  categories,
  cards,
  onAddRecurringExpense,
  onUpdateRecurringExpense,
  onDeleteRecurringExpense,
}) => {
  const { t: i18n, formatCurrency, currency } = useI18n();

  const quickPresets = useMemo(() => QUICK_PRESETS_BASE.map(p => ({
    title: p.isRaw ? p.titleKey : ((i18n as any)[p.titleKey] || p.titleKey),
    categoryKeyword: p.categoryKeyword
  })), [i18n]);

  // Filter tab: 'all' | 'active' | 'paused'
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'paused'>('all');

  // Add / Edit Form State: null | 'new' | RecurringExpense
  const [formMode, setFormMode] = useState<'new' | RecurringExpense | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState<string>('');
  const [formAmountStr, setFormAmountStr] = useState<string>('');
  const [formCategoryId, setFormCategoryId] = useState<string>(categories[0]?.id || 'cat-fatura');
  const [formSourceType, setFormSourceType] = useState<PaymentSourceType>(cards.length > 0 ? 'credit_card' : 'cash_bank');
  const [formCardId, setFormCardId] = useState<string>(cards[0]?.id || '');
  const [formDayOfMonth, setFormDayOfMonth] = useState<number>(15);

  // Delete Confirmation State
  const [itemToDelete, setItemToDelete] = useState<RecurringExpense | null>(null);

  useBackHandler(() => {
    if (itemToDelete) {
      setItemToDelete(null);
      return;
    }
    if (formMode) {
      setFormMode(null);
      return;
    }
    onClose();
  }, isOpen, 20);

  if (!isOpen) return null;

  // Calculation of totals
  const totalMonthlyCommitment = recurringExpenses.reduce(
    (sum, item) => sum + (item.isActive ? Number(item.amount) : 0),
    0
  );
  const activeCount = recurringExpenses.filter((e) => e.isActive).length;
  const pausedCount = recurringExpenses.filter((e) => !e.isActive).length;

  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Find next upcoming active expense
  const upcomingExpenses = recurringExpenses
    .filter((e) => e.isActive)
    .map((e) => {
      const targetDay = Math.min(e.dayOfMonth, daysInCurrentMonth);
      let daysRemaining = targetDay - currentDay;
      if (e.lastProcessedMonth === currentMonthKey) {
        // Already processed this month, next is next month
        daysRemaining += daysInCurrentMonth;
      } else if (daysRemaining < 0) {
        // Passed this month but not processed yet or next month
        daysRemaining += daysInCurrentMonth;
      }
      return { ...e, daysRemaining, targetDay };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const nextUpcoming = upcomingExpenses.length > 0 ? upcomingExpenses[0] : null;

  // Filtered list
  const displayedExpenses = recurringExpenses.filter((item) => {
    if (filterTab === 'active') return item.isActive;
    if (filterTab === 'paused') return !item.isActive;
    return true;
  });

  const getCategory = (catId: string): Category => {
    return (
      categories.find((c) => c.id === catId) || {
        id: 'cat-diger',
        name: i18n.categoryOther || 'Other',
        icon: 'Sparkles',
        color: '#64748b',
      }
    );
  };

  const getCard = (cardId?: string): CreditCard | undefined => {
    if (!cardId) return undefined;
    return cards.find((c) => c.id === cardId);
  };

  // Open Form for New Expense
  const handleOpenNewForm = () => {
    setFormTitle('');
    setFormAmountStr('');
    setFormCategoryId(categories[0]?.id || 'cat-fatura');
    setFormSourceType(cards.length > 0 ? 'credit_card' : 'cash_bank');
    setFormCardId(cards[0]?.id || '');
    setFormDayOfMonth(Math.min(28, Math.max(1, currentDay)));
    setFormMode('new');
  };

  // Open Form for Editing
  const handleOpenEditForm = (item: RecurringExpense) => {
    setFormTitle(item.title);
    setFormAmountStr(String(item.amount));
    setFormCategoryId(item.categoryId || categories[0]?.id || 'cat-fatura');
    setFormSourceType(item.sourceType || (item.cardId ? 'credit_card' : 'cash_bank'));
    setFormCardId(item.cardId || cards[0]?.id || '');
    setFormDayOfMonth(item.dayOfMonth || 15);
    setFormMode(item);
  };

  // Apply Quick Preset
  const handleApplyPreset = (preset: { title: string; categoryKeyword: string }) => {
    setFormTitle(preset.title);
    const matchedCategory = categories.find((c) =>
      c.name.toLowerCase().includes(preset.categoryKeyword) ||
      c.id.toLowerCase().includes(preset.categoryKeyword)
    );
    if (matchedCategory) {
      setFormCategoryId(matchedCategory.id);
    }
  };

  // Submit Form (Add or Update)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmountStr);
    if (!formTitle.trim() || !amountNum || amountNum <= 0) return;

    const validatedDay = Math.min(31, Math.max(1, Number(formDayOfMonth) || 1));

    if (formMode === 'new') {
      onAddRecurringExpense({
        title: formTitle.trim(),
        amount: amountNum,
        categoryId: formCategoryId,
        sourceType: formSourceType,
        cardId: formSourceType === 'credit_card' ? formCardId : undefined,
        dayOfMonth: validatedDay,
        startDate: new Date().toISOString(),
        isActive: true,
      });
    } else if (typeof formMode === 'object' && formMode !== null) {
      // Update existing
      onUpdateRecurringExpense({
        ...formMode,
        title: formTitle.trim(),
        amount: amountNum,
        categoryId: formCategoryId,
        sourceType: formSourceType,
        cardId: formSourceType === 'credit_card' ? formCardId : undefined,
        dayOfMonth: validatedDay,
      });
    }

    setFormMode(null);
  };

  // Toggle Active / Paused
  const handleToggleActive = (item: RecurringExpense) => {
    onUpdateRecurringExpense({
      ...item,
      isActive: !item.isActive,
    });
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDeleteRecurringExpense(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/60 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] text-gray-900 dark:text-slate-100 overflow-hidden">
        
        {/* TOP BAR */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-2xs">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-gray-900 dark:text-slate-100 leading-tight">
                {i18n.recurringExpenses}
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                {i18n.recurringSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenNewForm}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{i18n.addNew}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* SMART SUMMARY CARD */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-3xl p-4.5 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-semibold text-indigo-100 uppercase tracking-wider block">
                  {i18n.monthlyRecurringLoad}
                </span>
                <p className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5">
                  {formatCurrency(totalMonthlyCommitment)}
                  <span className="text-xs font-normal text-indigo-200 ml-1">/ {i18n.monthly.toLowerCase()}</span>
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold">
                  {activeCount} {i18n.activeExpensesCount}
                </span>
                {pausedCount > 0 && (
                  <span className="text-[10px] text-indigo-200 font-medium">
                    {pausedCount} {i18n.pausedCountLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Smart Next Payment Chip */}
            {nextUpcoming && (
              <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-indigo-50">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-200" />
                  <span>{i18n.nextUpcomingLabel}: <strong>{nextUpcoming.title}</strong></span>
                </div>
                <span className="bg-white/25 px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wide">
                  {nextUpcoming.daysRemaining === 0
                    ? i18n.today
                    : nextUpcoming.daysRemaining === 1
                    ? i18n.tomorrow
                    : `${nextUpcoming.daysRemaining} ${i18n.daysLater} (${i18n.everyMonthDay.replace('{day}', String(nextUpcoming.targetDay))})`}
                </span>
              </div>
            )}
          </div>

          {/* FILTER TABS */}
          {recurringExpenses.length > 0 && (
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800/80 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-2xs'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
              >
                {i18n.allTab} ({recurringExpenses.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('active')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'active'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                {i18n.activeTab} ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('paused')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTab === 'paused'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-2xs'
                    : 'text-gray-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
                }`}
              >
                {i18n.pausedTab} ({pausedCount})
              </button>
            </div>
          )}

          {/* LIST OF EXPENSES */}
          {displayedExpenses.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-3 bg-gray-50/70 dark:bg-slate-800/40 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
              <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-2xs">
                <CalendarClock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-gray-800 dark:text-slate-200">
                  {filterTab === 'all' ? i18n.noRecurringTitle : i18n.noRecurringFiltered}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {i18n.noRecurringDesc}
                </p>
              </div>
              {filterTab === 'all' && (
                <button
                  type="button"
                  onClick={handleOpenNewForm}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{i18n.addFirstRecurring}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedExpenses.map((item) => {
                const cat = getCategory(item.categoryId);
                const card = item.sourceType === 'credit_card' ? getCard(item.cardId) : undefined;
                const isProcessedThisMonth = item.lastProcessedMonth === currentMonthKey;
                const isDueToday = item.dayOfMonth === currentDay;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      item.isActive
                        ? 'bg-white dark:bg-slate-850 border-gray-200/80 dark:border-slate-750 shadow-2xs'
                        : 'bg-gray-50 dark:bg-slate-900 border-gray-200/60 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Icon & Details */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs mt-0.5"
                          style={{ backgroundColor: cat.color }}
                        >
                          <CategoryIcon name={cat.icon} size={18} />
                        </div>

                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-slate-100 truncate">
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 rounded-md">
                              {cat.name}
                            </span>
                          </div>

                          {/* Payment Source & Cycle Day Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                            {item.sourceType === 'credit_card' && card ? (
                              <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-md">
                                <CardIcon className="w-3 h-3" />
                                <span>{card.name} (•••• {card.last4})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">
                                <Wallet className="w-3 h-3" />
                                <span>{i18n.cashBank}</span>
                              </span>
                            )}

                            <span className="text-gray-500 dark:text-slate-400 font-medium">
                              • {i18n.everyMonthDay.replace('{day}', String(item.dayOfMonth))}
                            </span>
                          </div>

                          {/* Smart Status Pill */}
                          <div className="pt-0.5">
                            {!item.isActive ? (
                              <span className="inline-flex items-center text-[10px] font-semibold text-gray-500 dark:text-slate-400 bg-gray-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                ⏸️ {i18n.statusPaused}
                              </span>
                            ) : isProcessedThisMonth ? (
                              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                                ✓ {i18n.statusProcessed}
                              </span>
                            ) : isDueToday ? (
                              <span className="inline-flex items-center text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded-full animate-pulse">
                                ⚡ {i18n.statusToday}
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">
                                ⏱️ {item.dayOfMonth > currentDay ? `${item.dayOfMonth - currentDay} ${i18n.daysLater}` : i18n.nextMonth}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                        <span className="text-base font-black text-gray-900 dark:text-slate-100">
                          {formatCurrency(item.amount)}
                        </span>

                        <div className="flex items-center gap-1 mt-2">
                          {/* Active Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(item)}
                            title={item.isActive ? i18n.pause : i18n.resume}
                            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                              item.isActive
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-400 border-gray-200 dark:border-slate-700'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(item)}
                            title={i18n.edit}
                            className="p-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button (triggers confirm modal) */}
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            title={i18n.delete}
                            className="p-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER CLOSE */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-gray-200/80 hover:bg-gray-300/80 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-800 dark:text-slate-200 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
          >
            {i18n.close}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ADD / EDIT MODAL (SUB-DIALOG)                                 */}
      {/* ============================================================== */}
      <AnimatePresence>
        {formMode !== null && (
          <div className="fixed inset-0 z-60 bg-gray-950/70 dark:bg-black/85 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-gray-900 dark:text-slate-100"
            >
              {/* Form Header */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    {formMode === 'new' ? <Plus className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-slate-100">
                      {formMode === 'new' ? i18n.addRecurringExpense : i18n.editRecurringExpense}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">
                      {i18n.recurringExpenseDetails}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormMode(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* QUICK PRESETS (Only shown when creating new) */}
              {formMode === 'new' && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                    {i18n.quickTemplates}
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scrollbar-none">
                    {quickPresets.map((preset) => (
                      <button
                        key={preset.title}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-slate-300 text-[11px] font-semibold px-2.5 py-1 rounded-xl border border-gray-200/80 dark:border-slate-700 whitespace-nowrap transition-all cursor-pointer shrink-0"
                      >
                        {preset.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* FORM FIELDS */}
              <form onSubmit={handleSaveForm} className="space-y-3.5">
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider block">
                    {i18n.recurringExpenseTitle}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={i18n.recurringTitlePlaceholder}
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 transition-colors"
                  />
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider block">
                    {i18n.monthlyTotalRecurring} ({currency.symbol})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      required
                      inputMode="decimal"
                      placeholder="0.00"
                      value={formAmountStr}
                      onChange={(e) => setFormAmountStr(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-xl py-2 px-3 pr-10 text-xl font-black text-gray-900 dark:text-slate-100 tracking-tight focus:outline-none transition-colors"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-base text-blue-600 dark:text-blue-400">
                      {currency.symbol}
                    </span>
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider block">
                    {i18n.category}
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-1 border border-gray-200/60 dark:border-slate-800 rounded-2xl bg-gray-50/50 dark:bg-slate-800/40">
                    {categories.map((cat) => {
                      const isSelected = cat.id === formCategoryId;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFormCategoryId(cat.id)}
                          className={`flex flex-col items-center justify-center p-1.5 min-h-[54px] rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 dark:border-blue-500 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border-gray-200/70 dark:border-slate-750 text-gray-700 dark:text-slate-300 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center text-white mb-1 shadow-2xs"
                            style={{ backgroundColor: cat.color }}
                          >
                            <CategoryIcon name={cat.icon} size={11} />
                          </div>
                          <span
                            className={`text-[9px] font-semibold leading-tight line-clamp-1 ${
                              isSelected ? 'text-blue-900 dark:text-blue-200 font-bold' : ''
                            }`}
                          >
                            {cat.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Source: Credit Card vs Cash/Bank */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider block">
                    {i18n.payUsing}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormSourceType('credit_card')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        formSourceType === 'credit_card'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                          : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'
                      }`}
                    >
                      <CardIcon className="w-3.5 h-3.5" />
                      <span>{i18n.creditCard}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormSourceType('cash_bank')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        formSourceType === 'cash_bank'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                          : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Nakit / Banka</span>
                    </button>
                  </div>

                  {/* Card Dropdown if Credit Card selected */}
                  {formSourceType === 'credit_card' && (
                    <div className="pt-1">
                      {cards.length > 0 ? (
                        <select
                          value={formCardId}
                          onChange={(e) => setFormCardId(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600"
                        >
                          {cards.map((c) => (
                            <option key={c.id} value={c.id}>
                              💳 {c.name} (•••• {c.last4})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-900/40">
                          {i18n.noCardsForRecurringWarning}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Day of Month Slider / Selector */}
                <div className="space-y-1.5 bg-gray-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-gray-200/70 dark:border-slate-750">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      {i18n.whichDayOfMonth}
                    </label>
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-lg">
                      {i18n.everyMonthDay.replace('{day}', String(formDayOfMonth))}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="31"
                    value={formDayOfMonth}
                    onChange={(e) => setFormDayOfMonth(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />

                  {/* Common Day Quick Buttons */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    {[1, 5, 10, 15, 20, 25, 31].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setFormDayOfMonth(day)}
                        className={`text-[10px] font-bold py-1 px-2 rounded-lg border transition-all cursor-pointer ${
                          formDayOfMonth === day
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700'
                        }`}
                      >
                        {day === 31 ? i18n.lastDay : `${day}`}
                      </button>
                    ))}
                  </div>

                  <p className="text-[10.5px] text-gray-500 dark:text-slate-400 pt-1 flex items-center gap-1">
                    <Info className="w-3 h-3 text-blue-500 shrink-0" />
                    <span>{i18n.recurringNotice}</span>
                  </p>
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFormMode(null)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    {i18n.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{formMode === 'new' ? i18n.saveExpense : i18n.saveChanges}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* DELETE CONFIRMATION MODAL ("EMİN MİSİNİZ?")                    */}
      {/* ============================================================== */}
      <AnimatePresence>
        {itemToDelete !== null && (
          <div className="fixed inset-0 z-70 bg-gray-950/75 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-sm p-5 shadow-2xl text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-2xs">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-extrabold text-base text-gray-900 dark:text-slate-100">
                  {i18n.deleteRecurringConfirmTitle}
                </h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                  <strong>"{itemToDelete.title}"</strong> ({formatCurrency(itemToDelete.amount)}) {i18n.deleteRecurringConfirmText}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500">
                  {i18n.recurringDeleteWarning}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  {i18n.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-rose-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{i18n.yesDelete}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
