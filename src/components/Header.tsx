import React, { useState, useRef } from 'react';
import { Transaction, CreditCard } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { useBackHandler } from '../utils/backButton';
import {
  Wallet,
  Download,
  Upload,
  RotateCcw,
  X,
  ShieldCheck,
  AlertTriangle,
  FileJson,
  CheckCircle2,
  Copy,
  Cloud,
  HelpCircle,
  ChevronLeft,
  Settings,
  History,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  loadCards,
  loadTransactions,
  calculateCardCycleInfo,
  loadCategories,
  loadIncomeCategories,
  loadInvestmentAssets,
  loadInvestmentTransactions,
  loadRecurringExpenses,
  loadInitialCashBalance,
  loadAppsScriptUrl,
  saveAppsScriptUrl,
  loadAutoSaveSettings,
  formatShortDate,
} from '../utils/storage';

interface HeaderProps {
  transactions: Transaction[];
  cards?: CreditCard[];
  activeTab?: string;
  onOpenHistory?: () => void;
  onExportData: () => void;
  onImportData: (jsonString: string) => void;
  onResetData: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const Header: React.FC<HeaderProps> = ({
  transactions,
  cards,
  activeTab,
  onOpenHistory,
  onExportData,
  onImportData,
  onResetData,
  onShowToast,
}) => {
  const { t: i18n, formatCurrency } = useI18n();
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [importJsonInput, setImportJsonInput] = useState<string>('');
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => loadAppsScriptUrl());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showSheetsHelpModal, setShowSheetsHelpModal] = useState<boolean>(false);
  const [activeSettingsPanel, setActiveSettingsPanel] = useState<'main' | 'restore' | 'sheets_settings'>('main');
  const [showJsonInfo, setShowJsonInfo] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  interface CloudVerification {
    verified: boolean;
    transactionCount?: number;
    trashCount?: number;
    exportedAt?: string;
    isChecking?: boolean;
    error?: string;
  }

  const [cloudVerification, setCloudVerification] = useState<CloudVerification | null>(null);

  const handleVerifyCloudStatus = async (customUrl?: string) => {
    const targetUrl = (customUrl ?? appsScriptUrl).trim();
    if (!targetUrl || !targetUrl.startsWith('https://script.google.com/')) return;

    setCloudVerification((prev) => ({ ...(prev || { verified: false }), isChecking: true, error: undefined }));
    try {
      const sep = targetUrl.includes('?') ? '&' : '?';
      const res = await fetch(`${targetUrl}${sep}action=status`);
      const data = await res.json();
      if (data && data.status === 'ok') {
        setCloudVerification({
          verified: true,
          transactionCount: data.transactionCount ?? 0,
          trashCount: data.trashCount ?? 0,
          exportedAt: data.exportedAt || data.serverTime,
          isChecking: false,
        });
      } else {
        setCloudVerification({
          verified: false,
          isChecking: false,
          error: data?.message || 'Yanıt doğrulanamadı',
        });
      }
    } catch (e) {
      setCloudVerification({
        verified: false,
        isChecking: false,
        error: 'Bağlantı kurulamadı',
      });
    }
  };

  React.useEffect(() => {
    if (activeSettingsPanel === 'sheets_settings' && appsScriptUrl.trim().startsWith('https://script.google.com/')) {
      handleVerifyCloudStatus();
    }
  }, [activeSettingsPanel]);

  useBackHandler(() => {
    if (showSheetsHelpModal) {
      setShowSheetsHelpModal(false);
      return;
    }
    if (showResetConfirm) {
      setShowResetConfirm(false);
      return;
    }
    if (showJsonInfo) {
      setShowJsonInfo(false);
      return;
    }
    if (activeSettingsPanel !== 'main') {
      setActiveSettingsPanel('main');
      return;
    }
    if (showSettingsModal) {
      setShowSettingsModal(false);
      return;
    }
  }, showSettingsModal || showSheetsHelpModal || showResetConfirm || showJsonInfo, 15);

  React.useEffect(() => {
    const handleOpenSheetsSettings = () => {
      setShowSettingsModal(true);
      setActiveSettingsPanel('sheets_settings');
    };

    window.addEventListener('openSheetsSettings', handleOpenSheetsSettings);
    return () => window.removeEventListener('openSheetsSettings', handleOpenSheetsSettings);
  }, []);

  // Calculate this month's total spending
  const now = new Date();
  const currentMonthExpenses = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return (
        t.type === 'expense' &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Calculate total unpaid debt across all cards using active props
  const currentCards = cards && cards.length > 0 ? cards : loadCards();
  const totalUnpaidDebt = currentCards.reduce((sum, card) => {
    const info = calculateCardCycleInfo(card, transactions);
    return sum + (info.totalUnpaidDebt ?? 0);
  }, 0);

  const handleExportClick = () => {
    onExportData();
    setShowSettingsModal(false);
  };

  const handleImportText = () => {
    if (!importJsonInput.trim()) return;
    try {
      onImportData(importJsonInput);
      setImportJsonInput('');
      onShowToast(i18n.toastDataLoaded, 'success');
      setShowSettingsModal(false);
    } catch (err) {
      onShowToast(i18n.toastInvalidJson, 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        onImportData(content);
        onShowToast(i18n.toastFileLoaded, 'success');
        setShowSettingsModal(false);
      } catch (err) {
        onShowToast(i18n.toastFileInvalid, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = () => {
    onResetData();
    setShowResetConfirm(false);
    setShowSettingsModal(false);
    onShowToast(i18n.toastDataResetDone, 'info');
  };

  const handleSyncToSheets = async () => {
    const url = appsScriptUrl.trim();
    if (!url) {
      setActiveSettingsPanel('sheets_settings');
      return;
    }
    
    if (!url.startsWith('https://script.google.com/')) {
      onShowToast(i18n.toastInvalidUrl, 'error');
      return;
    }

    setIsSyncing(true);
    try {
      const backupObj = {
        categories: loadCategories(),
        incomeCategories: loadIncomeCategories(),
        investmentAssets: loadInvestmentAssets(),
        investmentTransactions: loadInvestmentTransactions(),
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

      onShowToast(i18n.toastSyncSuccess, 'success');
      setTimeout(() => {
        handleVerifyCloudStatus();
      }, 1500);
    } catch (err) {
      console.error(err);
      onShowToast(i18n.toastCloudSyncError, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreFromSheets = async () => {
    const url = appsScriptUrl.trim();
    if (!url) return;
    
    if (!url.startsWith('https://script.google.com/')) {
      onShowToast(i18n.toastInvalidUrl, 'error');
      return;
    }
    
    if (!window.confirm(i18n.toastCloudOverwriteConfirm)) {
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.transactions) {
        onImportData(JSON.stringify(data));
        onShowToast(i18n.toastCloudRestoreSuccess, 'success');
        setShowSettingsModal(false);
      } else {
        throw new Error('Invalid data');
      }
    } catch (err) {
      console.error(err);
      onShowToast(i18n.toastCloudRestoreError, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800/90 px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 flex items-center justify-between text-gray-900 dark:text-slate-100 transition-colors shadow-2xs">
        {/* SOL KÖŞE - LOGO */}
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 dark:shadow-none shrink-0">
            <Wallet className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* SAĞ KÖŞE - BU AY HARCAMA & YEDEKLEME */}
        <div className="flex items-center gap-2.5">
          {/* KAPATILMAMIŞ BORÇ */}
          <div className="flex items-center gap-2.5">
            {/* Unpaid Debt Card */}
            <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200/90 dark:border-slate-700 rounded-2xl px-3.5 py-1.5 shadow-2xs">
              <span className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-slate-400 font-bold block text-right">
                {i18n.headerOpen}
              </span>
              <span className="text-xs font-black text-gray-900 dark:text-slate-100 block text-right font-mono">
                {formatCurrency(totalUnpaidDebt)}
              </span>
            </div>
          </div>

          {/* Bu Ay Harcama Kartı */}
          <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200/90 dark:border-slate-700 rounded-2xl px-3.5 py-1.5 shadow-2xs">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-slate-400 font-bold block text-right">
              {i18n.headerMonthly}
            </span>
            <span className="text-xs font-black text-gray-900 dark:text-slate-100 block text-right font-mono">
              {formatCurrency(currentMonthExpenses)}
            </span>
          </div>

          {/* Geçmiş Butonu (Sadece İkon) */}
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              title={i18n.navHistory}
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0 ${
                activeTab === 'history'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20'
                  : 'bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-750 border border-gray-200/90 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <History className="w-4.5 h-4.5" />
            </button>
          )}

          {/* Yedekleme & Ayarlar Butonu */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            title={i18n.dataManagement}
            className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-750 border border-gray-200/90 dark:border-slate-700 text-gray-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0"
          >
            <Download className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
          </button>
        </div>
      </header>

      {/* SETTINGS & BACKUP MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 bg-gray-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-md p-6 shadow-2xl text-gray-900 dark:text-slate-100 space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  {activeSettingsPanel !== 'main' ? (
                    <button onClick={() => setActiveSettingsPanel('main')} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-slate-100">
                      {activeSettingsPanel === 'main' && i18n.dataManagement}
                      {activeSettingsPanel === 'restore' && i18n.restoreFromBackup}
                      {activeSettingsPanel === 'sheets_settings' && i18n.sheetsSettings}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">
                      {activeSettingsPanel === 'main' && i18n.downloadOrRestore}
                      {activeSettingsPanel === 'restore' && i18n.restoreFromBackupSubtitle}
                      {activeSettingsPanel === 'sheets_settings' && i18n.sheetsSettingsSubtitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowSettingsModal(false); setTimeout(() => setActiveSettingsPanel('main'), 200); setShowJsonInfo(false); }}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {activeSettingsPanel === 'main' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {/* Export JSON Button */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FileJson className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>{i18n.backupData}</span>
                        </label>
                        <button onClick={() => setShowJsonInfo(!showJsonInfo)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <AnimatePresence>
                        {showJsonInfo && (
                          <motion.p 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed bg-gray-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700/50 overflow-hidden"
                          >
                            {i18n.backupDataDesc}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <button
                        onClick={handleExportClick}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/20 active:scale-98"
                      >
                        <Download className="w-4 h-4" />
                        <span>{i18n.downloadJsonBackup}</span>
                      </button>
                    </div>

                    {/* Go to Restore Panel Button */}
                    <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-3">
                      <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{i18n.restoreFromBackup}</span>
                      </label>
                      <button
                        onClick={() => setActiveSettingsPanel('restore')}
                        className="w-full py-3 px-4 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-750 border border-gray-200/90 dark:border-slate-700 text-gray-800 dark:text-slate-200 rounded-2xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm active:scale-98"
                      >
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>{i18n.restoreFromBackup}</span>
                        </div>
                        <ChevronLeft className="w-4 h-4 rotate-180 opacity-50" />
                      </button>
                    </div>

                    {/* Google Sheets Backup Main */}
                    <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-3">
                      <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Cloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>{i18n.googleSheetsBackup}</span>
                      </label>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={handleSyncToSheets}
                          disabled={isSyncing}
                          className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-500/20 active:scale-98"
                        >
                          <Cloud className="w-4 h-4" />
                          <span>{isSyncing ? i18n.processing : i18n.backup}</span>
                        </button>

                        <button
                          onClick={() => setActiveSettingsPanel('sheets_settings')}
                          className="w-12 py-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-750 border border-gray-200/90 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-98"
                        >
                          <Settings className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>

                    {/* Reset Data Option with Confirmation */}
                    <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                      {!showResetConfirm ? (
                        <button
                          onClick={() => setShowResetConfirm(true)}
                          className="w-full py-3 px-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>{i18n.resetToDefaults}</span>
                        </button>
                      ) : (
                        <div className="bg-rose-50/90 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 space-y-3 animate-in fade-in zoom-in-95">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-bold text-xs text-rose-900 dark:text-rose-200">{i18n.areYouSure}</p>
                              <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                                {i18n.resetWarning}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={handleConfirmReset}
                              className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-sm"
                            >
                              {i18n.yesReset}
                            </button>
                            <button
                              onClick={() => setShowResetConfirm(false)}
                              className="flex-1 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                            >
                              {i18n.giveUp}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* RESTORE FROM BACKUP PANEL */}
                {activeSettingsPanel === 'restore' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Method 1: File Upload */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                        1. {i18n.selectJsonFile}
                      </label>
                      <input
                        type="file"
                        accept=".json,application/json"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3.5 border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-gray-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer group bg-gray-50/50 dark:bg-slate-800/30"
                      >
                        <Upload className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                        <span className="text-xs font-bold">{i18n.selectJsonFile}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-slate-800" />
                      <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase">/</span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-slate-800" />
                    </div>

                    {/* Method 2: Paste Raw JSON */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                        2. {i18n.loadFromText}
                      </label>
                      <textarea
                        rows={3}
                        placeholder={i18n.pasteJsonPlaceholder}
                        value={importJsonInput}
                        onChange={(e) => setImportJsonInput(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-gray-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <button
                        onClick={handleImportText}
                        disabled={!importJsonInput.trim()}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{i18n.loadFromText}</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* GOOGLE SHEETS SETTINGS PANEL */}
                {activeSettingsPanel === 'sheets_settings' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                          <Cloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>Google Apps Script Web App URL</span>
                        </span>
                        <button
                          onClick={() => setShowSheetsHelpModal(true)}
                          className="text-[10px] bg-indigo-100 dark:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 py-1 px-2.5 rounded-full font-semibold cursor-pointer transition-colors"
                        >
                          {i18n.howToSetup}
                        </button>
                      </div>
                      
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed">
                          {i18n.pasteAppsScriptUrl}
                        </p>
                        {loadAutoSaveSettings().lastAutoSaveDate && (
                          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {i18n.lastBackupDate} {loadAutoSaveSettings().lastAutoSaveDate?.split('T')[0]}
                          </p>
                        )}
                      </div>
                      
                      <input
                        type="url"
                        placeholder="https://script.google.com/..."
                        value={appsScriptUrl}
                        onChange={(e) => {
                          setAppsScriptUrl(e.target.value);
                          saveAppsScriptUrl(e.target.value);
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 text-base md:text-sm font-mono text-gray-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                      />

                      {/* Live Cloud Status Verification Card */}
                      {cloudVerification?.isChecking ? (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-100/50 dark:bg-indigo-950/50 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                          <span>Google Sheets durumu doğrulanıyor...</span>
                        </div>
                      ) : cloudVerification?.verified ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Bulutta Doğrulandı: {cloudVerification.transactionCount} İşlem</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleVerifyCloudStatus()}
                              className="p-1 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                              title="Yeniden Doğrula"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                            <span>
                              {cloudVerification.exportedAt ? `Son Yedek: ${formatShortDate(cloudVerification.exportedAt)}` : 'Aktif'}
                            </span>
                            {cloudVerification.trashCount !== undefined && cloudVerification.trashCount > 0 && (
                              <span className="font-semibold text-amber-700 dark:text-amber-400">
                                🗑️ {cloudVerification.trashCount} silinen arşivde
                              </span>
                            )}
                          </div>
                        </div>
                      ) : appsScriptUrl.trim().startsWith('https://script.google.com/') ? (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700">
                          <span className="text-[11px] text-gray-500 dark:text-slate-400">
                            {cloudVerification?.error || 'Durum doğrulanmadı'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleVerifyCloudStatus()}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Doğrula</span>
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <button
                      onClick={handleRestoreFromSheets}
                      disabled={!appsScriptUrl.trim() || isSyncing}
                      className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-98"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isSyncing ? i18n.processing : i18n.restoreFromCloud}</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GOOGLE SHEETS HELP MODAL */}
      <AnimatePresence>
        {showSheetsHelpModal && (
          <div className="fixed inset-0 z-[60] bg-gray-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-md p-6 shadow-2xl text-gray-900 dark:text-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-slate-100">{i18n.sheetsHelpTitle}</h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">{i18n.googleSheetsIntegration}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSheetsHelpModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                  <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-5 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                        <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium pt-1">
                          {i18n.sheetsHelpStep1}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                        <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium pt-1">
                          {i18n.sheetsHelpStep2}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                        <div className="space-y-2 pt-1">
                          <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium">
                            {i18n.sheetsHelpStep3}
                          </p>
                          <button 
                            onClick={() => {
                              const code = `function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. GUVENLIK: Bos Veri / Kazara Ezme Korumasi (Anti-Poisoning)
    var s1 = ss.getSheetByName("Backup");
    var prevData = null;
    if (s1) {
      try {
        var rawVal = s1.getRange(1, 1).getValue();
        if (rawVal) prevData = JSON.parse(rawVal);
      } catch (err) {}
    }

    if (prevData && prevData.transactions && prevData.transactions.length > 5 && (!d.transactions || d.transactions.length === 0)) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "blocked",
        message: "Guvenlik: Tabloda kayitli " + prevData.transactions.length + " islem varken bos veri gonderilemez!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. SOFT-DELETE: Silinen Harcamalari Cop Kutusuna (Silinenler) Arsivle
    if (prevData && prevData.transactions && d.transactions) {
      var newIds = {};
      d.transactions.forEach(function(t) { if (t.id) newIds[t.id] = true; });
      var deletedTxs = prevData.transactions.filter(function(t) { return t.id && !newIds[t.id]; });

      if (deletedTxs.length > 0) {
        var sTrash = ss.getSheetByName("Silinenler");
        if (!sTrash) {
          sTrash = ss.insertSheet("Silinenler");
          sTrash.appendRow(["Silinme Zamani", "Islem Tarihi", "Tur", "Tutar", "Kategori / Varlik", "Odeme Kaynagi", "Not", "Islem ID"]);
          sTrash.getRange("A1:H1").setFontWeight("bold").setBackground("#f4cccc");
        }
        var nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");
        var trashRows = deletedTxs.map(function(t) {
          return [
            nowStr,
            t.date ? t.date.slice(0, 10) : "",
            t.type || "",
            t.amount || 0,
            t.categoryId || t.investmentAssetId || "",
            t.sourceType || "",
            t.note || "",
            t.id || ""
          ];
        });
        sTrash.getRange(sTrash.getLastRow() + 1, 1, trashRows.length, 8).setValues(trashRows);
      }
    }

    // 3. YEDEK GECMISI / LOG (Snapshot History)
    var sLog = ss.getSheetByName("Yedek_Gecmisi");
    if (!sLog) {
      sLog = ss.insertSheet("Yedek_Gecmisi");
      sLog.appendRow(["Yedek Zamani", "Toplam Islem", "Kart Sayisi", "Kategori Sayisi", "Varlik Sayisi", "Cuzdan Bakiyesi"]);
      sLog.getRange("A1:F1").setFontWeight("bold").setBackground("#cfe2f3");
    }
    sLog.appendRow([
      new Date().toISOString().slice(0, 19).replace("T", " "),
      d.transactions ? d.transactions.length : 0,
      d.cards ? d.cards.length : 0,
      d.categories ? d.categories.length : 0,
      d.investmentAssets ? d.investmentAssets.length : 0,
      d.initialCashBalance || 0
    ]);
    if (sLog.getLastRow() > 105) {
      sLog.deleteRows(2, sLog.getLastRow() - 101);
    }

    // 4. JSON Full Backup Sheet (Geri Yukleme Icin)
    if (!s1) { s1 = ss.insertSheet("Backup"); }
    s1.clear();
    s1.getRange(1, 1).setValue(JSON.stringify(d));

    // Sozlukler
    var catMap = {};
    if (d.categories) { d.categories.forEach(function(c) { catMap[c.id] = c.name; }); }
    if (d.incomeCategories) { d.incomeCategories.forEach(function(c) { catMap[c.id] = c.name; }); }
    var assetMap = {};
    if (d.investmentAssets) { d.investmentAssets.forEach(function(a) { assetMap[a.id] = a.name; }); }
    var cardMap = {};
    if (d.cards) { d.cards.forEach(function(c) { cardMap[c.id] = c.name; }); }

    // 5. Okunabilir Transactions Tablosu
    var s2 = ss.getSheetByName("Transactions");
    if (!s2) { s2 = ss.insertSheet("Transactions"); }
    s2.clear();
    s2.appendRow(["Tarih", "Tur", "Tutar", "Kategori / Varlik", "Odeme Kaynagi", "Not / K-Z"]);
    s2.getRange("A1:F1").setFontWeight("bold").setBackground("#d0e0e3");

    if (d.transactions && d.transactions.length > 0) {
      var typeLabels = {
        "expense": "Gider",
        "income": "Gelir",
        "card_payment": "Kart Odemesi",
        "investment_deposit": "Varlik Girisi",
        "investment_withdraw": "Varlik Satisi"
      };
      var rows = d.transactions.map(function(t) {
        var typeStr = typeLabels[t.type] || t.type;
        var noteStr = t.note || "";
        if (t.profitOrLoss !== undefined && t.profitOrLoss !== null) {
          noteStr += " (K/Z: " + t.profitOrLoss + ")";
        }
        var targetName = "";
        if (t.investmentAssetId && assetMap[t.investmentAssetId]) {
          targetName = assetMap[t.investmentAssetId];
        } else if (t.categoryId && catMap[t.categoryId]) {
          targetName = catMap[t.categoryId];
        } else {
          targetName = t.categoryId || t.investmentAssetId || "";
        }
        var sourceStr = "";
        if (t.sourceType === "credit_card") {
          sourceStr = (t.creditCardId && cardMap[t.creditCardId]) ? cardMap[t.creditCardId] : "Kredi Karti";
        } else if (t.sourceType === "cash_bank") {
          sourceStr = "Nakit / Banka";
        } else if (t.cardId && cardMap[t.cardId]) {
          sourceStr = cardMap[t.cardId];
        } else {
          sourceStr = t.sourceType || "";
        }
        return [
          t.date ? t.date.slice(0, 10) : "",
          typeStr,
          t.amount,
          targetName,
          sourceStr,
          noteStr
        ];
      });
      s2.getRange(2, 1, rows.length, 6).setValues(rows);
    }

    // 6. Portfoy & Yatirimlar Tablosu
    if (d.investmentAssets && d.investmentAssets.length > 0) {
      var s3 = ss.getSheetByName("Yatırımlar");
      if (!s3) { s3 = ss.insertSheet("Yatırımlar"); }
      s3.clear();
      s3.appendRow(["Varlik Adi", "Kategori", "Yatirilan Anapara", "Guncel Piyasa Degeri", "Net Kar / Zarar", "Son Guncelleme"]);
      s3.getRange("A1:F1").setFontWeight("bold").setBackground("#d9ead3");

      var invRows = d.investmentAssets.map(function(a) {
        var invested = Number(a.investedAmount) || 0;
        var current = Number(a.currentValue) || 0;
        var pL = current - invested;
        return [
          a.name,
          a.category || "",
          invested,
          current,
          pL,
          a.updatedAt ? a.updatedAt.slice(0, 10) : ""
        ];
      });
      s3.getRange(2, 1, invRows.length, 6).setValues(invRows);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Handshake / Teyit Istegi (?action=status)
  if (e && e.parameter && e.parameter.action === "status") {
    var s1 = ss.getSheetByName("Backup");
    var raw = s1 ? s1.getRange(1, 1).getValue() : "{}";
    var parsed = {};
    try { parsed = JSON.parse(raw); } catch(err) {}
    var txCount = (parsed.transactions && parsed.transactions.length) || 0;
    var exportedAt = parsed.exportedAt || null;
    var sTrash = ss.getSheetByName("Silinenler");
    var trashCount = sTrash ? Math.max(0, sTrash.getLastRow() - 1) : 0;

    return ContentService.createTextOutput(JSON.stringify({
      status: "ok",
      transactionCount: txCount,
      trashCount: trashCount,
      exportedAt: exportedAt,
      serverTime: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // Normal Geri Yukleme Istegi (Full Backup JSON)
  var s1 = ss.getSheetByName("Backup");
  var data = s1 ? s1.getRange(1, 1).getValue() : "{}";
  return ContentService.createTextOutput(data).setMimeType(ContentService.MimeType.JSON);
}`;
                              navigator.clipboard.writeText(code);
                              onShowToast(i18n.toastCodeCopied, 'success');
                            }}
                            className="w-full py-2.5 px-3 bg-gray-900 hover:bg-black text-green-400 rounded-xl font-mono text-[11px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-inner active:scale-[0.98]"
                          >
                            <Copy className="w-4 h-4" />
                            <span>{i18n.sheetsHelpStep3Btn}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">4</div>
                        <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium pt-1">
                          {i18n.sheetsHelpStep4}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">5</div>
                        <div className="space-y-1.5 pt-1">
                          <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium">
                            {i18n.sheetsHelpStep5}
                          </p>
                          <ul className="text-[11px] text-gray-600 dark:text-slate-400 list-disc pl-4 space-y-1">
                            <li>{i18n.sheetsHelpStep5Me}</li>
                            <li>{i18n.sheetsHelpStep5Anyone}</li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">6</div>
                        <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium pt-1">
                          {i18n.sheetsHelpStep6}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">7</div>
                        <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium pt-1">
                          {i18n.sheetsHelpStep7}
                        </p>
                      </div>
                    </div>
                  </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
