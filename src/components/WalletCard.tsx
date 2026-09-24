import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { calculateLiquidCashBalance } from '../utils/storage';
import { useI18n } from '../i18n/I18nContext';
import { useBackHandler } from '../utils/backButton';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Check,
  X,
  Sparkles,
  Info,
  LineChart as ChartLineIcon,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

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
  const { t: i18n, formatCurrency, currency } = useI18n();
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [balanceInput, setBalanceInput] = useState<string>(initialCashBalance.toString());

  // Bottom Sheet Analysis Drawer State
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);
  const [analysisType, setAnalysisType] = useState<'inflow' | 'outflow'>('inflow');

  useBackHandler(() => {
    if (showEditModal) {
      setShowEditModal(false);
      return;
    }
    if (showAnalysisModal) {
      setShowAnalysisModal(false);
      return;
    }
  }, showEditModal || showAnalysisModal, 15);

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

  // Monthly Cash Flow Aggregation for Line Chart
  const monthlyData = useMemo(() => {
    const monthMap: Record<
      string,
      {
        monthKey: string;
        label: string;
        inflow: number;
        outflow: number;
        yearMonth: number;
      }
    > = {};

    // Process all transactions
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const yearMonth = year * 100 + month;
      const label = d.toLocaleDateString(currency.locale || 'tr-TR', { month: 'short', year: '2-digit' });

      if (!monthMap[key]) {
        monthMap[key] = {
          monthKey: key,
          label,
          inflow: 0,
          outflow: 0,
          yearMonth,
        };
      }

      const amount = Number(t.amount) || 0;
      switch (t.type) {
        case 'income':
        case 'investment_withdraw':
          monthMap[key].inflow += amount;
          break;
        case 'expense':
          if (t.sourceType === 'cash_bank') {
            monthMap[key].outflow += amount;
          }
          break;
        case 'card_payment':
        case 'investment_deposit':
          monthMap[key].outflow += amount;
          break;
        default:
          break;
      }
    });

    // Make sure current month always exists in map
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth() + 1;
    const currentKey = `${currYear}-${String(currMonth).padStart(2, '0')}`;
    if (!monthMap[currentKey]) {
      monthMap[currentKey] = {
        monthKey: currentKey,
        label: now.toLocaleDateString(currency.locale || 'tr-TR', { month: 'short', year: '2-digit' }),
        inflow: 0,
        outflow: 0,
        yearMonth: currYear * 100 + currMonth,
      };
    }

    // Sort chronologically and take at least 4-12 points
    const sorted = Object.values(monthMap).sort((a, b) => a.yearMonth - b.yearMonth);
    return sorted;
  }, [transactions, currency.locale]);

  // Peak month & average calculations for the active analysis type
  const analysisStats = useMemo(() => {
    const isIncome = analysisType === 'inflow';
    const values = monthlyData.map((d) => (isIncome ? d.inflow : d.outflow));
    const total = isIncome ? totalInflow : totalOutflow;
    const peakValue = Math.max(0, ...values);
    const peakItem = monthlyData.find((d) => (isIncome ? d.inflow : d.outflow) === peakValue);
    const nonZeroMonths = values.filter((v) => v > 0).length || 1;
    const avgMonthly = total / nonZeroMonths;

    return {
      peakValue,
      peakMonthLabel: peakItem?.label || '-',
      avgMonthly,
      total,
    };
  }, [monthlyData, analysisType, totalInflow, totalOutflow]);

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

  const handleOpenAnalysis = (type: 'inflow' | 'outflow') => {
    setAnalysisType(type);
    setShowAnalysisModal(true);
  };

  return (
    <>
      {/* WALLET WRAPPER WITH REALISTIC WALLET / LEATHER POUCH STYLING */}
      <div className="relative group">
        {/* Visible, Clean Banknote Edge Peeking from Wallet Pocket */}
        <div className="mx-6 -mb-2 h-7 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 rounded-t-2xl opacity-90 border-t border-x border-emerald-400/50 shadow-sm flex items-center justify-between px-4 text-[9.5px] font-bold text-emerald-100 font-mono tracking-wider pointer-events-none pb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block animate-pulse" />
            {currency.symbol} {i18n.cashRegister}
          </span>
          <span>{i18n.bankAccount} {currency.symbol}</span>
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
                    {i18n.walletTitle}
                  </h4>
                  <p className="text-[10.5px] text-amber-200/60 font-medium">
                    {i18n.walletSubtitle}
                  </p>
                </div>
              </div>

              {/* Adjust / Edit Cash Balance Button */}
              <button
                type="button"
                onClick={handleOpenEdit}
                title={i18n.editWalletBalance}
                className="p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 text-amber-300 transition-colors cursor-pointer active:scale-95 flex items-center gap-1 text-[11px] font-bold"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{i18n.adjust}</span>
              </button>
            </div>

            {/* Center Balance Display */}
            <div className="py-2">
              <span className="text-[10px] uppercase font-bold text-amber-200/70 tracking-widest block">
                {i18n.availableNetBalance}
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
                    {i18n.negativeBalance}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Interactive Buttons: Giriş Analizi & Çıkış Analizi */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-amber-800/40 text-xs">
              {/* Giriş Analizi Button */}
              <button
                type="button"
                onClick={() => handleOpenAnalysis('inflow')}
                className="bg-black/35 hover:bg-black/55 active:scale-98 rounded-xl p-2.5 border border-amber-900/40 hover:border-emerald-500/40 flex items-center justify-between transition-all cursor-pointer group text-left shadow-2xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10.5px] text-amber-200/80 font-bold block leading-tight">
                      {i18n.inflowAnalysis}
                    </span>
                    <span className="text-[9px] text-emerald-400/80 font-medium">{i18n.viewChart}</span>
                  </div>
                </div>
                <span className="font-extrabold text-emerald-400 text-xs font-mono pl-1 shrink-0">
                  {formatCurrency(totalInflow)}
                </span>
              </button>

              {/* Çıkış Analizi Button */}
              <button
                type="button"
                onClick={() => handleOpenAnalysis('outflow')}
                className="bg-black/35 hover:bg-black/55 active:scale-98 rounded-xl p-2.5 border border-amber-900/40 hover:border-rose-500/40 flex items-center justify-between transition-all cursor-pointer group text-left shadow-2xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10.5px] text-amber-200/80 font-bold block leading-tight">
                      {i18n.outflowAnalysis}
                    </span>
                    <span className="text-[9px] text-rose-400/80 font-medium">{i18n.viewChart}</span>
                  </div>
                </div>
                <span className="font-extrabold text-rose-400 text-xs font-mono pl-1 shrink-0">
                  {formatCurrency(totalOutflow)}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SHEET: MONTHLY CASH FLOW LINE CHART & STATISTICS */}
      <AnimatePresence>
        {showAnalysisModal && (
          <div className="fixed inset-0 z-50 bg-gray-950/70 dark:bg-black/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%', opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl text-gray-900 dark:text-slate-100 overflow-hidden"
            >
              {/* Drawer Drag Bar (Mobile) */}
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold ${
                      analysisType === 'inflow'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    <ChartLineIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-slate-100">
                      {i18n.cashFlowAnalysisTitle}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">
                      {i18n.cashFlowAnalysisSubtitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAnalysisModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inflow / Outflow Switcher Tabs */}
              <div className="p-4 pb-2">
                <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-slate-800/80 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setAnalysisType('inflow')}
                    className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      analysisType === 'inflow'
                        ? 'bg-emerald-600 text-white shadow-sm scale-[1.01]'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>{i18n.cashInflows}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalysisType('outflow')}
                    className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      analysisType === 'outflow'
                        ? 'bg-rose-600 text-white shadow-sm scale-[1.01]'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>{i18n.cashOutflows}</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-750/80 rounded-2xl p-2.5 text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 block">
                      {analysisType === 'inflow' ? i18n.totalInflowLabel : i18n.totalOutflowLabel}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-black font-mono block mt-0.5 ${
                        analysisType === 'inflow'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrency(analysisStats.total)}
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-750/80 rounded-2xl p-2.5 text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 block">
                      {i18n.monthlyAverage}
                    </span>
                    <span className="text-xs sm:text-sm font-black font-mono text-gray-900 dark:text-slate-100 block mt-0.5">
                      {formatCurrency(analysisStats.avgMonthly)}
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-750/80 rounded-2xl p-2.5 text-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 block">
                      {i18n.peakMonth}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-slate-100 block mt-0.5">
                      {analysisStats.peakMonthLabel}
                    </span>
                  </div>
                </div>

                {/* Monthly Line Chart Container */}
                <div className="bg-gray-50/70 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 rounded-3xl p-4 space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>{i18n.monthlyTrendChart} ({currency.symbol})</span>
                    </span>
                    <span className="text-[10.5px] text-gray-400 font-mono">
                      {monthlyData.length} {i18n.monthsAnalyzed}
                    </span>
                  </div>

                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val))}
                        />
                        <Tooltip
                          formatter={(val: any) => [formatCurrency(Number(val) || 0), analysisType === 'inflow' ? i18n.cashInflowTooltip : i18n.cashOutflowTooltip]}
                          labelFormatter={(label) => `${i18n.periodLabel} ${label}`}
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            borderColor: '#334155',
                            borderRadius: '12px',
                            color: '#f8fafc',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey={analysisType === 'inflow' ? 'inflow' : 'outflow'}
                          stroke={analysisType === 'inflow' ? '#10b981' : '#f43f5e'}
                          strokeWidth={3}
                          dot={{
                            r: 4,
                            fill: analysisType === 'inflow' ? '#10b981' : '#f43f5e',
                            strokeWidth: 2,
                            stroke: '#ffffff',
                          }}
                          activeDot={{
                            r: 6,
                            fill: analysisType === 'inflow' ? '#10b981' : '#f43f5e',
                            strokeWidth: 2,
                            stroke: '#ffffff',
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Month-by-Month Breakdown List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-slate-400 px-1">
                    {i18n.detailedMonthlyBreakdown}
                  </h4>
                  <div className="space-y-1.5">
                    {[...monthlyData]
                      .reverse()
                      .map((item) => {
                        const val = analysisType === 'inflow' ? item.inflow : item.outflow;
                        return (
                          <div
                            key={item.monthKey}
                            className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-750 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="font-bold text-gray-800 dark:text-slate-200">
                                {item.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 font-mono">
                              <span
                                className={`font-black ${
                                  analysisType === 'inflow'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {analysisType === 'inflow' ? '+' : '-'}
                                {formatCurrency(val)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                    <h3 className="font-extrabold text-sm">{i18n.setWalletBalanceTitle}</h3>
                    <p className="text-[10.5px] text-gray-400">{i18n.setWalletBalanceSubtitle}</p>
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
                    {i18n.howIsCalculated}
                  </p>
                  <p className="leading-relaxed opacity-90">
                    {i18n.howIsCalculatedDesc}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-slate-300">
                    {i18n.initialCashAmount} ({currency.symbol})
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
                    {i18n.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{i18n.save}</span>
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

