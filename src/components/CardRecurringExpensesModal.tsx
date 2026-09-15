import React, { useState } from 'react';
import { CreditCard, Category, RecurringExpense } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { CategoryIcon } from './CategoryIcon';
import {
  CalendarClock,
  X,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CreditCard as CardIcon,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CardRecurringExpensesModalProps {
  card: CreditCard;
  categories: Category[];
  recurringExpenses: RecurringExpense[];
  onClose: () => void;
  onAddRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'createdAt'>) => void;
  onDeleteRecurringExpense: (id: string) => void;
}

export const CardRecurringExpensesModal: React.FC<CardRecurringExpensesModalProps> = ({
  card,
  categories,
  recurringExpenses,
  onClose,
  onAddRecurringExpense,
  onDeleteRecurringExpense,
}) => {
  const { t: i18n, formatCurrency } = useI18n();
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || 'cat-fatura');
  const [dayOfMonth, setDayOfMonth] = useState<number>(new Date().getDate());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter for this card
  const cardExpenses = recurringExpenses.filter((e) => e.cardId === card.id);
  const totalMonthly = cardExpenses.reduce((sum, e) => sum + (e.isActive ? Number(e.amount) : 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amountStr);
    if (!title.trim() || !amountNum || amountNum <= 0) return;

    onAddRecurringExpense({
      cardId: card.id,
      title: title.trim(),
      amount: amountNum,
      categoryId,
      dayOfMonth: Math.min(31, Math.max(1, Number(dayOfMonth) || 1)),
      startDate: new Date().toISOString(),
      isActive: true,
    });

    // Reset form
    setTitle('');
    setAmountStr('');
    setShowAddForm(false);
  };

  const getCategory = (catId: string): Category => {
    return (
      categories.find((c) => c.id === catId) || {
        id: 'cat-diger',
        name: 'Diğer',
        icon: 'Sparkles',
        color: '#64748b',
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-md p-5 shadow-2xl text-gray-900 dark:text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-750/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-slate-100 leading-tight">
                {card.name} • {i18n.recurringExpenses}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 font-mono">
                {card.cardNetwork.toUpperCase()} •••• {card.last4}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Monthly Summary Banner */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-slate-800/60 border border-indigo-100/80 dark:border-indigo-900/40 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              {i18n.monthlyTotalRecurring}
            </span>
            <span className="text-xl font-black text-indigo-900 dark:text-indigo-200">
              {formatCurrency(totalMonthly)}
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400"> / ay</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
          >
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{showAddForm ? i18n.close : i18n.addRecurringExpense}</span>
          </button>
        </div>

        {/* Add Recurring Expense Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleSubmit}
              className="bg-gray-50 dark:bg-slate-800/90 border border-gray-200/80 dark:border-slate-750 rounded-2xl p-4 space-y-3 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-1 border-b border-gray-200/60 dark:border-slate-700">
                <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                  {i18n.addRecurringExpense}
                </span>
                <span className="text-[10px] text-gray-400">Her ay otomatik işlenir</span>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400">
                  {i18n.recurringExpenseTitle}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Netflix, Aidat, Spor Salonu"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Amount & Day of Month */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400">
                    {i18n.amount} (₺)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="w-full bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-black text-gray-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400">
                    {i18n.recurringDayOfMonth}
                  </label>
                  <select
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        Her ayın {day}. günü
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400">
                  {i18n.category}
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.99] cursor-pointer"
                >
                  {i18n.save}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Existing Recurring Expenses List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
              {i18n.recurringExpenses} ({cardExpenses.length})
            </span>
          </div>

          {cardExpenses.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-200 dark:border-slate-750 space-y-2">
              <CalendarClock className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                {i18n.noRecurringExpenses}
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                + {i18n.addRecurringExpense}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {cardExpenses.map((item) => {
                const cat = getCategory(item.categoryId);
                const isConfirming = deletingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-750/80 rounded-2xl flex items-center justify-between shadow-2xs hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon iconName={cat.icon} className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs text-gray-900 dark:text-slate-100 leading-tight">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-slate-400">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            Her ayın {item.dayOfMonth}. günü
                          </span>
                          <span>•</span>
                          <span>{cat.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-xs text-gray-900 dark:text-slate-100">
                        {formatCurrency(item.amount)}
                      </span>

                      {isConfirming ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteRecurringExpense(item.id);
                              setDeletingId(null);
                            }}
                            className="p-1 px-1.5 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
                          >
                            Sil
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="p-1 px-1.5 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-[10px] font-bold rounded-lg cursor-pointer"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(item.id)}
                          title="Kaldır"
                          className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
