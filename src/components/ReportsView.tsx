import React, { useState, useMemo } from 'react';
import { Category, CreditCard, Transaction, IncomeCategory } from '../types';
import { formatShortDate, loadIncomeCategories } from '../utils/storage';
import { CategoryIcon } from './CategoryIcon';
import { useI18n } from '../i18n/I18nContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  PieChart as ChartIcon,
  Calendar,
  CalendarRange,
  TrendingUp,
  TrendingDown,
  CreditCard as CardIcon,
  Wallet,
  X,
  Check,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  Percent,
  Sparkles,
} from 'lucide-react';

interface ReportsViewProps {
  categories: Category[];
  incomeCategories?: IncomeCategory[];
  cards: CreditCard[];
  transactions: Transaction[];
  isDarkMode?: boolean;
}

type PeriodType = 'this_month' | 'last_month' | 'last_30_days' | 'custom' | 'all';

export const ReportsView: React.FC<ReportsViewProps> = ({
  categories,
  incomeCategories,
  cards,
  transactions,
  isDarkMode = false,
}) => {
  const { t: i18n, formatCurrency } = useI18n();
  const [period, setPeriod] = useState<PeriodType>('this_month');
  const [showCustomDateModal, setShowCustomDateModal] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Custom date range state (Defaults to earliest and latest transaction date or current month)
  const [customStartDate, setCustomStartDate] = useState<string>('2026-04-08');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-08-08');

  // Filter transactions based on chosen period
  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter((t) => {
      const tDate = new Date(t.date);

      if (period === 'this_month') {
        return (
          tDate.getMonth() === now.getMonth() &&
          tDate.getFullYear() === now.getFullYear()
        );
      } else if (period === 'last_month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return (
          tDate.getMonth() === lastMonth.getMonth() &&
          tDate.getFullYear() === lastMonth.getFullYear()
        );
      } else if (period === 'last_30_days') {
        const diffMs = now.getTime() - tDate.getTime();
        return diffMs >= 0 && diffMs <= 30 * 24 * 60 * 60 * 1000;
      } else if (period === 'custom') {
        if (!customStartDate && !customEndDate) return true;
        const start = customStartDate ? new Date(customStartDate + 'T00:00:00.000Z').getTime() : 0;
        const end = customEndDate ? new Date(customEndDate + 'T23:59:59.999Z').getTime() : Infinity;
        const tTime = tDate.getTime();
        return tTime >= start && tTime <= end;
      }
      return true; // 'all'
    });
  }, [transactions, period, customStartDate, customEndDate]);

  // Incomes & Expenses
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [filteredTransactions]);

  const totalCardPayments = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'card_payment')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [filteredTransactions]);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  // Realized Investment Profits/Losses in this period
  const realizedProfitLoss = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'investment_withdraw')
      .reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
  }, [filteredTransactions]);

  // Income Sources Breakdown Data
  const incomeData = useMemo(() => {
    const incMap: Record<string, number> = {};
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') {
        incMap[t.categoryId] = (incMap[t.categoryId] || 0) + Number(t.amount);
      }
    });

    const incCats = incomeCategories && incomeCategories.length > 0
      ? incomeCategories
      : loadIncomeCategories();

    return incCats
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        value: incMap[cat.id] || 0,
        color: cat.color,
        icon: cat.icon,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, incomeCategories]);

  // 1. CATEGORY PIE CHART DATA
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};

    filteredTransactions.forEach((t) => {
      if (t.type === 'expense') {
        catMap[t.categoryId] = (catMap[t.categoryId] || 0) + Number(t.amount);
      }
    });

    return categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        value: catMap[cat.id] || 0,
        color: cat.color,
        icon: cat.icon,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  // Top Spent Category
  const topCategory = categoryData[0] || null;

  // 2. DAILY EXPENSES BAR CHART DATA
  const dailyData = useMemo(() => {
    const dayMap: Record<string, number> = {};

    filteredTransactions.forEach((t) => {
      if (t.type === 'expense') {
        const d = new Date(t.date);
        const isoDate = d.toISOString().split('T')[0];
        dayMap[isoDate] = (dayMap[isoDate] || 0) + Number(t.amount);
      }
    });

    return Object.entries(dayMap)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, amount]) => {
        const d = new Date(date);
        const dStr = d.toLocaleDateString(undefined, {
          day: '2-digit',
          month: '2-digit',
        });
        return { date: dStr, amount };
      });
  }, [filteredTransactions]);

  // 3. PAYMENT SOURCE BREAKDOWN
  const sourceData = useMemo(() => {
    let cashTotal = 0;
    const cardTotals: Record<string, number> = {};

    filteredTransactions.forEach((t) => {
      if (t.type === 'expense') {
        if (t.sourceType === 'cash_bank') {
          cashTotal += Number(t.amount);
        } else if (t.sourceType === 'credit_card' && t.creditCardId) {
          cardTotals[t.creditCardId] = (cardTotals[t.creditCardId] || 0) + Number(t.amount);
        } else {
          cashTotal += Number(t.amount);
        }
      }
    });

    const result = [
      { name: i18n.cashBank, value: cashTotal, color: '#10b981' },
    ];

    cards.forEach((card) => {
      if (cardTotals[card.id]) {
        result.push({
          name: card.name,
          value: cardTotals[card.id],
          color: card.color.includes('emerald')
            ? '#14b8a6'
            : card.color.includes('blue')
              ? '#3b82f6'
              : '#8b5cf6',
        });
      }
    });

    return result.filter((r) => r.value > 0);
  }, [filteredTransactions, cards]);

  const handleSetQuickCustomRange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setPeriod('custom');
    setShowCustomDateModal(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 pb-8">
      {/* Period Selection Tabs */}
      <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-2xl p-1.5 flex items-center gap-1 shadow-xs transition-colors">
        {[
          { id: 'this_month', label: i18n.thisMonth },
          { id: 'last_month', label: i18n.lastMonth },
          { id: 'last_30_days', label: i18n.last30Days },
          { id: 'custom', label: i18n.custom, icon: CalendarRange },
          { id: 'all', label: i18n.allTime },
        ].map((p) => {
          const Icon = p.icon;
          const isSelected = period === p.id;

          return (
            <button
              key={p.id}
              onClick={() => {
                if (p.id === 'custom') {
                  setPeriod('custom');
                  setShowCustomDateModal(true);
                } else {
                  setPeriod(p.id as PeriodType);
                }
              }}
              className={`flex-1 py-2 px-1 text-[11px] font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${isSelected
                ? 'bg-blue-600 text-white shadow-sm font-bold scale-[1.02]'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Custom Date Range Indicator Banner */}
      {period === 'custom' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/90 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl p-3 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                {i18n.customDateAnalysis}
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-slate-100">
                {customStartDate ? new Date(customStartDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : i18n.startDate}
                {' → '}
                {customEndDate ? new Date(customEndDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : i18n.endDate}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCustomDateModal(true)}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            {i18n.change}
          </button>
        </div>
      )}

      {/* INCOME & EXPENSE BALANCE & SAVINGS ANALYSIS */}
      <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <PiggyBank className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400">
                Gelir & Gider Dengesi
              </h3>
              <p className="text-sm font-extrabold text-gray-900 dark:text-slate-100">
                {netSavings >= 0 ? 'Pozitif Nakit Akışı' : 'Bütçe Açığı'}
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1 ${
              savingsRate > 0
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <Percent className="w-3 h-3" />
            <span>%{savingsRate} Birikim</span>
          </span>
        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-3 gap-2">
          {/* Total Income */}
          <div className="bg-gray-50 dark:bg-slate-800/80 rounded-2xl p-2.5 space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              <span>{i18n.income}</span>
            </div>
            <p className="text-sm font-black text-gray-900 dark:text-slate-100 truncate">
              {formatCurrency(totalIncome)}
            </p>
          </div>

          {/* Total Expense */}
          <div className="bg-gray-50 dark:bg-slate-800/80 rounded-2xl p-2.5 space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
              <ArrowDownLeft className="w-3 h-3" />
              <span>{i18n.expense}</span>
            </div>
            <p className="text-sm font-black text-gray-900 dark:text-slate-100 truncate">
              {formatCurrency(totalExpenses)}
            </p>
          </div>

          {/* Net Savings */}
          <div className="bg-gray-50 dark:bg-slate-800/80 rounded-2xl p-2.5 space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
              <Sparkles className="w-3 h-3" />
              <span>{i18n.netSavings}</span>
            </div>
            <p
              className={`text-sm font-black truncate ${
                netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(netSavings)}
            </p>
          </div>
        </div>

        {/* Visual Progress Bar (Expense vs Savings) */}
        {totalIncome > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-rose-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (totalExpenses / totalIncome) * 100)}%` }}
                title={`Harcama: %${((totalExpenses / totalIncome) * 100).toFixed(0)}`}
              />
              {netSavings > 0 && (
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (netSavings / totalIncome) * 100)}%` }}
                  title={`Birikim: %${((netSavings / totalIncome) * 100).toFixed(0)}`}
                />
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-slate-500 font-semibold px-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                Harcama (%{((totalExpenses / totalIncome) * 100).toFixed(0)})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Birikim (%{savingsRate})
              </span>
            </div>
          </div>
        )}

        {/* Realized Profit / Loss Banner if present */}
        {realizedProfitLoss !== 0 && (
          <div className="p-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-slate-300 font-medium">Yatırım Realize Kâr/Zarar:</span>
            <span
              className={`font-black ${
                realizedProfitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {realizedProfitLoss >= 0 ? `+${formatCurrency(realizedProfitLoss)}` : formatCurrency(realizedProfitLoss)}
            </span>
          </div>
        )}

        {/* Income Sources Breakdown if income exists */}
        {incomeData.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              Gelir Kaynakları Dağılımı
            </span>
            <div className="grid grid-cols-2 gap-2">
              {incomeData.map((inc) => (
                <div
                  key={inc.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 dark:bg-slate-800/60 border border-gray-200/60 dark:border-slate-750"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] shrink-0"
                      style={{ backgroundColor: inc.color }}
                    >
                      <CategoryIcon name={inc.icon} size={11} />
                    </div>
                    <span className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">
                      {inc.name}
                    </span>
                  </div>
                  <span className="text-xs font-black text-gray-900 dark:text-slate-100 shrink-0 pl-1">
                    {formatCurrency(inc.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-4 space-y-1 shadow-sm transition-colors">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-medium">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{i18n.totalExpense}</span>
          </div>
          <p className="text-xl font-extrabold text-gray-900 dark:text-slate-100">{formatCurrency(totalExpenses)}</p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">{filteredTransactions.length} {i18n.transactionsCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-4 space-y-1 shadow-sm transition-colors">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-medium">
            <CardIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{i18n.paidCardDebt}</span>
          </div>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalCardPayments)}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">{i18n.cardClosingPayments}</p>
        </div>
      </div>

      {/* Top Category Highlight */}
      {topCategory && (
        <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-4 flex items-center justify-between shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: topCategory.color }}
            >
              <CategoryIcon name={topCategory.icon} size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                {i18n.topCategory}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{topCategory.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base font-extrabold text-gray-900 dark:text-slate-100">
              {formatCurrency(topCategory.value)}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-medium">
              %{totalExpenses > 0 ? ((topCategory.value / totalExpenses) * 100).toFixed(1) : 0} {i18n.share}
            </p>
          </div>
        </div>
      )}

      {/* 1. CATEGORY BREAKDOWN DONUT CHART */}
      <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-5 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ChartIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100">{i18n.categoryDistribution}</h3>
          </div>
          <span className="text-xs text-gray-400 dark:text-slate-400 font-mono">
            {categoryData.length} {i18n.category}
          </span>
        </div>

        {categoryData.length === 0 ? (
          <p className="text-center text-xs text-gray-400 dark:text-slate-500 py-8">
            {i18n.noExpenseInPeriod}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number, name: string, props: any) => [formatCurrency(val), props.payload.name]}
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#f3f4f6',
                      borderRadius: '12px',
                      color: isDarkMode ? '#f8fafc' : '#111827',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category breakdown table */}
            <div className="space-y-2 border-t border-gray-100 dark:border-slate-800 pt-3">
              {categoryData.map((cat) => {
                const percent = ((cat.value / totalExpenses) * 100).toFixed(1);

                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-gray-800 dark:text-slate-200 font-medium">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 dark:text-slate-400 font-mono">%{percent}</span>
                        <span className="font-bold text-gray-900 dark:text-slate-100">{formatCurrency(cat.value)}</span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. DAILY SPENDING BAR CHART */}
      {dailyData.length > 0 && (
        <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-5 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100">{i18n.dailyExpenseTrend}</h3>
            </div>
          </div>

          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke={isDarkMode ? '#64748b' : '#9ca3af'} fontSize={10} tickLine={false} />
                <YAxis stroke={isDarkMode ? '#64748b' : '#9ca3af'} fontSize={10} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => [formatCurrency(val), i18n.expense]}
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    borderColor: isDarkMode ? '#334155' : '#f3f4f6',
                    borderRadius: '12px',
                    color: isDarkMode ? '#f8fafc' : '#111827',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 2.5 HISTORY BUTTON & LIST */}
      <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-5 shadow-sm space-y-4 transition-colors">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between text-sm font-bold text-gray-900 dark:text-slate-100 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{i18n.showHistory}</span>
          </div>
          <span className="text-gray-400 dark:text-slate-500">{showHistory ? i18n.hideDetails : i18n.showDetails}</span>
        </button>
        
        {showHistory && (
          <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-slate-800">
            {filteredTransactions.length === 0 ? (
              <p className="text-center text-xs text-gray-400 dark:text-slate-500 py-4">{i18n.noTransactionFound}</p>
            ) : (
              [...filteredTransactions]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((t) => {
                  const cat = categories.find(c => c.id === t.categoryId) || { name: i18n.unknown, color: '#9ca3af', icon: 'HelpCircle' };
                  return (
                    <div key={t.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-gray-100 dark:border-slate-750">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: cat.color }}>
                          <CategoryIcon name={cat.icon} size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-slate-100">{cat.name}</p>
                          <p className="text-[10px] text-gray-500 dark:text-slate-400">{formatShortDate(t.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold ${t.type === 'expense' ? 'text-gray-900 dark:text-slate-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                        </p>
                        {t.description && <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate w-20">{t.description}</p>}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>

      {/* 3. PAYMENT METHOD BREAKDOWN */}
      {sourceData.length > 0 && (
        <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-5 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100">{i18n.paymentSourceDistribution}</h3>
            </div>
          </div>

          <div className="space-y-3">
            {sourceData.map((item, idx) => {
              const percent = ((item.value / totalExpenses) * 100).toFixed(1);
              return (
                <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-gray-100 dark:border-slate-750">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-gray-800 dark:text-slate-200">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-slate-100">{formatCurrency(item.value)}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-400 font-mono">%{percent}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CUSTOM DATE RANGE PICKER MODAL */}
      {showCustomDateModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-md p-5 shadow-2xl text-gray-900 dark:text-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <CalendarRange className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100">{i18n.selectCustomDateRange}</h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">{i18n.expenseAnalysisBetweenDates}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomDateModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {i18n.startDate}
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs font-semibold text-gray-800 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {i18n.endDate}
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs font-semibold text-gray-800 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>


            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setPeriod('custom');
                  setShowCustomDateModal(false);
                }}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-200 dark:shadow-none transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{i18n.showAnalysis}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCustomDateModal(false)}
                className="py-3 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-semibold text-xs rounded-2xl transition-colors cursor-pointer"
              >
                {i18n.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
