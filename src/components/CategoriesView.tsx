import React, { useState } from 'react';
import { Category, Transaction } from '../types';
import { CategoryIcon, AVAILABLE_ICONS } from './CategoryIcon';
import { formatTL } from '../utils/storage';
import {
  Plus,
  Trash2,
  Tag,
  X,
  Moon,
  Sun,
  Edit2,
  ChevronUp,
  ChevronDown,
  ArrowRightLeft,
  ShieldAlert,
  AlertTriangle,
  FolderSync,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CategoriesViewProps {
  categories: Category[];
  transactions: Transaction[];
  onAddCategory: (category: Omit<Category, 'id' | 'isCustom'>) => void;
  onUpdateCategory: (category: Category) => void;
  onReorderCategories: (newCategories: Category[]) => void;
  onDeleteCategoryWithOptions: (
    categoryId: string,
    action: 'reassign_diger' | 'reassign_custom' | 'purge_all',
    targetCatId?: string
  ) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
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
  '#84cc16', // Lime
  '#d946ef', // Fuchsia
  '#0284c7', // Sky
];

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  transactions,
  onAddCategory,
  onUpdateCategory,
  onReorderCategories,
  onDeleteCategoryWithOptions,
  isDarkMode,
  onToggleTheme,
}) => {
  // Add modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState<string>('Sparkles');
  const [selectedColor, setSelectedColor] = useState<string>(COLOR_PALETTE[0]);

  // Edit modal state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editIcon, setEditIcon] = useState<string>('');
  const [editColor, setEditColor] = useState<string>('');

  // Delete modal state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteMode, setDeleteMode] = useState<'menu' | 'select_target' | 'confirm_purge'>('menu');
  const [selectedTargetCatId, setSelectedTargetCatId] = useState<string>('');

  // Calculate total spent and transaction count per category
  const categoryTotals: Record<string, { total: number; count: number }> = {};
  transactions.forEach((t) => {
    if (t.type === 'expense') {
      if (!categoryTotals[t.categoryId]) {
        categoryTotals[t.categoryId] = { total: 0, count: 0 };
      }
      categoryTotals[t.categoryId].total += Number(t.amount);
      categoryTotals[t.categoryId].count += 1;
    }
  });

  // Handle Add Submit
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

  // Open Edit Modal
  const handleStartEdit = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditIcon(cat.icon);
    setEditColor(cat.color);
  };

  // Save Edited Category
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editName.trim()) return;

    onUpdateCategory({
      ...editingCategory,
      name: editName.trim(),
      icon: editIcon,
      color: editColor,
    });

    setEditingCategory(null);
  };

  // Move Category Up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newCats = [...categories];
    const temp = newCats[index - 1];
    newCats[index - 1] = newCats[index];
    newCats[index] = temp;
    onReorderCategories(newCats);
  };

  // Move Category Down
  const handleMoveDown = (index: number) => {
    if (index >= categories.length - 1) return;
    const newCats = [...categories];
    const temp = newCats[index + 1];
    newCats[index + 1] = newCats[index];
    newCats[index] = temp;
    onReorderCategories(newCats);
  };

  // Start Delete Flow
  const handleClickDelete = (cat: Category) => {
    if (cat.id === 'cat-diger') return; // Cannot delete Diğer

    const info = categoryTotals[cat.id];
    if (info && info.count > 0) {
      setCategoryToDelete(cat);
      setDeleteMode('menu');
      // Set default target category (other than this one)
      const otherCat = categories.find((c) => c.id !== cat.id);
      if (otherCat) setSelectedTargetCatId(otherCat.id);
    } else {
      // 0 transactions -> directly delete
      onDeleteCategoryWithOptions(cat.id, 'reassign_diger');
    }
  };

  // Option 1: Reassign to Diğer and delete
  const handleExecuteReassignDiger = () => {
    if (!categoryToDelete) return;
    onDeleteCategoryWithOptions(categoryToDelete.id, 'reassign_diger');
    setCategoryToDelete(null);
  };

  // Option 2: Reassign to user-selected category and delete
  const handleExecuteReassignCustom = () => {
    if (!categoryToDelete || !selectedTargetCatId) return;
    onDeleteCategoryWithOptions(categoryToDelete.id, 'reassign_custom', selectedTargetCatId);
    setCategoryToDelete(null);
  };

  // Option 3: Confirmed purge all transactions and delete
  const handleExecutePurgeAll = () => {
    if (!categoryToDelete) return;
    onDeleteCategoryWithOptions(categoryToDelete.id, 'purge_all');
    setCategoryToDelete(null);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 pb-8">
      {/* THEME & APPEARANCE CARD */}
      <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-4 shadow-sm text-gray-900 dark:text-slate-100 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-slate-700 flex items-center justify-center font-bold">
              {isDarkMode ? (
                <Moon className="w-5 h-5 fill-current text-indigo-400" />
              ) : (
                <Sun className="w-5 h-5 fill-current text-amber-500" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-slate-100">
                Uygulama Teması
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {isDarkMode ? '🌙 Koyu (Karanlık) Mod Aktif' : '☀️ Açık Mod Aktif'}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={`relative w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer shadow-inner ${
              isDarkMode ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-[10px] ${
                isDarkMode ? 'translate-x-6 text-indigo-900' : 'translate-x-0 text-amber-600'
              }`}
            >
              {isDarkMode ? <Moon className="w-3.5 h-3.5 fill-current" /> : <Sun className="w-3.5 h-3.5 fill-current" />}
            </motion.div>
          </button>
        </div>
      </div>

      {/* Header Banner for Categories */}
      <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-5 shadow-sm text-gray-900 dark:text-slate-100 flex items-center justify-between transition-colors">
        <div className="space-y-0.5">
          <h2 className="font-bold text-lg text-gray-900 dark:text-slate-100">Kategoriler</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {categories.length} Kategori tanımlı • Oklarla sırasını değiştirin
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-2xl flex items-center gap-1.5 shadow-md shadow-blue-200 dark:shadow-none transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Kategori</span>
        </button>
      </div>

      {/* Categories List with Edit & Reorder support */}
      <div className="space-y-2.5">
        {categories.map((cat, index) => {
          const catInfo = categoryTotals[cat.id] || { total: 0, count: 0 };
          const isDiger = cat.id === 'cat-diger';
          const isFirst = index === 0;
          const isLast = index === categories.length - 1;

          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-2xl p-3.5 flex items-center justify-between shadow-xs hover:border-gray-200 dark:hover:border-slate-700 transition-all gap-2"
            >
              {/* Left: Reorder Up/Down buttons */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  disabled={isFirst}
                  onClick={() => handleMoveUp(index)}
                  title="Yukarı Taşı"
                  className={`p-1 rounded-lg transition-colors ${
                    isFirst
                      ? 'text-gray-300 dark:text-slate-700 cursor-not-allowed opacity-30'
                      : 'text-gray-400 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-blue-600 cursor-pointer active:scale-90'
                  }`}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isLast}
                  onClick={() => handleMoveDown(index)}
                  title="Aşağı Taşı"
                  className={`p-1 rounded-lg transition-colors ${
                    isLast
                      ? 'text-gray-300 dark:text-slate-700 cursor-not-allowed opacity-30'
                      : 'text-gray-400 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-blue-600 cursor-pointer active:scale-90'
                  }`}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Middle: Icon, Name & Spending Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                  style={{ backgroundColor: cat.color }}
                >
                  <CategoryIcon name={cat.icon} size={20} />
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-sm text-gray-900 dark:text-slate-100 truncate">{cat.name}</p>
                    {cat.isCustom && (
                      <span className="text-[9px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold px-1.5 py-0.2 rounded-md border border-blue-200 dark:border-blue-800 shrink-0">
                        Özel
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium truncate">
                    Toplam: {formatTL(catInfo.total)} ({catInfo.count} işlem)
                  </p>
                </div>
              </div>

              {/* Right: Edit & Delete Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Edit Button (Available for ALL categories) */}
                <button
                  type="button"
                  onClick={() => handleStartEdit(cat)}
                  title="Kategoriyi Düzenle (İsim, Renk, Simge)"
                  className="text-gray-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer active:scale-95"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                {!isDiger ? (
                  <button
                    type="button"
                    onClick={() => handleClickDelete(cat)}
                    title="Kategoriyi Sil"
                    className="text-gray-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 px-1 font-medium">
                    Sabit
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT CATEGORY MODAL (Name, Color, Icon) */}
      <AnimatePresence>
        {editingCategory && (
          <div className="fixed inset-0 z-50 bg-gray-900/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-md p-6 shadow-2xl text-gray-900 dark:text-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-2xl text-white flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: editColor || '#3b82f6' }}
                  >
                    <CategoryIcon name={editIcon || 'Tag'} size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-slate-100">Kategoriyi Düzenle</h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">İsim, simge ve renk paletini güncelleyin</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingCategory(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                {/* Category Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                    Kategori Adı
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-2xl py-2.5 px-3 text-xs text-gray-800 dark:text-slate-100 focus:outline-none font-medium"
                  />
                </div>

                {/* Color Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                    Renk Seçin
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditColor(color)}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                          editColor === color
                            ? 'ring-2 ring-blue-600 scale-110 shadow-sm'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Icon Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                    Simge Seçin
                  </label>
                  <div className="grid grid-cols-7 gap-2 bg-gray-50 dark:bg-slate-800 p-3 rounded-2xl border border-gray-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                    {AVAILABLE_ICONS.map((iconName) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setEditIcon(iconName)}
                        className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          editIcon === iconName
                            ? 'bg-blue-600 text-white font-bold scale-105 shadow-xs'
                            : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-200/60 dark:hover:bg-slate-700'
                        }`}
                      >
                        <CategoryIcon name={iconName} size={18} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={!editName.trim()}
                  className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                    editName.trim()
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none cursor-pointer active:scale-98'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Değişiklikleri Kaydet</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3-CHOICE CATEGORY DELETION MODAL */}
      <AnimatePresence>
        {categoryToDelete && (
          <div className="fixed inset-0 z-50 bg-gray-900/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-md p-6 shadow-2xl text-gray-900 dark:text-slate-100 space-y-4"
            >
              {/* STAGE 1: Main 3 Choices */}
              {deleteMode === 'menu' && (
                <>
                  <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-gray-900 dark:text-slate-100">
                        "{categoryToDelete.name}" Siliniyor
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Bu kategoriye ait harcamalar için tercih seçin
                      </p>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-amber-50/80 dark:bg-slate-800/80 border border-amber-200/80 dark:border-slate-700 rounded-2xl p-3 text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-gray-800 dark:text-slate-200">
                      <span>Mevcut Harcama Sayısı:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {categoryTotals[categoryToDelete.id]?.count || 0} adet işlem
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-gray-800 dark:text-slate-200">
                      <span>Toplam Harcama Tutarı:</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">
                        {formatTL(categoryTotals[categoryToDelete.id]?.total || 0)}
                      </span>
                    </div>
                  </div>

                  {/* 3 Explicit Choices */}
                  <div className="space-y-2.5 pt-1">
                    {/* Choice 1: Reassign to Diğer */}
                    <button
                      type="button"
                      onClick={handleExecuteReassignDiger}
                      className="w-full p-3.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100/80 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/80 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-3 shadow-2xs active:scale-98"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <ArrowRightLeft className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-blue-900 dark:text-blue-200">
                          1. Harcamaları "Diğer"e Aktar & Sil
                        </p>
                        <p className="text-[11px] text-blue-700 dark:text-blue-400">
                          Harcamalarınız kaybolmaz, "Diğer" kategorisine taşınır.
                        </p>
                      </div>
                    </button>

                    {/* Choice 2: Reassign to Custom Category (Select) */}
                    <button
                      type="button"
                      onClick={() => setDeleteMode('select_target')}
                      className="w-full p-3.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-3 shadow-2xs active:scale-98"
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <FolderSync className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-indigo-900 dark:text-indigo-200">
                          2. Harcamalarımı Başka Kategoriye Aktar ("Seç")
                        </p>
                        <p className="text-[11px] text-indigo-700 dark:text-indigo-400">
                          Harcamaları taşımak istediğiniz hedef kategoriyi seçin.
                        </p>
                      </div>
                    </button>

                    {/* Choice 3: Purge all transactions with confirmation */}
                    <button
                      type="button"
                      onClick={() => setDeleteMode('confirm_purge')}
                      className="w-full p-3.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-3 shadow-2xs active:scale-98"
                    >
                      <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-rose-900 dark:text-rose-200">
                          3. Kategoriyle Birlikte Tüm Harcamalarımı Sil
                        </p>
                        <p className="text-[11px] text-rose-700 dark:text-rose-400">
                          Bu kategorideki tüm işlemler kalıcı olarak silinir.
                        </p>
                      </div>
                    </button>

                    {/* Cancel Button */}
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete(null)}
                      className="w-full p-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-2xl font-semibold text-xs transition-colors cursor-pointer mt-1"
                    >
                      Vazgeç
                    </button>
                  </div>
                </>
              )}

              {/* STAGE 2: Select Target Category for Choice 2 */}
              {deleteMode === 'select_target' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <FolderSync className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100">
                        Hedef Kategoriyi Seçin
                      </h3>
                    </div>
                    <button
                      onClick={() => setDeleteMode('menu')}
                      className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"
                    >
                      Geri
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    <strong>"{categoryToDelete.name}"</strong> kategorisindeki {categoryTotals[categoryToDelete.id]?.count || 0} adet harcama hangi kategoriye aktarılsın?
                  </p>

                  {/* Target Category Picker */}
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {categories
                      .filter((c) => c.id !== categoryToDelete.id)
                      .map((cat) => {
                        const isSelected = selectedTargetCatId === cat.id;

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedTargetCatId(cat.id)}
                            className={`w-full p-2.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 dark:border-indigo-500 font-bold shadow-xs'
                                : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs"
                                style={{ backgroundColor: cat.color }}
                              >
                                <CategoryIcon name={cat.icon} size={14} />
                              </div>
                              <span className="text-xs text-gray-800 dark:text-slate-200">{cat.name}</span>
                            </div>

                            {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                          </button>
                        );
                      })}
                  </div>

                  {/* Confirm transfer & delete */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={!selectedTargetCatId}
                      onClick={handleExecuteReassignCustom}
                      className="flex-1 py-3 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-sm"
                    >
                      Aktar ve Kategoriyi Sil
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteMode('menu')}
                      className="py-3 px-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold text-xs rounded-2xl transition-colors cursor-pointer"
                    >
                      Geri
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE 3: "Emin misiniz?" Warning for Choice 3 */}
              {deleteMode === 'confirm_purge' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-rose-100 dark:border-rose-900/40 pb-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-rose-900 dark:text-rose-200">
                        Kesinlikle Emin misiniz?
                      </h3>
                      <p className="text-xs text-rose-700 dark:text-rose-400">
                        Geri alınamaz silme işlemi
                      </p>
                    </div>
                  </div>

                  <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 space-y-2 text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
                    <p className="font-bold">
                      ⚠️ Bu işlem sonucunda:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-rose-800 dark:text-rose-300">
                      <li>
                        <strong>"{categoryToDelete.name}"</strong> kategorisi silinecek.
                      </li>
                      <li>
                        Bu kategoriye bağlı <strong>{categoryTotals[categoryToDelete.id]?.count || 0} adet harcama kaydı ({formatTL(categoryTotals[categoryToDelete.id]?.total || 0)})</strong> kalıcı olarak silinecek.
                      </li>
                      <li>Toplam harcama tutarınız bu miktar kadar azalacaktır.</li>
                    </ul>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleExecutePurgeAll}
                      className="flex-1 py-3 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-md shadow-rose-200 dark:shadow-none"
                    >
                      Evet, Hepsini Kalıcı Olarak Sil
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteMode('menu')}
                      className="py-3 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-semibold text-xs rounded-2xl transition-colors cursor-pointer"
                    >
                      Vazgeç / Geri Dön
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD CUSTOM CATEGORY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-md p-6 shadow-2xl text-gray-900 dark:text-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-gray-900 dark:text-slate-100">Yeni Kategori Ekle</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Category Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                  Kategori Adı
                </label>
                <input
                  type="text"
                  placeholder="Örn: Spor & Fitness, Ev Kirası, Evcil Hayvan"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-2xl py-2.5 px-3 text-xs text-gray-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              {/* Color Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
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
                          ? 'ring-2 ring-blue-600 scale-110 shadow-sm'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                  Simge Seçin
                </label>
                <div className="grid grid-cols-7 gap-2 bg-gray-50 dark:bg-slate-800 p-3 rounded-2xl border border-gray-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                  {AVAILABLE_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        selectedIcon === iconName
                          ? 'bg-blue-600 text-white font-bold scale-105 shadow-xs'
                          : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-200/60 dark:hover:bg-slate-700'
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
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none cursor-pointer'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed'
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
