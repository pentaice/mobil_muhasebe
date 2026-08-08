import React from 'react';
import { Zap, CreditCard, PieChart, History, Grid } from 'lucide-react';
import { motion } from 'motion/react';

export type ActiveTab = 'add' | 'cards' | 'reports' | 'history' | 'categories';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'add', label: 'Hızlı Ekle', icon: Zap, isAccent: true },
    { id: 'cards', label: 'Kartlarım', icon: CreditCard },
    { id: 'reports', label: 'Raporlar', icon: PieChart },
    { id: 'history', label: 'Geçmiş', icon: History },
    { id: 'categories', label: 'Kategoriler', icon: Grid },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 px-2 py-2 max-w-lg mx-auto shadow-sm">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isAccent) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`relative flex flex-col items-center justify-center -mt-5 transition-transform active:scale-95 cursor-pointer ${
                  isActive ? 'scale-105' : ''
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-blue-300'
                      : 'bg-blue-600 text-white shadow-blue-200'
                  }`}
                >
                  <Icon className="w-6 h-6 fill-current" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 mt-1">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium">{tab.label}</span>

              {isActive && (
                <motion.span
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 w-1 h-1 rounded-full bg-blue-600"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
