import React, { useState, useMemo } from 'react';
import { Category, CreditCard, Transaction } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatTL, formatShortDate } from '../utils/storage';
import { Search, Trash2, ArrowDownLeft, Calendar, FileText } from 'lucide-react';

interface TransactionsViewProps {
  categories: Category[];
  cards: CreditCard[];
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  categories,
  cards,
  transactions,
  onDeleteTransaction,
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

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
            placeholder="Açıklama, kategori veya tutar ara..."
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
            <option value="all">Tüm İşlem Tipleri</option>
            <option value="expense">Sadece Harcamalar</option>
            <option value="card_payment">Sadece Kart Ödemeleri</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl py-2 px-3 text-xs text-gray-700 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-600"
          >
            <option value="all">Tüm Kategoriler</option>
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
            <p className="text-gray-800 dark:text-slate-200 font-medium text-sm">İşlem Bulunamadı</p>
            <p className="text-gray-400 dark:text-slate-500 text-xs">Arama kriterlerinizi değiştirmeyi deneyin.</p>
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
                <div className="flex items-center gap-3">
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

                  <div className="space-y-0.5">
                    <p className="font-bold text-xs text-gray-900 dark:text-slate-100 line-clamp-1">
                      {isExpense ? cat?.name || 'Harcama' : 'Kart Ödemesi'}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-1">
                      {t.note || (isExpense ? (card ? card.name : 'Nakit/Banka') : card?.name || 'Kredi Kartı')}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                        {formatShortDate(t.date)}
                      </span>
                      {card && (
                        <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-semibold border border-blue-100 dark:border-blue-800">
                          💳 {card.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount & Delete Action */}
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p
                      className={`font-extrabold text-sm ${
                        isExpense ? 'text-gray-900 dark:text-slate-100' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isExpense ? '-' : '+'}{formatTL(t.amount)}
                    </p>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 block font-medium">
                      {isExpense ? 'Harcama' : 'Ödeme'}
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteTransaction(t.id)}
                    title="İşlemi Sil"
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
    </div>
  );
};
