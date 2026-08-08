import React, { useState } from 'react';
import { Category, CreditCard, Transaction } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatTL, loadQuickAmounts, saveQuickAmounts, DEFAULT_QUICK_AMOUNTS } from '../utils/storage';
import {
  Zap,
  CreditCard as CardIcon,
  Wallet,
  Plus,
  Calendar,
  ChevronDown,
  ChevronUp,
  Settings2,
  X,
  RotateCcw,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickAddExpenseProps {
  categories: Category[];
  cards: CreditCard[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onOpenAddCategoryModal: () => void;
}

export const QuickAddExpense: React.FC<QuickAddExpenseProps> = ({
  categories,
  cards,
  onAddTransaction,
  onOpenAddCategoryModal,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || 'cat-yemek');
  const [amountStr, setAmountStr] = useState<string>('');
  const [sourceType, setSourceType] = useState<'credit_card' | 'cash_bank'>('credit_card');
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [note, setNote] = useState<string>('');
  const [showDetailsDrawer, setShowDetailsDrawer] = useState<boolean>(false);
  const [isCustomDate, setIsCustomDate] = useState<boolean>(false);
  const [customDateTime, setCustomDateTime] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );

  // Customizable Quick Preset Amounts
  const [quickAmounts, setQuickAmounts] = useState<number[]>(() => loadQuickAmounts());
  const [showQuickAmountModal, setShowQuickAmountModal] = useState<boolean>(false);
  const [newQuickAmountInput, setNewQuickAmountInput] = useState<string>('');

  const amountNumber = parseFloat(amountStr) || 0;

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseFloat(amountStr) || 0;
    setAmountStr((current + addValue).toString());
  };

  const handleClearAmount = () => {
    setAmountStr('');
  };

  // Preset customization handlers
  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newQuickAmountInput);
    if (!val || val <= 0) return;
    if (quickAmounts.includes(val)) {
      setNewQuickAmountInput('');
      return;
    }
    const updated = [...quickAmounts, val].sort((a, b) => a - b);
    setQuickAmounts(updated);
    saveQuickAmounts(updated);
    setNewQuickAmountInput('');
  };

  const handleRemovePreset = (valToRemove: number) => {
    const updated = quickAmounts.filter((v) => v !== valToRemove);
    setQuickAmounts(updated);
    saveQuickAmounts(updated);
  };

  const handleResetPresets = () => {
    setQuickAmounts(DEFAULT_QUICK_AMOUNTS);
    saveQuickAmounts(DEFAULT_QUICK_AMOUNTS);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountNumber || amountNumber <= 0) return;

    const txDate = isCustomDate ? new Date(customDateTime).toISOString() : new Date().toISOString();

    onAddTransaction({
      type: 'expense',
      amount: amountNumber,
      categoryId: selectedCategoryId,
      sourceType,
      creditCardId: sourceType === 'credit_card' ? selectedCardId : undefined,
      date: txDate,
      note: note.trim() || undefined,
    });

    // Reset inputs for next fast entry
    setAmountStr('');
    setNote('');
    setIsCustomDate(false);
    setShowDetailsDrawer(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Compact Main Card Container - No Vertical Scroll Needed */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs text-gray-900 relative overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* AMOUNT INPUT & QUICK CHIPS */}
          <div className="space-y-1.5">
            <div className="relative">
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                autoFocus
                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-blue-600 rounded-2xl py-2.5 pl-3.5 pr-12 text-2xl font-black text-gray-900 tracking-tight focus:outline-none transition-all placeholder:text-gray-300"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {amountStr && (
                  <button
                    type="button"
                    onClick={handleClearAmount}
                    className="text-[10px] text-gray-500 hover:text-gray-800 bg-gray-200/80 px-1.5 py-0.5 rounded cursor-pointer font-semibold"
                  >
                    Sil
                  </button>
                )}
                <span className="text-lg font-bold text-blue-600">₺</span>
              </div>
            </div>

            {/* Fast increment chips (No scrollbar visible, customizable presets) */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar scrollbar-none flex-1">
                {quickAmounts.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAddAmount(val)}
                    className="bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-800 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-gray-200/80 whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-2xs"
                  >
                    +{val}₺
                  </button>
                ))}
              </div>

              {/* Edit Quick Amounts Button */}
              <button
                type="button"
                onClick={() => setShowQuickAmountModal(true)}
                title="Hızlı Miktarları Düzenle"
                className="p-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CATEGORY SELECTION (Ultra-compact, Non-truncated, Multi-line readable Grid) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Kategori
              </span>
              <button
                type="button"
                onClick={onOpenAddCategoryModal}
                className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-bold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Ekle</span>
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
              {categories.map((cat) => {
                const isSelected = cat.id === selectedCategoryId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`relative flex flex-col items-center justify-center p-1.5 min-h-[60px] rounded-xl transition-all duration-150 border text-center cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-600 shadow-2xs scale-[1.02]'
                        : 'bg-gray-50/70 border-gray-200/80 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center mb-1 text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} size={13} />
                    </div>
                    {/* Readable, non-truncated category name fitting 2 lines nicely */}
                    <span
                      className={`text-[9.5px] leading-[1.15] font-semibold text-center w-full break-words line-clamp-2 px-0.5 ${
                        isSelected ? 'text-blue-900 font-bold' : 'text-gray-700'
                      }`}
                    >
                      {cat.name}
                    </span>

                    {isSelected && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PAYMENT SOURCE SELECTOR */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setSourceType('credit_card')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  sourceType === 'credit_card'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-2xs'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <CardIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Kredi Kartı</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('cash_bank')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  sourceType === 'cash_bank'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-2xs'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nakit / Banka</span>
              </button>
            </div>

            {/* Select Credit Card if Credit Card selected */}
            {sourceType === 'credit_card' && cards.length > 0 && (
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs text-gray-800 font-semibold focus:outline-none focus:border-blue-600"
              >
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    💳 {card.name} (*{card.last4})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* ACCORDION/DRAWER FOR OPTIONAL DETAILS (Note & Custom Date) */}
          <div className="border-t border-gray-100 pt-1.5">
            <button
              type="button"
              onClick={() => setShowDetailsDrawer(!showDetailsDrawer)}
              className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-blue-600 font-semibold py-1 px-1 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1">
                <Plus className={`w-3.5 h-3.5 text-blue-600 transition-transform ${showDetailsDrawer ? 'rotate-45' : ''}`} />
                <span>{showDetailsDrawer ? 'Detayları Gizle' : 'Not veya Tarih Ekle'}</span>
              </span>
              {showDetailsDrawer ? (
                <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>

            <AnimatePresence>
              {showDetailsDrawer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-2 pt-2 overflow-hidden"
                >
                  <input
                    type="text"
                    placeholder="Açıklama / Not..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-600"
                  />

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsCustomDate(!isCustomDate)}
                      className="flex items-center gap-1 text-blue-600 font-semibold cursor-pointer"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>{isCustomDate ? 'Anlık Tarihe Dön' : 'Farklı Tarih Seç'}</span>
                    </button>
                  </div>

                  {isCustomDate && (
                    <input
                      type="datetime-local"
                      value={customDateTime}
                      onChange={(e) => setCustomDateTime(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={!amountNumber || amountNumber <= 0}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
              amountNumber > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Harcamayı Kaydet ({amountNumber > 0 ? formatTL(amountNumber) : '0.00 ₺'})</span>
          </button>
        </form>
      </div>

      {/* QUICK AMOUNT CUSTOMIZATION MODAL */}
      <AnimatePresence>
        {showQuickAmountModal && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-100 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Settings2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900">Hızlı Miktarları Düzenle</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickAmountModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Existing preset chips with delete badge */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Mevcut Butonlar
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((val) => (
                    <div
                      key={val}
                      className="bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold py-1 px-2.5 rounded-xl flex items-center gap-1.5"
                    >
                      <span>+{val}₺</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePreset(val)}
                        title="Sil"
                        className="hover:text-rose-600 text-gray-400 cursor-pointer p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Preset Form */}
              <form onSubmit={handleAddPreset} className="space-y-2 pt-2 border-t border-gray-100">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Yeni Miktar Ekle
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Örn: 20 veya 150"
                    value={newQuickAmountInput}
                    onChange={(e) => setNewQuickAmountInput(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ekle</span>
                  </button>
                </div>
              </form>

              {/* Reset to Defaults / Done */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleResetPresets}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Varsayılana Dön</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQuickAmountModal(false)}
                  className="bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Tamam</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
