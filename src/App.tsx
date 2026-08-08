import React, { useState, useEffect } from 'react';
import { Category, CreditCard, Transaction } from './types';
import {
  loadCategories,
  saveCategories,
  loadCards,
  saveCards,
  loadTransactions,
  saveTransactions,
  resetAllData,
} from './utils/storage';
import { DEFAULT_CATEGORIES, DEFAULT_CREDIT_CARDS, INITIAL_TRANSACTIONS } from './data/initialData';
import { Header } from './components/Header';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { QuickAddExpense } from './components/QuickAddExpense';
import { CreditCardsView } from './components/CreditCardsView';
import { CategoriesView } from './components/CategoriesView';
import { ReportsView } from './components/ReportsView';
import { TransactionsView } from './components/TransactionsView';
import { Toast, ToastState } from './components/Toast';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [categories, setCategories] = useState<Category[]>(() => loadCategories());
  const [cards, setCards] = useState<CreditCard[]>(() => loadCards());
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [activeTab, setActiveTab] = useState<ActiveTab>('add');
  const [toast, setToast] = useState<ToastState | null>(null);

  // Helper to trigger 2-second toast notifications
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({
      message,
      type,
      id: Date.now(),
    });
  };

  // Sync to LocalStorage
  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveCards(cards);
  }, [cards]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  // Handlers
  const handleAddTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);

    if (txData.type === 'card_payment') {
      showToast('Kredi kartı ödemesi başarıyla kaydedildi!', 'success');
    } else {
      showToast('Harcama kaydı eklendi!', 'success');
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Harcama kaydı silindi.', 'info');
  };

  const handleAddCategory = (catData: Omit<Category, 'id' | 'isCustom'>) => {
    const newCat: Category = {
      ...catData,
      id: `cat-custom-${Date.now()}`,
      isCustom: true,
    };
    setCategories((prev) => [...prev, newCat]);
    showToast('Yeni kategori oluşturuldu!', 'success');
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    showToast('Kategori silindi.', 'info');
  };

  const handleAddCard = (cardData: Omit<CreditCard, 'id'>) => {
    const newCard: CreditCard = {
      ...cardData,
      id: `card-${Date.now()}`,
    };
    setCards((prev) => [...prev, newCard]);
    showToast('Yeni kredi kartı eklendi!', 'success');
  };

  const handleDeleteCard = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    showToast('Kredi kartı silindi.', 'info');
  };

  // Export / Import Data
  const handleExportData = () => {
    const backupObj = {
      categories,
      cards,
      transactions,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `butcem-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonString: string) => {
    const parsed = JSON.parse(jsonString);
    if (parsed.categories && Array.isArray(parsed.categories)) {
      setCategories(parsed.categories);
    }
    if (parsed.cards && Array.isArray(parsed.cards)) {
      setCards(parsed.cards);
    }
    if (parsed.transactions && Array.isArray(parsed.transactions)) {
      setTransactions(parsed.transactions);
    }
  };

  const handleResetData = () => {
    resetAllData();
    setCategories(DEFAULT_CATEGORIES);
    setCards(DEFAULT_CREDIT_CARDS);
    setTransactions(INITIAL_TRANSACTIONS);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Floating 2-second Toast Popup Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Mobile Shell Wrapper - Clean Minimalism design */}
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative bg-gray-50 border-x border-gray-200/80 shadow-xl">
        {/* Top Header */}
        <Header
          transactions={transactions}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onResetData={handleResetData}
          onShowToast={showToast}
        />

        {/* Main Body View */}
        <main className="flex-1 px-4 pt-4 pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'add' && (
                <QuickAddExpense
                  categories={categories}
                  cards={cards}
                  onAddTransaction={handleAddTransaction}
                  onOpenAddCategoryModal={() => setActiveTab('categories')}
                />
              )}

              {activeTab === 'cards' && (
                <CreditCardsView
                  cards={cards}
                  transactions={transactions}
                  onAddCard={handleAddCard}
                  onDeleteCard={handleDeleteCard}
                  onAddPayment={handleAddTransaction}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  categories={categories}
                  cards={cards}
                  transactions={transactions}
                />
              )}

              {activeTab === 'history' && (
                <TransactionsView
                  categories={categories}
                  cards={cards}
                  transactions={transactions}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              )}

              {activeTab === 'categories' && (
                <CategoriesView
                  categories={categories}
                  transactions={transactions}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Tab Bar */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
