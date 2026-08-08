import React, { useState, useMemo } from 'react';
import { Category, CreditCard, Transaction } from '../types';
import { formatTL } from '../utils/storage';
import { CategoryIcon } from './CategoryIcon';
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
  Legend,
} from 'recharts';
import { PieChart as ChartIcon, Calendar, TrendingUp, CreditCard as CardIcon, Wallet, Layers, Award } from 'lucide-react';

interface ReportsViewProps {
  categories: Category[];
  cards: CreditCard[];
  transactions: Transaction[];
}

type PeriodType = 'this_month' | 'last_month' | 'last_30_days' | 'all';

export const ReportsView: React.FC<ReportsViewProps> = ({
  categories,
  cards,
  transactions,
}) => {
  const [period, setPeriod] = useState<PeriodType>('this_month');

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
      }
      return true; // 'all'
    });
  }, [transactions, period]);

  // Total Expenses & Payments
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
        const dStr = new Date(t.date).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
        });
        dayMap[dStr] = (dayMap[dStr] || 0) + Number(t.amount);
      }
    });

    return Object.entries(dayMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => {
        const [d1, m1] = a.date.split('.').map(Number);
        const [d2, m2] = b.date.split('.').map(Number);
        return m1 === m2 ? d1 - d2 : m1 - m2;
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
        }
      }
    });

    const result = [
      { name: 'Nakit / Banka', value: cashTotal, color: '#10b981' },
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

  return (
    <div className="w-full max-w-lg mx-auto space-y-5 pb-8">
      {/* Period Selection Tabs */}
      <div className="bg-white border border-gray-100 rounded-2xl p-1.5 flex items-center gap-1 shadow-xs">
        {[
          { id: 'this_month', label: 'Bu Ay' },
          { id: 'last_month', label: 'Geçen Ay' },
          { id: 'last_30_days', label: 'Son 30 Gün' },
          { id: 'all', label: 'Tüm Zamanlar' },
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id as PeriodType)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              period === p.id
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-100 rounded-3xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Toplam Harcama</span>
          </div>
          <p className="text-xl font-extrabold text-gray-900">{formatTL(totalExpenses)}</p>
          <p className="text-[10px] text-gray-400">{filteredTransactions.length} işlem kaydı</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-4 space-y-1 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <CardIcon className="w-4 h-4 text-emerald-600" />
            <span>Ödenen Kart Borcu</span>
          </div>
          <p className="text-xl font-extrabold text-emerald-600">
            {formatTL(totalCardPayments)}
          </p>
          <p className="text-[10px] text-gray-400">Kart kapatma ödemeleri</p>
        </div>
      </div>

      {/* Top Category Highlight */}
      {topCategory && (
        <div className="bg-white border border-gray-100 rounded-3xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: topCategory.color }}
            >
              <CategoryIcon name={topCategory.icon} size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                Lider Harcama Kategorisi
              </p>
              <p className="text-sm font-bold text-gray-900">{topCategory.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base font-extrabold text-gray-900">
              {formatTL(topCategory.value)}
            </p>
            <p className="text-[10px] text-gray-400 font-medium">
              %{totalExpenses > 0 ? ((topCategory.value / totalExpenses) * 100).toFixed(1) : 0} payı
            </p>
          </div>
        </div>
      )}

      {/* 1. CATEGORY BREAKDOWN DONUT CHART */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <ChartIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-gray-900">Kategori Dağılımı</h3>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {categoryData.length} Kategori
          </span>
        </div>

        {categoryData.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-8">
            Seçilen dönemde harcama bulunmuyor.
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
                    formatter={(val: number) => [formatTL(val), 'Harcama']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#f3f4f6',
                      borderRadius: '12px',
                      color: '#111827',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category breakdown table */}
            <div className="space-y-2 border-t border-gray-100 pt-3">
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
                        <span className="text-gray-800 font-medium">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-mono">%{percent}</span>
                        <span className="font-bold text-gray-900">{formatTL(cat.value)}</span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
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
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-gray-900">Günlük Harcama Trendi</h3>
            </div>
          </div>

          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => [formatTL(val), 'Harcama']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#f3f4f6',
                    borderRadius: '12px',
                    color: '#111827',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                />
                <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 3. PAYMENT METHOD BREAKDOWN */}
      {sourceData.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-gray-900">Ödeme Kaynağı Dağılımı</h3>
            </div>
          </div>

          <div className="space-y-3">
            {sourceData.map((item, idx) => {
              const percent = ((item.value / totalExpenses) * 100).toFixed(1);
              return (
                <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-gray-800">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatTL(item.value)}</p>
                    <p className="text-[10px] text-gray-400 font-mono">%{percent}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
