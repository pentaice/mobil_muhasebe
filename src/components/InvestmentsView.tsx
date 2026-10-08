import React, { useState, useMemo } from 'react';
import { InvestmentAsset, Transaction, InvestmentTransaction, InvestmentCategory } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { calculateInvestmentStats, calculateLiquidCashBalance } from '../utils/storage';
import { useBackHandler } from '../utils/backButton';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Coins,
  PieChart as ChartIcon,
  Wallet,
  Sparkles,
  Calendar,
  X,
  Check,
  Edit3,
  SlidersHorizontal,
  ChevronRight,
  Info,
  Clock,
  Briefcase,
  AlertCircle,
  Percent,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface InvestmentsViewProps {
  assets: InvestmentAsset[];
  transactions: Transaction[];
  initialCashBalance?: number;
  onAddAsset: (asset: Omit<InvestmentAsset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateAsset: (asset: InvestmentAsset) => void;
  onDeleteAsset: (id: string) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
}

const CATEGORY_LABELS: Record<InvestmentCategory, { label: string; icon: any; color: string }> = {
  gold: { label: 'Gold & Metals', icon: Coins, color: '#f59e0b' },
  forex: { label: 'Forex & Cash', icon: DollarSign, color: '#10b981' },
  stock: { label: 'Stocks & Equities', icon: TrendingUp, color: '#3b82f6' },
  fund: { label: 'Mutual Funds', icon: ChartIcon, color: '#8b5cf6' },
  crypto: { label: 'Crypto', icon: Sparkles, color: '#ec4899' },
  deposit: { label: 'Time Deposit', icon: Briefcase, color: '#06b6d4' },
  other: { label: 'Other Assets', icon: Wallet, color: '#64748b' },
};

export const InvestmentsView: React.FC<InvestmentsViewProps> = ({
  assets,
  transactions,
  initialCashBalance = 0,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
  onAddTransaction,
}) => {
  const { t: i18n, formatCurrency, currency } = useI18n();

  const getCategoryLabel = (category: InvestmentCategory): string => {
    switch (category) {
      case 'gold': return i18n.assetGold;
      case 'forex': return i18n.assetForex;
      case 'stock': return i18n.assetStock;
      case 'fund': return i18n.assetFund;
      case 'crypto': return i18n.assetCrypto;
      case 'deposit': return i18n.assetDeposit;
      default: return i18n.assetOther;
    }
  };

  // Active Modals
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [showValuationModal, setShowValuationModal] = useState<boolean>(false);
  const [showNewAssetModal, setShowNewAssetModal] = useState<boolean>(false);
  const [selectedAssetForAction, setSelectedAssetForAction] = useState<InvestmentAsset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<InvestmentAsset | null>(null);

  useBackHandler(() => {
    if (assetToDelete) {
      setAssetToDelete(null);
      return;
    }
    if (showDepositModal) {
      setShowDepositModal(false);
      return;
    }
    if (showWithdrawModal) {
      setShowWithdrawModal(false);
      return;
    }
    if (showValuationModal) {
      setShowValuationModal(false);
      return;
    }
    if (showNewAssetModal) {
      setShowNewAssetModal(false);
      return;
    }
  }, Boolean(assetToDelete || showDepositModal || showWithdrawModal || showValuationModal || showNewAssetModal), 15);

  // Deposit Form State
  const [depositAssetId, setDepositAssetId] = useState<string>('');
  const [depositAmountStr, setDepositAmountStr] = useState<string>('');
  const [depositNote, setDepositNote] = useState<string>('');

  // Withdraw Form State
  const [withdrawAssetId, setWithdrawAssetId] = useState<string>('');
  const [withdrawAmountStr, setWithdrawAmountStr] = useState<string>(''); // Cash received
  const [withdrawCostBasisStr, setWithdrawCostBasisStr] = useState<string>(''); // Cost basis (principal)
  const [withdrawNote, setWithdrawNote] = useState<string>('');

  // Valuation Form State
  const [valuationAssetId, setValuationAssetId] = useState<string>('');
  const [valuationAmountStr, setValuationAmountStr] = useState<string>('');

  // New Asset Form State
  const [newAssetName, setNewAssetName] = useState<string>('');
  const [newAssetCategory, setNewAssetCategory] = useState<InvestmentCategory>('gold');
  const [newAssetColor, setNewAssetColor] = useState<string>('#f59e0b');

  // Stats Calculations
  const stats = useMemo(() => calculateInvestmentStats(assets, transactions), [assets, transactions]);
  const availableCash = useMemo(() => calculateLiquidCashBalance(transactions, initialCashBalance), [transactions, initialCashBalance]);

  // Chart data for asset allocation
  const pieData = useMemo(() => {
    return assets
      .filter((a) => Number(a.currentValue) > 0)
      .map((a) => ({
        name: a.name,
        value: Number(a.currentValue),
        color: a.color || CATEGORY_LABELS[a.category]?.color || '#3b82f6',
      }));
  }, [assets]);

  // Recent withdrawals with profit / loss
  const recentWithdrawals = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'investment_withdraw')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // --- Handlers ---

  // 1. Deposit (Arta kalan paradan yatırıma aktar)
  const handleOpenDeposit = (asset?: InvestmentAsset) => {
    const targetAsset = asset || assets[0];
    setDepositAssetId(targetAsset?.id || '');
    setDepositAmountStr('');
    setDepositNote('');
    setShowDepositModal(true);
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmountStr);
    const asset = assets.find((a) => a.id === depositAssetId);
    if (!asset || !amount || amount <= 0) return;

    // Update asset principal and current value
    const updatedAsset: InvestmentAsset = {
      ...asset,
      investedAmount: (Number(asset.investedAmount) || 0) + amount,
      currentValue: (Number(asset.currentValue) || 0) + amount,
      updatedAt: new Date().toISOString(),
    };
    onUpdateAsset(updatedAsset);

    // Record transaction
    onAddTransaction({
      type: 'investment_deposit',
      amount,
      categoryId: 'cat-yatirim',
      sourceType: 'cash_bank',
      investmentAssetId: asset.id,
      date: new Date().toISOString(),
      note: depositNote.trim() || `${asset.name} (${i18n.investCash})`,
    });

    setShowDepositModal(false);
  };

  // 2. Withdraw (Yatırımdan nakite çek / kâr-zarar realizasyonu)
  const handleOpenWithdraw = (asset?: InvestmentAsset) => {
    const targetAsset = asset || assets[0];
    setWithdrawAssetId(targetAsset?.id || '');
    setWithdrawAmountStr('');
    setWithdrawCostBasisStr('');
    setWithdrawNote('');
    setShowWithdrawModal(true);
  };

  // Auto-calculate suggested cost basis when withdraw amount changes
  const handleWithdrawAmountChange = (val: string) => {
    setWithdrawAmountStr(val);
    const amount = parseFloat(val);
    const asset = assets.find((a) => a.id === withdrawAssetId);
    if (asset && amount > 0 && asset.currentValue > 0) {
      // Proportional cost basis
      const ratio = Math.min(1, amount / asset.currentValue);
      const estimatedCost = Math.round(asset.investedAmount * ratio);
      setWithdrawCostBasisStr(String(estimatedCost));
    }
  };

  const handleConfirmWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const cashReceived = parseFloat(withdrawAmountStr);
    const costBasis = parseFloat(withdrawCostBasisStr) || cashReceived;
    const asset = assets.find((a) => a.id === withdrawAssetId);
    if (!asset || !cashReceived || cashReceived <= 0) return;

    const profitOrLoss = cashReceived - costBasis;

    // Update asset
    const updatedAsset: InvestmentAsset = {
      ...asset,
      investedAmount: Math.max(0, (Number(asset.investedAmount) || 0) - costBasis),
      currentValue: Math.max(0, (Number(asset.currentValue) || 0) - cashReceived),
      updatedAt: new Date().toISOString(),
    };
    onUpdateAsset(updatedAsset);

    // Record transaction (Cash enters cash_bank with profit/loss tracked)
    onAddTransaction({
      type: 'investment_withdraw',
      amount: cashReceived,
      categoryId: 'cat-yatirim',
      sourceType: 'cash_bank',
      investmentAssetId: asset.id,
      profitOrLoss,
      date: new Date().toISOString(),
      note: withdrawNote.trim() || `${asset.name} (${i18n.withdrawCashTitle})`,
    });

    setShowWithdrawModal(false);
  };

  // 3. Update Valuation (Güncel piyasa değerini güncelleme)
  const handleOpenValuation = (asset: InvestmentAsset) => {
    setValuationAssetId(asset.id);
    setValuationAmountStr(String(asset.currentValue || ''));
    setShowValuationModal(true);
  };

  const handleConfirmValuation = (e: React.FormEvent) => {
    e.preventDefault();
    const newValuation = parseFloat(valuationAmountStr);
    const asset = assets.find((a) => a.id === valuationAssetId);
    if (!asset || isNaN(newValuation) || newValuation < 0) return;

    const updatedAsset: InvestmentAsset = {
      ...asset,
      currentValue: newValuation,
      updatedAt: new Date().toISOString(),
    };
    onUpdateAsset(updatedAsset);
    setShowValuationModal(false);
  };

  // 4. Create New Asset
  const handleConfirmNewAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim()) return;

    onAddAsset({
      name: newAssetName.trim(),
      category: newAssetCategory,
      investedAmount: 0,
      currentValue: 0,
      color: newAssetColor,
      icon: CATEGORY_LABELS[newAssetCategory]?.icon?.name || 'Coins',
      notes: '',
    });

    setNewAssetName('');
    setShowNewAssetModal(false);
  };

  // 5. Delete Asset Handler
  const handleConfirmDeleteAsset = () => {
    if (!assetToDelete) return;
    onDeleteAsset(assetToDelete.id);
    setAssetToDelete(null);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* 1. HERO INVESTMENT SUMMARY CARD                                          */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Top bar with portfolio title & total value */}
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-teal-100 uppercase tracking-widest">
                {i18n.portfolioValue}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            </div>
            <p className="text-3xl font-black tracking-tight mt-0.5">
              {formatCurrency(stats.totalCurrentValue)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewAssetModal(true)}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{i18n.newAsset}</span>
          </button>
        </div>

        {/* Profit / Loss & Cost Metric Row */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-white/15">
          <div className="space-y-0.5">
            <span className="text-[10.5px] text-teal-100 font-medium block">
              {i18n.totalInvested}
            </span>
            <span className="text-sm font-extrabold text-white">
              {formatCurrency(stats.totalInvested)}
            </span>
          </div>

          <div className="space-y-0.5 text-right">
            <span className="text-[10.5px] text-teal-100 font-medium block">
              {i18n.netProfitLoss}
            </span>
            <div className="inline-flex items-center gap-1">
              {stats.totalProfitLoss >= 0 ? (
                <span className="text-sm font-black text-emerald-200 bg-emerald-950/40 px-2 py-0.5 rounded-lg">
                  +{formatCurrency(stats.totalProfitLoss)} (+{stats.returnPercentage.toFixed(1)}%)
                </span>
              ) : (
                <span className="text-sm font-black text-rose-200 bg-rose-950/40 px-2 py-0.5 rounded-lg">
                  {formatCurrency(stats.totalProfitLoss)} ({stats.returnPercentage.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Available Cash Pill */}
        <div className="mt-3.5 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-teal-100">
            <Wallet className="w-3.5 h-3.5 text-teal-200" />
            <span>{i18n.availableCash}:</span>
          </div>
          <span className="font-extrabold text-white bg-white/20 px-2 py-0.5 rounded-lg">
            {formatCurrency(availableCash)}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ACTION BUTTONS (Yatır, Bozdur, Değer Güncelle)                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => handleOpenDeposit()}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-850 hover:bg-emerald-50/70 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-750/80 shadow-2xs transition-all active:scale-98 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-gray-800 dark:text-slate-200 text-center">
            {i18n.investCash}
          </span>
          <span className="text-[9.5px] text-gray-400 dark:text-slate-500 text-center mt-0.5">
            {i18n.transferFromCash}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenWithdraw()}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-850 hover:bg-amber-50/70 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-750/80 shadow-2xs transition-all active:scale-98 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-110 transition-transform">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-gray-800 dark:text-slate-200 text-center">
            {i18n.withdrawCash}
          </span>
          <span className="text-[9.5px] text-gray-400 dark:text-slate-500 text-center mt-0.5">
            {i18n.calcProfitLoss}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (assets.length > 0) handleOpenValuation(assets[0]);
          }}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-850 hover:bg-indigo-50/70 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-750/80 shadow-2xs transition-all active:scale-98 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-110 transition-transform">
            <Edit3 className="w-4.5 h-4.5" />
          </div>
          <span className="text-[11px] font-bold text-gray-800 dark:text-slate-200 text-center">
            {i18n.updateValuation}
          </span>
          <span className="text-[9.5px] text-gray-400 dark:text-slate-500 text-center mt-0.5">
            {i18n.marketValue}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. PORTFOLIO ASSETS LIST                                                  */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-slate-100">
            {i18n.myAssetsAndPositions} ({assets.length})
          </h3>
          <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
            {i18n.realizedProfitLoss}: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.realizedProfitLoss)}</strong>
          </span>
        </div>

        {assets.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-850 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
              <Coins className="w-6 h-6" />
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {i18n.noAssetsDesc}
            </p>
            <button
              type="button"
              onClick={() => setShowNewAssetModal(true)}
              className="bg-teal-600 text-white font-bold text-xs py-2 px-4 rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{i18n.addFirstAsset}</span>
            </button>
          </div>
        ) : (
          assets.map((asset) => {
            const catInfo = CATEGORY_LABELS[asset.category] || CATEGORY_LABELS.other;
            const Icon = catInfo.icon;
            const diff = asset.currentValue - asset.investedAmount;
            const returnPct = asset.investedAmount > 0 ? (diff / asset.investedAmount) * 100 : 0;

            return (
              <div
                key={asset.id}
                className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-4 shadow-2xs space-y-3 transition-colors"
              >
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: asset.color || catInfo.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-slate-100">
                        {asset.name}
                      </h4>
                      <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">
                        {getCategoryLabel(asset.category)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-gray-900 dark:text-slate-100 block">
                      {formatCurrency(asset.currentValue)}
                    </span>
                    <span
                      className={`text-[10.5px] font-black inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md ${
                        diff >= 0
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {diff >= 0 ? '+' : ''}
                      {formatCurrency(diff)} ({returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Sub details: Cost vs Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
                  <span className="text-[11px] text-gray-500 dark:text-slate-400">
                    {i18n.investedPrincipal}: <strong>{formatCurrency(asset.investedAmount)}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenDeposit(asset)}
                      title={i18n.investCash}
                      className="text-[10px] font-bold px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      {i18n.investMore}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenWithdraw(asset)}
                      title={i18n.withdrawCash}
                      className="text-[10px] font-bold px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      {i18n.withdrawCashTitle}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenValuation(asset)}
                      title={i18n.updateValuationTitle}
                      className="p-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssetToDelete(asset)}
                      title={i18n.deleteAssetTitle}
                      className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. REALIZED GAINS & RECENT WITHDRAWALS                                    */}
      {/* ========================================================================= */}
      {recentWithdrawals.length > 0 && (
        <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-gray-900 dark:text-slate-100">
              {i18n.recentRealizedPL}
            </h4>
            <span className="text-[10.5px] text-gray-400 font-medium">{i18n.cashedOutLabel}</span>
          </div>

          <div className="space-y-2">
            {recentWithdrawals.map((t) => {
              const pL = Number(t.profitOrLoss) || 0;
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-750 text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-800 dark:text-slate-200 block leading-tight">
                      {t.note || i18n.investmentWithdrawal}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(t.date).toLocaleDateString(currency.locale || 'tr-TR')} • {i18n.cashInflowPrefix} {formatCurrency(t.amount)}
                    </span>
                  </div>

                  <span
                    className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                      pL >= 0
                        ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100/70 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {pL >= 0 ? `+${formatCurrency(pL)} ${i18n.profitRealizedShort}` : `${formatCurrency(pL)} ${i18n.lossRealizedShort}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: DEPOSIT CASH INTO INVESTMENT                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 z-50 bg-gray-950/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 text-gray-900 dark:text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">{i18n.investCash}</h3>
                    <p className="text-[10px] text-gray-500">{i18n.transferFromCashDesc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleConfirmDeposit} className="space-y-3">
                {/* Available Cash banner */}
                <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-900/40 p-2.5 rounded-2xl flex items-center justify-between text-xs">
                  <span className="text-teal-800 dark:text-teal-200 font-medium">{i18n.availableCash}:</span>
                  <span className="font-black text-teal-900 dark:text-teal-100">{formatCurrency(availableCash)}</span>
                </div>

                {/* Target Asset */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {i18n.investmentAssetLabel}
                  </label>
                  <select
                    value={depositAssetId}
                    onChange={(e) => setDepositAssetId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.currentValue)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {i18n.amountToTransfer} ({currency.symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={depositAmountStr}
                    onChange={(e) => setDepositAmountStr(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 focus:border-emerald-600 rounded-xl py-2 px-3 text-xl font-black"
                  />

                  {/* Quick percentage chips */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {[0.25, 0.5, 1].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          const val = Math.max(0, Math.floor(availableCash * pct));
                          setDepositAmountStr(String(val));
                        }}
                        className="text-[10px] font-bold py-1 px-2.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-emerald-50"
                      >
                        %{pct * 100}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {i18n.noteOptional}
                  </label>
                  <input
                    type="text"
                    placeholder={i18n.transferPlaceholder}
                    value={depositNote}
                    onChange={(e) => setDepositNote(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(false)}
                    className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-800 rounded-xl font-bold text-xs text-gray-600 dark:text-slate-300"
                  >
                    {i18n.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{i18n.confirmInvestment}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: WITHDRAW FROM INVESTMENT (BOZDUR & KÂR/ZARAR)                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 bg-gray-950/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 text-gray-900 dark:text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">{i18n.withdrawCash}</h3>
                    <p className="text-[10px] text-gray-500">{i18n.cashOutSubtitle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleConfirmWithdraw} className="space-y-3">
                {/* Source Asset */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {i18n.assetToCashOut}
                  </label>
                  <select
                    value={withdrawAssetId}
                    onChange={(e) => {
                      setWithdrawAssetId(e.target.value);
                      handleWithdrawAmountChange(withdrawAmountStr);
                    }}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.currentValue)} • {i18n.investedPrincipal}: {formatCurrency(a.investedAmount)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cash Received */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {i18n.cashReceived} ({currency.symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={withdrawAmountStr}
                    onChange={(e) => handleWithdrawAmountChange(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 focus:border-amber-600 rounded-xl py-2 px-3 text-xl font-black"
                  />
                </div>

                {/* Cost Basis (Principal) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {i18n.principalCost} ({currency.symbol})
                    </label>
                    <span className="text-[9px] text-gray-400">{i18n.investedAmountHelp}</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={withdrawCostBasisStr}
                    onChange={(e) => setWithdrawCostBasisStr(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-1.5 px-3 text-sm font-semibold"
                  />
                </div>

                {/* Real-time Profit/Loss Preview Banner */}
                {parseFloat(withdrawAmountStr) > 0 && parseFloat(withdrawCostBasisStr) > 0 && (
                  <div
                    className={`p-3 rounded-2xl border text-center space-y-0.5 ${
                      parseFloat(withdrawAmountStr) - parseFloat(withdrawCostBasisStr) >= 0
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider font-bold block">
                      {i18n.realizedResult}
                    </span>
                    <p className="text-base font-black">
                      {parseFloat(withdrawAmountStr) - parseFloat(withdrawCostBasisStr) >= 0 ? '+' : ''}
                      {formatCurrency(parseFloat(withdrawAmountStr) - parseFloat(withdrawCostBasisStr))}
                      <span className="text-xs font-semibold ml-1">
                        ({(
                          ((parseFloat(withdrawAmountStr) - parseFloat(withdrawCostBasisStr)) /
                            parseFloat(withdrawCostBasisStr)) *
                          100
                        ).toFixed(1)}
                        % ${i18n.returnPctLabel})
                      </span>
                    </p>
                    <p className="text-[10px] opacity-80">{i18n.cashAddedNotice}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-800 rounded-xl font-bold text-xs text-gray-600 dark:text-slate-300"
                  >
                    {i18n.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-amber-500/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{i18n.convertToCash}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: UPDATE MARKET VALUATION                                          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showValuationModal && (
          <div className="fixed inset-0 z-50 bg-gray-950/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 text-gray-900 dark:text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">{i18n.updateValuation}</h3>
                    <p className="text-[10px] text-gray-500">{i18n.updateValuationSubtitle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowValuationModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleConfirmValuation} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {i18n.selectAssetLabel}
                  </label>
                  <select
                    value={valuationAssetId}
                    onChange={(e) => {
                      setValuationAssetId(e.target.value);
                      const a = assets.find((x) => x.id === e.target.value);
                      if (a) setValuationAmountStr(String(a.currentValue));
                    }}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {i18n.newCurrentValue} ({currency.symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={valuationAmountStr}
                    onChange={(e) => setValuationAmountStr(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 focus:border-indigo-600 rounded-xl py-2 px-3 text-xl font-black"
                  />
                  <p className="text-[10.5px] text-gray-400 pt-1">
                    {i18n.valuationNotice}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowValuationModal(false)}
                    className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-800 rounded-xl font-bold text-xs text-gray-600 dark:text-slate-300"
                  >
                    {i18n.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-indigo-500/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{i18n.confirmValuation}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: CREATE NEW ASSET                                                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showNewAssetModal && (
          <div className="fixed inset-0 z-50 bg-gray-950/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 text-gray-900 dark:text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">{i18n.newAsset}</h3>
                    <p className="text-[10px] text-gray-500">{i18n.newAssetSubtitle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewAssetModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleConfirmNewAsset} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {i18n.assetNameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={i18n.assetNamePlaceholder}
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {i18n.assetClassLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(CATEGORY_LABELS) as InvestmentCategory[]).map((catKey) => {
                      const c = CATEGORY_LABELS[catKey];
                      const isSelected = newAssetCategory === catKey;
                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => {
                            setNewAssetCategory(catKey);
                            setNewAssetColor(c.color);
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-600 text-teal-800 dark:text-teal-200 font-bold'
                              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-750 text-gray-600 dark:text-slate-400 text-xs'
                          }`}
                        >
                          <c.icon className="w-4 h-4" style={{ color: c.color }} />
                          <span className="text-[11px] truncate">{getCategoryLabel(catKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewAssetModal(false)}
                    className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-800 rounded-xl font-bold text-xs text-gray-600 dark:text-slate-300"
                  >
                    {i18n.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-teal-500/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{i18n.saveAssetBtn}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: DELETE ASSET CONFIRMATION                                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {assetToDelete && (
          <div className="fixed inset-0 z-50 bg-gray-950/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 text-gray-900 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm">{i18n.deleteAssetTitle}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAssetToDelete(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-gray-900 dark:text-slate-100">"{assetToDelete.name}"</strong> {i18n.deleteAssetConfirmText}
                </p>

                {Number(assetToDelete.currentValue) > 0 && (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-[11.5px]">{i18n.importantWarning}</p>
                      <p className="text-[11px] leading-relaxed">{i18n.deleteAssetWarningDesc}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssetToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-750 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {i18n.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteAsset}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer active:scale-95"
                >
                  {i18n.yesDeleteAsset}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
