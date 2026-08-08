import React, { useState } from 'react';
import { Category, Transaction } from '../types';
import { CategoryIcon, AVAILABLE_ICONS } from './CategoryIcon';
import { formatTL } from '../utils/storage';
import { Plus, Trash2, Tag, X, Sparkles } from 'lucide-react';

interface CategoriesViewProps {
  categories: Category[];
  transactions: Transaction[];
  onAddCategory: (category: Omit<Category, 'id' | 'isCustom'>) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const COLOR_PALETTE = [
  '#f97316', // Orange
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  transactions,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState<string>('Sparkles');
  const [selectedColor, setSelectedColor] = useState<string>(COLOR_PALETTE[0]);

  // Calculate total spent per category
  const categoryTotals: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.type === 'expense') {
      categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + Number(t.amount);
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    onAddCategory({
      name: newCatName.trim(),
      icon: selectedIcon,
      color: selectedColor,
    });

    setNewCatName('');
    setShowAddModal(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-5 pb-8">
      {/* Header Banner */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm text-gray-900 flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="font-bold text-lg text-gray-900">Kategoriler</h2>
          <p className="text-xs text-gray-500">
            {categories.length} Kategori tanımlı (Varsayılan & Özel)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-2xl flex items-center gap-1.5 shadow-md shadow-blue-200 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Kategori</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat) => {
          const totalSpent = categoryTotals[cat.id] || 0;

          return (
            <div
              key={cat.id}
              className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:border-gray-200 transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: cat.color }}
                >
                  <CategoryIcon name={cat.icon} size={22} />
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-gray-900">{cat.name}</p>
                    {cat.isCustom && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.2 rounded-md border border-blue-200">
                        Özel
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    Toplam: {formatTL(totalSpent)}
                  </p>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => onDeleteCategory(cat.id)}
                title="Kategoriyi Sil"
                className="text-gray-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Custom Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-3xl w-full max-w-md p-6 shadow-2xl text-gray-900 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-gray-900">Yeni Kategori Ekle</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Category Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Kategori Adı
                </label>
                <input
                  type="text"
                  placeholder="Örn: Spor & Fitness, Ev Kirası, Evcil Hayvan"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 rounded-2xl py-2.5 px-3 text-xs text-gray-800 focus:outline-none"
                />
              </div>

              {/* Color Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Renk Seçin
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        selectedColor === color
                          ? 'ring-2 ring-gray-900 scale-110 shadow-sm'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Simge Seçin
                </label>
                <div className="grid grid-cols-7 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-200 max-h-40 overflow-y-auto">
                  {AVAILABLE_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        selectedIcon === iconName
                          ? 'bg-blue-600 text-white font-bold scale-105 shadow-xs'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60'
                      }`}
                    >
                      <CategoryIcon name={iconName} size={18} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                  newCatName.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Kategoriyi Oluştur</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
