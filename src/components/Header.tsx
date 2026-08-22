import React, { useState, useRef } from 'react';
import { Transaction } from '../types';
import { formatTL } from '../utils/storage';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loadCards, loadTransactions, calculateCardCycleInfo, loadCategories, loadAppsScriptUrl, saveAppsScriptUrl } from '../utils/storage';

interface HeaderProps {
  transactions: Transaction[];
  onExportData: () => void;
  onImportData: (jsonString: string) => void;
  onResetData: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const Header: React.FC<HeaderProps> = ({
  transactions,
  onExportData,
  onImportData,
  onResetData,
  onShowToast,
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [importJsonInput, setImportJsonInput] = useState<string>('');
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => loadAppsScriptUrl());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showSheetsHelpModal, setShowSheetsHelpModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Calculate total unpaid debt across all cards
  const cards = loadCards();
  const allTransactions = loadTransactions();
  const totalUnpaidDebt = cards.reduce((sum, card) => {
    const info = calculateCardCycleInfo(card, allTransactions);
    return sum + (info.totalUnpaidDebt ?? 0);
  }, 0);

  const handleExportClick = () => {
    onExportData();
    onShowToast('Yedek JSON indirildi! ("İndirilenler" klasöründe)', 'success');
  };

  const handleImportTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonInput.trim()) return;

    try {
      onImportData(importJsonInput);
      onShowToast('Veriler başarıyla yüklendi ve güncellendi!', 'success');
      setImportJsonInput('');
      setShowSettingsModal(false);
    } catch (err) {
      onShowToast('Geçersiz JSON formatı! Lütfen geçerli bir yedek dosyası seçin.', 'error');
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
        onShowToast('Yedek dosyasından veriler yüklendi!', 'success');
        setShowSettingsModal(false);
      } catch (err) {
        onShowToast('Dosya okunamadı veya biçimi geçersiz.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = () => {
    onResetData();
    setShowResetConfirm(false);
    setShowSettingsModal(false);
    onShowToast('Tüm veriler sıfırlandı!', 'info');
  };

  const handleSyncToSheets = async () => {
    const url = appsScriptUrl.trim();
    if (!url) return;
    
    if (!url.startsWith('https://script.google.com/')) {
      onShowToast("Hata: Geçersiz URL! Lütfen 'https://script.google.com/...' ile başlayan tam linki yapıştırın.", 'error');
      return;
    }

    setIsSyncing(true);
    try {
      const backupObj = {
        categories: loadCategories(),
        cards: loadCards(),
        transactions: loadTransactions(),
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

      onShowToast('Google E-Tablolara başarıyla senkronize edildi!', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Senkronizasyon hatası! URL yi ve bağlantınızı kontrol edin.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreFromSheets = async () => {
    const url = appsScriptUrl.trim();
    if (!url) return;
    
    if (!url.startsWith('https://script.google.com/')) {
      onShowToast("Hata: Geçersiz URL! Lütfen 'https://script.google.com/...' ile başlayan tam linki yapıştırın.", 'error');
      return;
    }
    
    if (!window.confirm('Buluttaki veriler telefondaki mevcut verilerin üzerine yazılacak. Emin misiniz?')) {
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.transactions) {
        onImportData(JSON.stringify(data));
        onShowToast('Veriler buluttan başarıyla geri yüklendi!', 'success');
        setShowSettingsModal(false);
      } else {
        throw new Error('Geçersiz veri');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Bağlantı hatası veya henüz yedek yok.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800/90 px-5 py-4 flex items-center justify-between text-gray-900 dark:text-slate-100 transition-colors shadow-2xs">
        {/* SOL KÖŞE - LOGO & İSİM */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 dark:shadow-none shrink-0">
            <Wallet className="w-5 h-5 text-white" />
          </div>

          <h1 className="font-extrabold text-lg tracking-tight text-gray-900 dark:text-white leading-none">
            Bütçem
          </h1>
        </div>

        {/* SAĞ KÖŞE - BU AY HARCAMA & YEDEKLEME */}
        <div className="flex items-center gap-2.5">
          {/* KAPATILMAMIŞ BORÇ */}
          <div className="flex items-center gap-2.5">
            {/* Unpaid Debt Card */}
            <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200/90 dark:border-slate-700 rounded-2xl px-3.5 py-1.5 shadow-2xs">
              <span className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-slate-400 font-bold block text-right">
                Açık
              </span>
              <span className="text-xs font-black text-gray-900 dark:text-slate-100 block text-right font-mono">
                {formatTL(totalUnpaidDebt)}
              </span>
            </div>
          </div>

          {/* Bu Ay Harcama Kartı */}
          <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200/90 dark:border-slate-700 rounded-2xl px-3.5 py-1.5 shadow-2xs">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-slate-400 font-bold block text-right">
              Aylık
            </span>
            <span className="text-xs font-black text-gray-900 dark:text-slate-100 block text-right font-mono">
              {formatTL(currentMonthExpenses)}
            </span>
          </div>

          {/* Yedekleme & Ayarlar Butonu */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            title="Yedekleme & Veri Yönetimi"
            className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-750 border border-gray-200/90 dark:border-slate-700 text-gray-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0"
          >
            <Download className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
          </button>
        </div>
      </header>

      {/* SETTINGS & BACKUP MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 bg-gray-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-md p-6 shadow-2xl text-gray-900 dark:text-slate-100 space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-slate-100">Veri Yönetimi & Yedekleme</h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">Verilerinizi indirin veya geri yükleyin</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Export JSON Button */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileJson className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Verileri Yedekle (JSON İndir)</span>
                  </label>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                    Tüm harcamalarınızı, kartlarınızı ve kategorilerinizi JSON formatında cihazınıza indirin.
                  </p>
                  <button
                    onClick={handleExportClick}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/20 active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>JSON Veri Yedeğini İndir</span>
                  </button>
                </div>

                {/* Import JSON Form */}
                <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Yedekten Geri Yükle</span>
                  </label>

                  {/* File input trigger */}
                  <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-2xl font-semibold text-xs text-gray-800 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-gray-600 dark:text-slate-400" />
                    <span>JSON Dosyası Seç</span>
                  </button>

                  <form onSubmit={handleImportTextSubmit} className="space-y-2 pt-1">
                    <textarea
                      rows={2}
                      placeholder="Veya yedek JSON metnini buraya yapıştırın..."
                      value={importJsonInput}
                      onChange={(e) => setImportJsonInput(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-2.5 text-xs font-mono text-gray-800 dark:text-slate-200 focus:outline-none focus:border-blue-600"
                    />
                    {importJsonInput.trim() && (
                      <button
                        type="submit"
                        className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-200 dark:shadow-none"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Metinden Yükle</span>
                      </button>
                    )}
                  </form>
                </div>

                {/* Google Sheets Apps Script Sync */}
                <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Google E-Tablolara Yedekle</span>
                    </label>
                    <button
                      onClick={() => setShowSheetsHelpModal(true)}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                    >
                      Nasıl Kurulur?
                    </button>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="Apps Script URL'sini buraya yapıştırın"
                      value={appsScriptUrl}
                      onChange={(e) => {
                        setAppsScriptUrl(e.target.value);
                        saveAppsScriptUrl(e.target.value);
                      }}
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-2.5 text-xs text-gray-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600 transition-colors"
                    />
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleSyncToSheets}
                        disabled={!appsScriptUrl.trim() || isSyncing}
                        className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-200 dark:shadow-none active:scale-95"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>{isSyncing ? 'İşleniyor...' : 'Yedekle'}</span>
                      </button>

                      <button
                        onClick={handleRestoreFromSheets}
                        disabled={!appsScriptUrl.trim() || isSyncing}
                        className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-200 dark:shadow-none active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isSyncing ? 'İşleniyor...' : 'Geri Yükle'}</span>
                      </button>
                    </div>
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
                      <span>Varsayılan Verilere Sıfırla</span>
                    </button>
                  ) : (
                    <div className="bg-rose-50/90 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 space-y-3 animate-in fade-in zoom-in-95">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold text-xs text-rose-900 dark:text-rose-200">Emin misiniz?</p>
                          <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                            Mevcut tüm harcamalarınız ve ayarlarınız sıfırlanacaktır.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleConfirmReset}
                          className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm shadow-rose-200 dark:shadow-none"
                        >
                          Evet, Sıfırla
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(false)}
                          className="py-2 px-3 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Vazgeç
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GOOGLE SHEETS HELP MODAL */}
      <AnimatePresence>
        {showSheetsHelpModal && (
          <div className="fixed inset-0 z-[60] bg-gray-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
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
                    <h3 className="font-bold text-base text-gray-900 dark:text-slate-100">Nasıl Kurulur?</h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">Google E-Tablolar Entegrasyonu</p>
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
                          Tarayıcınızda boş bir <strong className="text-indigo-600 dark:text-indigo-400">Google E-Tablo</strong> (Google Sheets) oluşturun.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                        <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium pt-1">
                          Tablonun üst menüsünden <strong className="text-indigo-600 dark:text-indigo-400">Uzantılar &gt; Apps Script</strong> seçeneğine tıklayın.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                        <div className="space-y-2 pt-1">
                          <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium">
                            Açılan ekrandaki mevcut kodları tamamen silin. Aşağıdaki butona tıklayarak Akıllı Kodu kopyalayın ve boş alana yapıştırıp kaydedin.
                          </p>
                          <button 
                            onClick={() => {
                              const code = `function doPost(e) {\n  var d = JSON.parse(e.postData.contents);\n  var ss = SpreadsheetApp.getActiveSpreadsheet();\n  \n  var s1 = ss.getSheetByName("Yedek");\n  if (!s1) { s1 = ss.insertSheet("Yedek"); }\n  s1.clear();\n  s1.getRange(1, 1).setValue(JSON.stringify(d));\n  \n  var s2 = ss.getSheetByName("Harcamalar");\n  if (!s2) { s2 = ss.insertSheet("Harcamalar"); }\n  s2.clear();\n  s2.appendRow(["Tarih", "Tutar", "Açıklama"]);\n  s2.getRange("A1:C1").setFontWeight("bold").setBackground("#d0e0e3");\n  \n  if (d.transactions && d.transactions.length > 0) {\n    var rows = d.transactions.map(function(t) {\n      return [t.date, t.amount, t.description || ""];\n    });\n    s2.getRange(2, 1, rows.length, 3).setValues(rows);\n  }\n  return ContentService.createTextOutput("OK");\n}\n\nfunction doGet(e) {\n  var ss = SpreadsheetApp.getActiveSpreadsheet();\n  var s1 = ss.getSheetByName("Yedek");\n  var data = s1 ? s1.getRange(1, 1).getValue() : "{}";\n  return ContentService.createTextOutput(data).setMimeType(ContentService.MimeType.JSON);\n}`;
                              navigator.clipboard.writeText(code);
                              onShowToast('Kod başarıyla kopyalandı!', 'success');
                            }}
                            className="w-full py-2.5 px-3 bg-gray-900 hover:bg-black text-green-400 rounded-xl font-mono text-[11px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-inner active:scale-[0.98]"
                          >
                            <Copy className="w-4 h-4" />
                            <span>{"// Akıllı Kodu Kopyalamak İçin Tıklayın"}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">4</div>
                        <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium pt-1">
                          Sağ üst köşeden <strong className="text-indigo-600 dark:text-indigo-400">Dağıt &gt; Yeni Dağıtım</strong> (Deploy &gt; New Deployment) butonuna tıklayın.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">5</div>
                        <div className="space-y-1.5 pt-1">
                          <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium">
                            Tür olarak <strong className="text-indigo-600 dark:text-indigo-400">Web Uygulaması</strong>'nı seçin ve şu çok önemli iki ayarı yapın:
                          </p>
                          <ul className="text-[11px] text-gray-600 dark:text-slate-400 list-disc pl-4 space-y-1">
                            <li>Uygulamayı çalıştıracak kişi: <strong>Ben (Me)</strong></li>
                            <li>Kimlerin erişimi var: <strong>Herkes (Anyone)</strong></li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">6</div>
                        <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium pt-1">
                          <strong>Dağıt</strong> butonuna basın. (Google uyarı verirse <i>Erişim Yetkisi Ver &gt; Gelişmiş &gt; Sayfaya Git</i> adımlarını izleyin).
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">7</div>
                        <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium pt-1">
                          Son ekranda verilen uzun <strong className="text-indigo-600 dark:text-indigo-400">Web Uygulaması URL'sini</strong> kopyalayın ve uygulamanızdaki kutucuğa yapıştırın!
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
