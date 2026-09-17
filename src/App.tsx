import React, { useState, useEffect } from 'react';
import {
  Category,
  CreditCard,
  Transaction,
  RecurringExpense,
  IncomeCategory,
  InvestmentAsset,
  InvestmentTransaction,
} from './types';
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
  loadAutoSaveSettings,
  saveAutoSaveSettings,
  loadAppsScriptUrl,
  loadRecurringExpenses,
  saveRecurringExpenses,
  loadIncomeCategories,
  saveIncomeCategories,
  loadInvestmentAssets,
  saveInvestmentAssets,
  loadInvestmentTransactions,
  saveInvestmentTransactions,
  calculateInvestmentStats,
  loadInitialCashBalance,
  saveInitialCashBalance,
  calculateLiquidCashBalance,
} from './utils/storage';
import { processRecurringExpenses } from './utils/recurringExpenses';
import { initNotificationChannel, syncNotificationSchedule } from './utils/notifications';
import { syncCategoriesToWidget, checkAndImportWidgetTransactions } from './utils/widgetBridge';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CREDIT_CARDS,
  INITIAL_TRANSACTIONS,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_INVESTMENT_ASSETS,
} from './data/initialData';
import { Header } from './components/Header';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { QuickAddExpense } from './components/QuickAddExpense';
import { CreditCardsView } from './components/CreditCardsView';
import { CategoriesView } from './components/CategoriesView';
import { ReportsView } from './components/ReportsView';
import { TransactionsView } from './components/TransactionsView';
import { InvestmentsView } from './components/InvestmentsView';
import { Toast, ToastState } from './components/Toast';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from './i18n/I18nContext';

export default function App() {
  const { t: i18n } = useI18n();
  const [categories, setCategories] = useState<Category[]>(() => loadCategories());
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>(() => loadIncomeCategories());
  const [investmentAssets, setInvestmentAssets] = useState<InvestmentAsset[]>(() => loadInvestmentAssets());
  const [investmentTransactions, setInvestmentTransactions] = useState<InvestmentTransaction[]>(() => loadInvestmentTransactions());
  const [cards, setCards] = useState<CreditCard[]>(() => loadCards());
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => loadRecurringExpenses());
  const [initialCashBalance, setInitialCashBalance] = useState<number>(() => loadInitialCashBalance());
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

  // Sync to LocalStorage & Widget
  useEffect(() => {
    saveCategories(categories);
    syncCategoriesToWidget(categories);
  }, [categories]);

  useEffect(() => {
    saveCards(cards);
  }, [cards]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveRecurringExpenses(recurringExpenses);
  }, [recurringExpenses]);

  useEffect(() => {
    saveIncomeCategories(incomeCategories);
  }, [incomeCategories]);

  useEffect(() => {
    saveInvestmentAssets(investmentAssets);
  }, [investmentAssets]);

  useEffect(() => {
    saveInvestmentTransactions(investmentTransactions);
  }, [investmentTransactions]);

  // Auto Save to Sheets (Once a day)
  useEffect(() => {
    const checkAutoSave = async () => {
      const autoSave = loadAutoSaveSettings();
      if (!autoSave.enabled || !navigator.onLine) return;

      const url = loadAppsScriptUrl().trim();
      if (!url || !url.startsWith('https://script.google.com/')) return;

      const today = new Date().toISOString().slice(0, 10);
      if (autoSave.lastAutoSaveDate === today) return;

      try {
        const backupObj = {
          categories: loadCategories(),
          incomeCategories: loadIncomeCategories(),
          investmentAssets: loadInvestmentAssets(),
          cards: loadCards(),
          transactions: loadTransactions(),
          recurringExpenses: loadRecurringExpenses(),
          initialCashBalance: loadInitialCashBalance(),
          exportedAt: new Date().toISOString(),
        };

        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify(backupObj),
        });

        saveAutoSaveSettings({ ...autoSave, lastAutoSaveDate: today });
        console.log('Auto save to sheets successful.');
      } catch (err) {
        console.error('Auto save failed:', err);
      }
    };

    checkAutoSave();
  }, []);

  // Initialize and synchronize OS-level Local Notifications
  useEffect(() => {
    const initNotifications = async () => {
      await initNotificationChannel();
      const settings = loadNotificationSettings();
      if (settings.enabled) {
        await syncNotificationSchedule(settings, i18n);
      }
    };
    initNotifications();
  }, [i18n]);

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
    } else if (txData.type === 'income') {
      showToast('Gelir başarıyla kaydedildi!', 'success');
    } else if (txData.type === 'investment_deposit') {
      showToast('Paranız yatırıma aktarıldı!', 'success');
    } else if (txData.type === 'investment_withdraw') {
      showToast('Yatırımdan nakit çekildi!', 'success');
    } else {
      showToast(i18n.toastExpenseAdded, 'success');
    }
  };

  // Check and import pending transactions from home screen widget on mount and resume
  useEffect(() => {
    const checkWidget = () => {
      checkAndImportWidgetTransactions(handleAddTransaction, showToast);
    };

    checkWidget();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkWidget();
      }
    };

    window.addEventListener('focus', checkWidget);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', checkWidget);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Auto-process recurring card expenses
  useEffect(() => {
    const checkRecurring = () => {
      const { newTransactions, updatedRecurringExpenses } = processRecurringExpenses(
        recurringExpenses,
        cards
      );

      if (newTransactions.length > 0) {
        const preparedTxs: Transaction[] = newTransactions.map((t) => ({
          ...t,
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          createdAt: new Date().toISOString(),
        }));

        setTransactions((prev) => [...preparedTxs, ...prev]);
        setRecurringExpenses(updatedRecurringExpenses);
        saveRecurringExpenses(updatedRecurringExpenses);

        showToast(`${newTransactions.length} ${i18n.toastRecurringProcessed}`, 'info');
      }
    };

    checkRecurring();
    window.addEventListener('focus', checkRecurring);
    return () => window.removeEventListener('focus', checkRecurring);
  }, [cards, recurringExpenses, i18n]);

  const handleAddRecurringExpense = (expData: Omit<RecurringExpense, 'id' | 'createdAt'>) => {
    const newExp: RecurringExpense = {
      ...expData,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    setRecurringExpenses((prev) => [...prev, newExp]);
    showToast(i18n.toastRecurringAdded, 'success');
  };

  const handleUpdateRecurringExpense = (updatedExp: RecurringExpense) => {
    setRecurringExpenses((prev) =>
      prev.map((e) => (e.id === updatedExp.id ? updatedExp : e))
    );
    showToast(i18n.toastRecurringUpdated, 'success');
  };

  const handleDeleteRecurringExpense = (id: string) => {
    setRecurringExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast(i18n.toastRecurringDeleted, 'info');
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

  // Investment Asset Handlers
  const handleAddInvestmentAsset = (assetData: Omit<InvestmentAsset, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAsset: InvestmentAsset = {
      ...assetData,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setInvestmentAssets((prev) => [...prev, newAsset]);
    showToast(`"${assetData.name}" portföye eklendi!`, 'success');
  };

  const handleUpdateInvestmentAsset = (updatedAsset: InvestmentAsset) => {
    setInvestmentAssets((prev) => prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a)));
    showToast(`"${updatedAsset.name}" güncellendi!`, 'success');
  };

  const handleDeleteInvestmentAsset = (id: string) => {
    setInvestmentAssets((prev) => prev.filter((a) => a.id !== id));
    showToast('Varlık portföyden silindi.', 'info');
  };

  // Export / Import Data (Android & Mobile Web Compatible)
  const handleExportData = async () => {
    const backupObj = {
      categories,
      incomeCategories,
      investmentAssets,
      investmentTransactions,
      cards,
      transactions,
      recurringExpenses,
      initialCashBalance,
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
    if (parsed.incomeCategories && Array.isArray(parsed.incomeCategories)) {
      setIncomeCategories(parsed.incomeCategories);
    }
    if (parsed.investmentAssets && Array.isArray(parsed.investmentAssets)) {
      setInvestmentAssets(parsed.investmentAssets);
    }
    if (parsed.investmentTransactions && Array.isArray(parsed.investmentTransactions)) {
      setInvestmentTransactions(parsed.investmentTransactions);
    }
    if (parsed.cards && Array.isArray(parsed.cards)) {
      setCards(parsed.cards);
    }
    if (parsed.transactions && Array.isArray(parsed.transactions)) {
      setTransactions(parsed.transactions);
    }
    if (parsed.initialCashBalance !== undefined && typeof parsed.initialCashBalance === 'number') {
      setInitialCashBalance(parsed.initialCashBalance);
      saveInitialCashBalance(parsed.initialCashBalance);
    }
  };

  const handleResetData = () => {
    resetAllData();
    setCategories(DEFAULT_CATEGORIES);
    setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
    setInvestmentAssets(DEFAULT_INVESTMENT_ASSETS);
    setInvestmentTransactions([]);
    setCards(DEFAULT_CREDIT_CARDS);
    setTransactions(INITIAL_TRANSACTIONS);
    setInitialCashBalance(0);
  };

  const handleUpdateInitialCashBalance = (newBalance: number) => {
    setInitialCashBalance(newBalance);
    saveInitialCashBalance(newBalance);
    showToast('Cüzdan bakiyesi güncellendi!', 'success');
  };

  const totalInvestmentsValuation = calculateInvestmentStats(investmentAssets, transactions).totalCurrentValue;
  const liquidCashBalance = calculateLiquidCashBalance(transactions, initialCashBalance);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-gray-100 text-gray-900'} font-sans selection:bg-blue-600 selection:text-white`}>
      {/* Floating 2-second Toast Popup Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} isDarkMode={isDarkMode} />

      {/* Mobile Shell Wrapper */}
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative bg-gray-50 dark:bg-slate-900 border-x border-gray-200/80 dark:border-slate-800 shadow-2xl transition-colors">
        {/* Top Header */}
        <Header
          transactions={transactions}
          activeTab={activeTab}
          onOpenHistory={() => setActiveTab('history')}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onResetData={handleResetData}
          onShowToast={showToast}
        />

        {/* Main Body View */}
        <main className="flex-1 px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
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
                  incomeCategories={incomeCategories}
                  cards={cards}
                  recurringExpenses={recurringExpenses}
                  onAddTransaction={handleAddTransaction}
                  onOpenAddCategoryModal={() => setActiveTab('categories')}
                  onAddRecurringExpense={handleAddRecurringExpense}
                  onUpdateRecurringExpense={handleUpdateRecurringExpense}
                  onDeleteRecurringExpense={handleDeleteRecurringExpense}
                  onOpenInvestments={() => setActiveTab('investments')}
                  totalInvestmentsValue={totalInvestmentsValuation}
                  liquidCashBalance={liquidCashBalance}
                  focusTrigger={quickAddFocusTrigger}
                />
              )}

              {activeTab === 'cards' && (
                <CreditCardsView
                  cards={cards}
                  transactions={transactions}
                  categories={categories}
                  initialCashBalance={initialCashBalance}
                  onUpdateInitialBalance={handleUpdateInitialCashBalance}
                  onAddCard={handleAddCard}
                  onDeleteCard={handleDeleteCard}
                  onAddPayment={handleAddTransaction}
                  onUpdateCard={handleUpdateCard}
                />
              )}

              {activeTab === 'investments' && (
                <InvestmentsView
                  assets={investmentAssets}
                  transactions={transactions}
                  onAddAsset={handleAddInvestmentAsset}
                  onUpdateAsset={handleUpdateInvestmentAsset}
                  onDeleteAsset={handleDeleteInvestmentAsset}
                  onAddTransaction={handleAddTransaction}
                  onUpdateTransaction={handleUpdateTransaction}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  categories={categories}
                  incomeCategories={incomeCategories}
                  cards={cards}
                  transactions={transactions}
                  isDarkMode={isDarkMode}
                />
              )}

              {activeTab === 'history' && (
                <TransactionsView
                  categories={categories}
                  incomeCategories={incomeCategories}
                  investmentAssets={investmentAssets}
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
