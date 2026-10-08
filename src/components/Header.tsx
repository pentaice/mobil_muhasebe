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
                              const code = `function doPost(e) {\n  var d = JSON.parse(e.postData.contents);\n  var ss = SpreadsheetApp.getActiveSpreadsheet();\n  \n  // 1. JSON Full Backup Sheet (For Restore)\n  var s1 = ss.getSheetByName("Backup");\n  if (!s1) { s1 = ss.insertSheet("Backup"); }\n  s1.clear();\n  s1.getRange(1, 1).setValue(JSON.stringify(d));\n  \n  // Name Dictionaries (Map IDs to readable names)\n  var catMap = {};\n  if (d.categories) { d.categories.forEach(function(c) { catMap[c.id] = c.name; }); }\n  if (d.incomeCategories) { d.incomeCategories.forEach(function(c) { catMap[c.id] = c.name; }); }\n  var assetMap = {};\n  if (d.investmentAssets) { d.investmentAssets.forEach(function(a) { assetMap[a.id] = a.name; }); }\n  var cardMap = {};\n  if (d.cards) { d.cards.forEach(function(c) { cardMap[c.id] = c.name; }); }\n  \n  // 2. All Financial Transactions (Expenses, Income, Investments)\n  var s2 = ss.getSheetByName("Transactions");\n  if (!s2) { s2 = ss.insertSheet("Transactions"); }\n  s2.clear();\n  s2.appendRow(["Date", "Type", "Amount", "Category / Asset", "Payment Source", "Note / P&L"]);\n  s2.getRange("A1:F1").setFontWeight("bold").setBackground("#d0e0e3");\n  \n  if (d.transactions && d.transactions.length > 0) {\n    var typeLabels = {\n      "expense": "Expense",\n      "income": "Income",\n      "card_payment": "Card Payment",\n      "investment_deposit": "Investment Inflow",\n      "investment_withdraw": "Investment Outflow"\n    };\n    var rows = d.transactions.map(function(t) {\n      var typeStr = typeLabels[t.type] || t.type;\n      var noteStr = t.note || "";\n      if (t.profitOrLoss !== undefined && t.profitOrLoss !== null) {\n        noteStr += " (P/L: " + t.profitOrLoss + ")";\n      }\n      var targetName = "";\n      if (t.investmentAssetId && assetMap[t.investmentAssetId]) {\n        targetName = assetMap[t.investmentAssetId];\n      } else if (t.categoryId && catMap[t.categoryId]) {\n        targetName = catMap[t.categoryId];\n      } else {\n        targetName = t.categoryId || t.investmentAssetId || "";\n      }\n      var sourceStr = "";\n      if (t.sourceType === "credit_card") {\n        sourceStr = (t.creditCardId && cardMap[t.creditCardId]) ? cardMap[t.creditCardId] : "Credit Card";\n      } else if (t.sourceType === "cash_bank") {\n        sourceStr = "Cash / Bank";\n      } else if (t.cardId && cardMap[t.cardId]) {\n        sourceStr = cardMap[t.cardId];\n      } else {\n        sourceStr = t.sourceType || "";\n      }\n      return [\n        t.date ? t.date.slice(0, 10) : "",\n        typeStr,\n        t.amount,\n        targetName,\n        sourceStr,\n        noteStr\n      ];\n    });\n    s2.getRange(2, 1, rows.length, 6).setValues(rows);\n  }\n  \n  // 3. Portfolio & Investments Sheet\n  if (d.investmentAssets && d.investmentAssets.length > 0) {\n    var s3 = ss.getSheetByName("Yatırımlar");\n    if (!s3) { s3 = ss.insertSheet("Yatırımlar"); }\n    s3.clear();\n    s3.appendRow(["Varlık Adı", "Kategori", "Yatırılan Anapara", "Güncel Piyasa Değeri", "Net Kâr / Zarar", "Son Güncelleme"]);\n    s3.getRange("A1:F1").setFontWeight("bold").setBackground("#d9ead3");\n    \n    var invRows = d.investmentAssets.map(function(a) {\n      var invested = Number(a.investedAmount) || 0;\n      var current = Number(a.currentValue) || 0;\n      var pL = current - invested;\n      return [\n        a.name,\n        a.category || "",\n        invested,\n        current,\n        pL,\n        a.updatedAt ? a.updatedAt.slice(0, 10) : ""\n      ];\n    });\n    s3.getRange(2, 1, invRows.length, 6).setValues(invRows);\n  }\n  \n  return ContentService.createTextOutput("OK");\n}\n\nfunction doGet(e) {\n  var ss = SpreadsheetApp.getActiveSpreadsheet();\n  var s1 = ss.getSheetByName("Backup");\n  var data = s1 ? s1.getRange(1, 1).getValue() : "{}";\n  return ContentService.createTextOutput(data).setMimeType(ContentService.MimeType.JSON);\n}`;
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
