import React, { useState, useMemo } from 'react';
import { Category, CreditCard, Transaction } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatShortDate } from '../utils/storage';
import { useI18n } from '../i18n/I18nContext';
import { Search, Trash2, ArrowDownLeft, Calendar, FileText, Pencil, X, Check, CreditCard as CardIcon, Wallet, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionsViewProps {
  categories: Category[];
  cards: CreditCard[];
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction: (updatedTx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  categories,
  cards,
  transactions,
  onDeleteTransaction,
  onUpdateTransaction,
}) => {
  const { t: i18n, formatCurrency, currency } = useI18n();
  const [search, setSearch] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Edit form state
  const [editAmount, setEditAmount] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [editSourceType, setEditSourceType] = useState<'credit_card' | 'cash_bank'>('credit_card');
  const [editCardId, setEditCardId] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setEditAmount(tx.amount.toString());
    setEditNote(tx.note || '');
    setEditCategoryId(tx.categoryId);
    setEditSourceType(tx.sourceType);
    setEditCardId(tx.creditCardId || '');
    const d = new Date(tx.date);
    // Format for date input (YYYY-MM-DD)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setEditDate(`${year}-${month}-${day}`);
    // Format for time input (HH:MM)
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    setEditTime(`${hours}:${minutes}`);
  };

  const handleSaveEdit = () => {
    if (!editingTx) return;
    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    // Combine date and time
    const [year, month, day] = editDate.split('-').map(Number);
    const [hours, minutes] = editTime.split(':').map(Number);
    const newDate = new Date(year, month - 1, day, hours, minutes);

    const updatedTx: Transaction = {
      ...editingTx,
      amount: parsedAmount,
      note: editNote || undefined,
      categoryId: editCategoryId,
      sourceType: editSourceType,
      creditCardId: editSourceType === 'credit_card' ? editCardId : undefined,
      date: newDate.toISOString(),
    };

    onUpdateTransaction(updatedTx);
    setEditingTx(null);
  };

  const handleConfirmDelete = (id: string) => {
    onDeleteTransaction(id);
    setDeleteConfirmId(null);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Type filter
      if (selectedTypeFilter !== 'all' && t.type !== selectedTypeFilter) {
        return false;
      }

      // Category filter
      if (selectedCategoryFilter !== 'all' && t.categoryId !== selectedCategoryFilter) {
        return false;
      }

      // Search term
      if (search.trim()) {
        const query = search.toLowerCase();
        const cat = categories.find((c) => c.id === t.categoryId);
        const card = cards.find((c) => c.id === t.creditCardId);
        const matchNote = t.note?.toLowerCase().includes(query);
        const matchCat = cat?.name.toLowerCase().includes(query);
        const matchCard = card?.name.toLowerCase().includes(query);
        const matchAmount = t.amount.toString().includes(query);

        if (!matchNote && !matchCat && !matchCard && !matchAmount) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, search, selectedCategoryFilter, selectedTypeFilter, categories, cards]);

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 pb-8">
      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-4 space-y-3 shadow-sm transition-colors">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={i18n.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-gray-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 gap-2">
          {/* Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl py-2 px-3 text-xs text-gray-700 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-600"
          >
            <option value="all">{i18n.allTransactionTypes}</option>
            <option value="expense">{i18n.onlyExpenses}</option>
            <option value="card_payment">{i18n.onlyCardPayments}</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl py-2 px-3 text-xs text-gray-700 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-600"
          >
            <option value="all">{i18n.allCategories}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-8 text-center space-y-2 shadow-xs transition-colors">
            <FileText className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto" />
            <p className="text-gray-800 dark:text-slate-200 font-medium text-sm">{i18n.noTransactionFound}</p>
            <p className="text-gray-400 dark:text-slate-500 text-xs">{i18n.tryChangingSearch}</p>
          </div>
        ) : (
          filteredTransactions.map((t) => {
            const isExpense = t.type === 'expense';
            const cat = categories.find((c) => c.id === t.categoryId);
            const card = cards.find((c) => c.id === t.creditCardId);

            return (
              <div
                key={t.id}
                className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 hover:border-gray-200 dark:hover:border-slate-700 rounded-2xl p-3.5 flex items-center justify-between shadow-xs transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Category / Payment Icon */}
                  {isExpense ? (
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cat?.color || '#9ca3af' }}
                    >
                      <CategoryIcon name={cat?.icon || 'Coins'} size={20} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold border border-emerald-100 dark:border-emerald-900/60">
                      <ArrowDownLeft className="w-5 h-5" />
                    </div>
                  )}

                  <div className="space-y-0.5 min-w-0">
                    <p className="font-bold text-xs text-gray-900 dark:text-slate-100 line-clamp-1">
                      {isExpense ? cat?.name || i18n.expense : i18n.cardPayment}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-1">
                      {t.note || (isExpense ? (card ? card.name : i18n.cashBank) : card?.name || i18n.creditCard)}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-slate-500 whitespace-nowrap overflow-hidden">
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                        {formatShortDate(t.date)}
                      </span>
                      {card && (
                        <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-semibold border border-blue-100 dark:border-blue-800 truncate shrink">
                          💳 {card.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center gap-2 text-right shrink-0">
                  <div>
                    <p
                      className={`font-extrabold text-sm ${
                        isExpense ? 'text-gray-900 dark:text-slate-100' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isExpense ? '-' : '+'}{formatCurrency(t.amount)}
                    </p>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 block font-medium">
                      {isExpense ? i18n.expense : i18n.payment}
                    </span>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => openEditModal(t)}
                    title={i18n.editTransaction}
                    className="text-gray-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => setDeleteConfirmId(t.id)}
                    title={i18n.deleteTransaction}
                    className="text-gray-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center">
                  <Trash2 className="w-7 h-7 text-rose-500 dark:text-rose-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">{i18n.deleteTransaction}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {i18n.deleteConfirmTransaction}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {i18n.cancel}
                </button>
                <button
                  onClick={() => handleConfirmDelete(deleteConfirmId)}
                  className="flex-1 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors cursor-pointer shadow-lg shadow-rose-500/20"
                >
                  {i18n.yesDelete}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Transaction Modal */}
      <AnimatePresence>
        {editingTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setEditingTx(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-blue-500" />
                  {i18n.editTransaction}
                </h3>
                <button
                  onClick={() => setEditingTx(null)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {i18n.amount}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm font-bold">{currency.symbol}</span>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:border-blue-500 rounded-2xl py-3 pl-8 pr-4 text-sm font-bold text-gray-900 dark:text-slate-100 focus:outline-none transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {i18n.note}
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:border-blue-500 rounded-2xl py-3 px-4 text-xs text-gray-900 dark:text-slate-100 focus:outline-none transition-colors"
                  placeholder={i18n.notePlaceholder}
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {i18n.category}
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setEditCategoryId(cat.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all cursor-pointer ${
                        editCategoryId === cat.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 scale-105 shadow-md'
                          : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} size={16} />
                      </div>
                      <span className="text-[9px] text-gray-600 dark:text-slate-300 font-medium leading-tight text-center line-clamp-2">
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Source */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {i18n.paymentSource}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditSourceType('credit_card')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold border-2 transition-all cursor-pointer ${
                      editSourceType === 'credit_card'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-gray-100 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-gray-200 dark:hover:border-slate-600'
                    }`}
                  >
                    <CardIcon className="w-4 h-4" />
                    {i18n.creditCard}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditSourceType('cash_bank')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold border-2 transition-all cursor-pointer ${
                      editSourceType === 'cash_bank'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-gray-100 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-gray-200 dark:hover:border-slate-600'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    {i18n.cashBank}
                  </button>
                </div>

                {/* Card Selector (if credit card) */}
                {editSourceType === 'credit_card' && cards.length > 0 && (
                  <select
                    value={editCardId}
                    onChange={(e) => setEditCardId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl py-2.5 px-3 text-xs text-gray-700 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500 mt-2"
                  >
                    <option value="">{i18n.selectCard}</option>
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (•••• {c.last4})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date & Time */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {i18n.dateTime}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:border-blue-500 rounded-2xl py-2.5 px-3 text-xs text-gray-700 dark:text-slate-200 focus:outline-none transition-colors"
                  />
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:border-blue-500 rounded-2xl py-2.5 px-3 text-xs text-gray-700 dark:text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingTx(null)}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {i18n.cancel}
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editAmount || parseFloat(editAmount) <= 0}
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {i18n.save}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
