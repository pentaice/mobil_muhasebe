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
  loadTheme,
  saveTheme,
  loadNotificationSettings,
  saveNotificationSettings,
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
import { useI18n } from './i18n/I18nContext';

export default function App() {
  const { t: i18n } = useI18n();
  const [categories, setCategories] = useState<Category[]>(() => loadCategories());
  const [cards, setCards] = useState<CreditCard[]>(() => loadCards());
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [activeTab, setActiveTab] = useState<ActiveTab>('add');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => loadTheme() === 'dark');
  const [quickAddFocusTrigger, setQuickAddFocusTrigger] = useState<number>(0);

  // Toggle Dark Mode
  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      saveTheme(next ? 'dark' : 'light');
      return next;
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

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

  // Notifications Scheduler
  useEffect(() => {
    const checkNotifications = () => {
      const settings = loadNotificationSettings();
      if (!settings.enabled || !('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHour}:${currentMinute}`;
      
      const [h, m] = settings.time.split(':').map(Number);
      const time2Hour = (h + 12) % 24;
      const time2Str = `${time2Hour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      
      if (currentTimeStr === settings.time || (settings.frequency === 'twice_daily' && currentTimeStr === time2Str)) {
        let shouldNotify = false;
        
        if (!settings.lastNotified) {
          shouldNotify = true;
        } else {
          const lastDate = new Date(settings.lastNotified);
          
          if (settings.frequency === 'twice_daily') {
             const hoursDiff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
             if (hoursDiff >= 11) shouldNotify = true; // Minimum 11 hours apart to avoid double triggers
          } else if (settings.frequency === 'daily') {
            if (now.toDateString() !== lastDate.toDateString()) shouldNotify = true;
          } else if (settings.frequency === 'weekly') {
            const daysDiff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff >= 7) shouldNotify = true;
          } else if (settings.frequency === 'monthly') {
            if (now.getMonth() !== lastDate.getMonth() || now.getFullYear() !== lastDate.getFullYear()) {
              shouldNotify = true;
            }
          }
        }
        
        if (shouldNotify) {
          new Notification('Bütçem', {
            body: 'Bugünkü harcamalarınızı veya işlemlerinizi kaydettiniz mi?',
            icon: '/icons/icon-192x192.png'
          });
          
          saveNotificationSettings({
            ...settings,
            lastNotified: now.toISOString()
          });
        }
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleAddTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);

    if (txData.type === 'card_payment') {
      showToast(i18n.toastCardPaymentAdded, 'success');
    } else {
      showToast(i18n.toastExpenseAdded, 'success');
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast(i18n.toastExpenseDeleted, 'info');
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
    showToast(i18n.toastExpenseUpdated, 'success');
  };

  const handleAddCategory = (catData: Omit<Category, 'id' | 'isCustom'>) => {
    const newCat: Category = {
      ...catData,
      id: `cat-custom-${Date.now()}`,
      isCustom: true,
    };
    setCategories((prev) => [...prev, newCat]);
    showToast(`"${catData.name}" ${i18n.toastCategoryCreated}`, 'success');
  };

  const handleUpdateCategory = (updatedCat: Category) => {
    setCategories((prev) => prev.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
    showToast(`"${updatedCat.name}" ${i18n.toastCategoryUpdated}`, 'success');
  };

  const handleReorderCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
  };

  const handleDeleteCategoryWithOptions = (
    catId: string,
    action: 'reassign_diger' | 'reassign_custom' | 'purge_all',
    targetCatId?: string
  ) => {
    if (catId === 'cat-diger') {
      showToast(i18n.toastCannotDeleteOther, 'error');
      return;
    }

    const catToDelete = categories.find((c) => c.id === catId);
    const catName = catToDelete ? catToDelete.name : 'Kategori';

    setCategories((prev) => prev.filter((c) => c.id !== catId));

    if (action === 'purge_all') {
      setTransactions((prev) => prev.filter((t) => t.categoryId !== catId));
      showToast(`"${catName}" ${i18n.toastCategoryDeletedPurge}`, 'info');
    } else if (action === 'reassign_custom' && targetCatId) {
      const targetCat = categories.find((c) => c.id === targetCatId);
      const targetName = targetCat ? targetCat.name : 'seçilen kategori';
      setTransactions((prev) =>
        prev.map((t) => (t.categoryId === catId ? { ...t, categoryId: targetCatId } : t))
      );
      showToast(`"${catName}" ${i18n.toastCategoryDeletedTarget}`, 'success');
    } else {
      // reassign_diger
      setTransactions((prev) =>
        prev.map((t) => (t.categoryId === catId ? { ...t, categoryId: 'cat-diger' } : t))
      );
      showToast(`"${catName}" ${i18n.toastCategoryDeletedOther}`, 'info');
    }
  };

  const handleAddCard = (cardData: Omit<CreditCard, 'id'>) => {
    const newCard: CreditCard = {
      ...cardData,
      id: `card-${Date.now()}`,
    };
    setCards((prev) => [...prev, newCard]);
    showToast(i18n.toastNewCardAdded, 'success');
  };

  const handleDeleteCard = (cardId: string, action: 'keep_records' | 'delete_all') => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    if (action === 'delete_all') {
      setTransactions((prev) => prev.filter((t) => t.cardId !== cardId));
      showToast(i18n.toastCardDeletedAll, 'info');
    } else {
      showToast(i18n.toastCardDeleted, 'info');
    }
  };

  // Update an existing credit card
  const handleUpdateCard = (updatedCard: CreditCard) => {
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
    showToast(i18n.toastCardUpdated, 'success');
  };

  // Export / Import Data (Android & Mobile Web Compatible)
  const handleExportData = async () => {
    const backupObj = {
      categories,
      cards,
      transactions,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const fileName = `butcem-yedek-${new Date().toISOString().slice(0, 10)}.json`;

    // 1. Try Native Web Share API (Opens Android share sheet: save to files, drive, notes, etc.)
    try {
      const file = new File([jsonStr], fileName, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: i18n.backupData,
          text: i18n.backupDataDesc,
        });
        showToast(i18n.toastBackupShared, 'success');
        return;
      }
    } catch (err) {
      console.log('Share canceled or not supported:', err);
    }

    // 2. Data URI fallback download
    try {
      const dataStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', fileName);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error('Data URI download failed:', e);
    }

    // 3. Copy JSON string to clipboard as automatic fallback
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(jsonStr);
        showToast(i18n.toastBackupClipboard, 'success');
        return;
      }
    } catch (e) {
      // ignore
    }

    showToast(i18n.toastBackupDownloaded, 'success');
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
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-gray-100 text-gray-900'} font-sans selection:bg-blue-600 selection:text-white`}>
      {/* Floating 2-second Toast Popup Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} isDarkMode={isDarkMode} />

      {/* Mobile Shell Wrapper */}
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative bg-gray-50 dark:bg-slate-900 border-x border-gray-200/80 dark:border-slate-800 shadow-2xl transition-colors">
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
                  focusTrigger={quickAddFocusTrigger}
                />
              )}

              {activeTab === 'cards' && (
                <CreditCardsView
                  cards={cards}
                  transactions={transactions}
                  onAddCard={handleAddCard}
                  onDeleteCard={handleDeleteCard}
                  onAddPayment={handleAddTransaction}
                  onUpdateCard={handleUpdateCard}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  categories={categories}
                  cards={cards}
                  transactions={transactions}
                  isDarkMode={isDarkMode}
                />
              )}

              {activeTab === 'history' && (
                <TransactionsView
                  categories={categories}
                  cards={cards}
                  transactions={transactions}
                  onDeleteTransaction={handleDeleteTransaction}
                  onUpdateTransaction={handleUpdateTransaction}
                />
              )}

              {activeTab === 'categories' && (
                <CategoriesView
                  categories={categories}
                  transactions={transactions}
                  onAddCategory={handleAddCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onReorderCategories={handleReorderCategories}
                  onDeleteCategoryWithOptions={handleDeleteCategoryWithOptions}
                  isDarkMode={isDarkMode}
                  onToggleTheme={handleToggleTheme}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Tab Bar */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'add') setQuickAddFocusTrigger((n) => n + 1);
          }}
        />
      </div>
    </div>
  );
}
