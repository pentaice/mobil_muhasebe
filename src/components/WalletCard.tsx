import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { calculateLiquidCashBalance } from '../utils/storage';
import { useI18n } from '../i18n/I18nContext';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Check,
  X,
  ShieldCheck,
  Coins,
  Sparkles,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WalletCardProps {
  transactions: Transaction[];
  initialCashBalance: number;
  onUpdateInitialBalance: (newBalance: number) => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  transactions,
  initialCashBalance,
  onUpdateInitialBalance,
}) => {
  const { t: i18n, formatCurrency } = useI18n();
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [balanceInput, setBalanceInput] = useState<string>(initialCashBalance.toString());

  // Current liquid cash balance
  const currentCash = useMemo(
    () => calculateLiquidCashBalance(transactions, initialCashBalance),
    [transactions, initialCashBalance]
  );

  // Cash Inflow vs Outflow breakdowns
  const { totalInflow, totalOutflow } = useMemo(() => {
    let inflow = initialCashBalance;
    let outflow = 0;

    transactions.forEach((t) => {
      const amount = Number(t.amount) || 0;
      switch (t.type) {
        case 'income':
          inflow += amount;
          break;
        case 'investment_withdraw':
          inflow += amount;
          break;
        case 'expense':
          if (t.sourceType === 'cash_bank') {
            outflow += amount;
          }
          break;
        case 'card_payment':
          outflow += amount;
          break;
        case 'investment_deposit':
          outflow += amount;
          break;
        default:
          break;
      }
    });

    return { totalInflow: inflow, totalOutflow: outflow };
  }, [transactions, initialCashBalance]);

  const handleOpenEdit = () => {
    setBalanceInput(initialCashBalance.toString());
    setShowEditModal(true);
  };

  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(balanceInput);
    if (isNaN(val)) return;
    onUpdateInitialBalance(val);
    setShowEditModal(false);
  };

  return (
    <>
      {/* WALLET WRAPPER WITH REALISTIC WALLET / LEATHER POUCH STYLING */}
      <div className="relative group">
        {/* Subtle Banknote Edge Peeking from Wallet Pocket */}
        <div className="mx-8 -mb-2.5 h-4 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 rounded-t-xl opacity-80 border-t border-x border-emerald-300/40 shadow-xs flex items-center justify-between px-4 text-[9px] font-bold text-emerald-100 font-mono tracking-widest pointer-events-none">
          <span>₺ NAKİT KASA</span>
          <span>BANKA HESABI ₺</span>
        </div>

        {/* Main Leather Wallet Body */}
        <div className="relative z-10 bg-gradient-to-br from-[#2f1f17] via-[#241710] to-[#170e0a] text-white rounded-3xl p-1.5 shadow-xl border border-amber-900/60 transition-transform duration-200 overflow-hidden">
          {/* Subtle Leather Texture Glow & Highlights */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Stitched Seam Border (Real Wallet Detail) */}
          <div className="border border-dashed border-amber-600/35 dark:border-amber-500/30 rounded-2xl p-4 sm:p-4.5 relative bg-gradient-to-b from-white/[0.03] to-transparent">
            {/* Wallet Clasp / Leather Tab with Brass Snap Fastener */}
            <div className="absolute -top-1.5 right-6 flex flex-col items-center pointer-events-none">
              <div className="w-9 h-4.5 bg-gradient-to-b from-[#3a271d] to-[#241710] rounded-b-xl border-x border-b border-amber-700/50 shadow-md flex items-center justify-center">
                {/* Brass / Metallic Snap Button */}
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 ring-1 ring-amber-200/60 shadow-inner flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-800/80 shadow-xs" />
                </div>
              </div>
            </div>

            {/* Header: Title & Edit Button */}
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-amber-950 flex items-center justify-center shadow-md shadow-amber-900/40 ring-1 ring-amber-400/40 shrink-0 font-bold">
                  <Wallet className="w-5 h-5 text-amber-100" />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-wider text-amber-200 uppercase font-sans">
                    Cüzdanım
                  </h4>
                  <p className="text-[10.5px] text-amber-200/60 font-medium">
                    Nakit & Vadesiz Banka Hesabı
                  </p>
                </div>
              </div>

              {/* Adjust / Edit Cash Balance Button */}
              <button
                type="button"
                onClick={handleOpenEdit}
                title="Cüzdan Bakiyesini Düzenle"
                className="p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 text-amber-300 transition-colors cursor-pointer active:scale-95 flex items-center gap-1 text-[11px] font-bold"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Düzelt</span>
              </button>
            </div>

            {/* Center Balance Display */}
            <div className="py-2">
              <span className="text-[10px] uppercase font-bold text-amber-200/70 tracking-widest block">
                Kullanılabilir Net Bakiye
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className={`text-3xl sm:text-4xl font-black tracking-tight font-mono ${
                    currentCash >= 0 ? 'text-white' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(currentCash)}
                </span>
                {currentCash < 0 && (
                  <span className="text-[11px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-500/30">
                    Bakiye Eksi
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Info Pills: Inflow & Outflow */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-amber-800/40 text-xs">
              <div className="bg-black/30 rounded-xl p-2 border border-amber-900/30 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10.5px] text-amber-200/70 font-medium">Toplam Giriş</span>
                </div>
                <span className="font-bold text-emerald-400 text-xs font-mono">
                  {formatCurrency(totalInflow)}
                </span>
              </div>

              <div className="bg-black/30 rounded-xl p-2 border border-amber-900/30 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10.5px] text-amber-200/70 font-medium">Toplam Çıkış</span>
                </div>
                <span className="font-bold text-rose-400 text-xs font-mono">
                  {formatCurrency(totalOutflow)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT INITIAL CASH BALANCE MODAL */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 bg-gray-950/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 text-gray-900 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">Cüzdan Bakiyesini Ayarla</h3>
                    <p className="text-[10.5px] text-gray-400">Başlangıç / Kasa Nakit Düzeltmesi</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBalance} className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-200 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    Nasıl Hesaplanır?
                  </p>
                  <p className="leading-relaxed opacity-90">
                    Cüzdan bakiyeniz: <strong>Başlangıç Parası + (Gelirler & Yatırım Çekimleri) - (Nakit Harcamalar & Kart Borcu Ödemeleri & Yatırım Alımları)</strong> şeklinde hesaplanır.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-slate-300">
                    Başlangıç / Kasa Nakit Tutarı (TL)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={balanceInput}
                    onChange={(e) => setBalanceInput(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-amber-500 focus:border-amber-600 rounded-2xl py-2.5 px-3.5 text-xl font-extrabold text-gray-900 dark:text-slate-100 font-mono tracking-tight focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-750 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Kaydet</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
