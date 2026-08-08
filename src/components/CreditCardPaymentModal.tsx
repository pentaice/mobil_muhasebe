import React, { useState } from 'react';
import { CreditCard, Transaction } from '../types';
import { calculateCardCycleInfo, formatTL } from '../utils/storage';
import { CreditCard as CardIcon, X, ShieldCheck } from 'lucide-react';

interface CreditCardPaymentModalProps {
  card: CreditCard;
  transactions: Transaction[];
  onClose: () => void;
  onAddPayment: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

export const CreditCardPaymentModal: React.FC<CreditCardPaymentModalProps> = ({
  card,
  transactions,
  onClose,
  onAddPayment,
}) => {
  const cycleInfo = calculateCardCycleInfo(card, transactions);
  
  // Default payment amount to total current debt, or statement net debt
  const defaultAmount = cycleInfo.totalUnpaidDebt > 0 ? cycleInfo.totalUnpaidDebt : cycleInfo.currentCycleNetDebt;

  const [amountStr, setAmountStr] = useState<string>(defaultAmount.toString());
  const [note, setNote] = useState<string>(`${card.name} Dönem Borcu Ödemesi`);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const amountNumber = parseFloat(amountStr) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountNumber || amountNumber <= 0) return;

    onAddPayment({
      type: 'card_payment',
      amount: amountNumber,
      categoryId: 'cat-diger',
      sourceType: 'cash_bank', // Card payments are made via cash/bank account
      creditCardId: card.id,
      date: new Date(paymentDate).toISOString(),
      note: note.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-md p-6 shadow-2xl text-gray-900 dark:text-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <CardIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 leading-tight">Kart Ödemesi Gir</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">{card.name} (••• {card.last4})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Current Status Box */}
        <div className="bg-gray-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-700 space-y-3">
          <div className="flex justify-between items-center text-xs text-gray-600 dark:text-slate-300">
            <span>Mevcut Toplam Borç:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
              {formatTL(cycleInfo.totalUnpaidDebt)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-600 dark:text-slate-300 border-t border-gray-200/60 dark:border-slate-700 pt-2">
            <span>Dönem İçi Harcama:</span>
            <span className="font-semibold text-gray-800 dark:text-slate-200">
              {formatTL(cycleInfo.currentCycleExpenses)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-600 dark:text-slate-300 border-t border-gray-200/60 dark:border-slate-700 pt-2">
            <span>Yapılan Ödemeler:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              -{formatTL(cycleInfo.currentCyclePayments)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
              Tutar Kısayolları
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAmountStr(cycleInfo.totalUnpaidDebt.toString())}
                className="bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-xs font-medium py-2 px-3 rounded-2xl border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-left transition-colors cursor-pointer"
              >
                <div className="text-[10px] text-gray-400 dark:text-slate-400 font-semibold">Tüm Borcu Kapat</div>
                <div className="font-extrabold text-blue-600 dark:text-blue-400">{formatTL(cycleInfo.totalUnpaidDebt)}</div>
              </button>

              <button
                type="button"
                onClick={() => setAmountStr(cycleInfo.currentCycleNetDebt.toString())}
                className="bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-xs font-medium py-2 px-3 rounded-2xl border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-left transition-colors cursor-pointer"
              >
                <div className="text-[10px] text-gray-400 dark:text-slate-400 font-semibold">Dönem Net Borç</div>
                <div className="font-extrabold text-indigo-600 dark:text-indigo-400">{formatTL(cycleInfo.currentCycleNetDebt)}</div>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
              Ödenen Tutar (₺)
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                required
                className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-blue-600/80 focus:border-blue-600 rounded-2xl py-3 px-4 text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight focus:outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-blue-600 dark:text-blue-400 text-lg">
                ₺
              </span>
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
              Ödeme Tarihi
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl py-2.5 px-3 text-xs text-gray-800 dark:text-slate-100 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
              Açıklama / Not
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl py-2.5 px-3 text-xs text-gray-800 dark:text-slate-100 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!amountNumber || amountNumber <= 0}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
              amountNumber > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-blue-200 dark:shadow-none'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ödemeyi Kaydet & Döngüyü Güncelle</span>
          </button>
        </form>
      </div>
    </div>
  );
};
