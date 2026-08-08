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
} from 'lucide-react';

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

  const handleExportClick = () => {
    onExportData();
    onShowToast('Yedek JSON dosyası indirildi!', 'success');
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
    onShowToast('Varsayılan örnek bütçe verilerine sıfırlandı!', 'info');
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 max-w-lg mx-auto flex items-center justify-between text-gray-900 shadow-xs transition-all">
        {/* Modern Clean Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold shadow-md shadow-blue-200">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-gray-900 leading-tight">
              Bütçem
            </h1>
            <p className="text-[11px] text-gray-500 font-medium">Kişisel Finans & Kart Takibi</p>
          </div>
        </div>

        {/* Month Summary & Backup Button */}
        <div className="flex items-center gap-2">
          <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl px-3 py-1 text-right shadow-2xs">
            <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold">
              Bu Ay
            </span>
            <span className="text-xs font-black text-gray-900">
              {formatTL(currentMonthExpenses)}
            </span>
          </div>

          <button
            onClick={() => setShowSettingsModal(true)}
            title="Yedekleme & Ayarlar"
            className="w-10 h-10 rounded-2xl bg-gray-100/80 hover:bg-gray-200/80 border border-gray-200 text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </header>

      {/* Settings / Backup Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-3xl w-full max-w-md p-6 shadow-2xl text-gray-900 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-gray-900">Veri Yönetimi & Yedekleme</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Export JSON Button - Highly Visible */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileJson className="w-3.5 h-3.5 text-blue-600" />
                  <span>Verileri Yedekle (JSON İndir)</span>
                </label>
                <p className="text-[11px] text-gray-500">
                  Mevcut tüm harcamalarınızı, kartlarınızı ve kategorilerinizi JSON formatında cihazınıza indirin.
                </p>
                <button
                  onClick={handleExportClick}
                  className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100/80 text-blue-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-blue-200 transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>JSON Veri Yedeğini İndir</span>
                </button>
              </div>

              {/* Import JSON Form */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
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
                  className="w-full py-2.5 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl font-semibold text-xs text-gray-800 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-gray-600" />
                  <span>JSON Dosyası Seç</span>
                </button>

                <form onSubmit={handleImportTextSubmit} className="space-y-2 pt-1">
                  <textarea
                    rows={2}
                    placeholder="Veya yedek JSON metnini buraya yapıştırın..."
                    value={importJsonInput}
                    onChange={(e) => setImportJsonInput(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-2.5 text-xs font-mono text-gray-800 focus:outline-none focus:border-blue-600"
                  />
                  {importJsonInput.trim() && (
                    <button
                      type="submit"
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Metinden Yükle</span>
                    </button>
                  )}
                </form>
              </div>

              {/* Reset Data Option with Confirmation */}
              <div className="pt-3 border-t border-gray-100">
                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-3 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span>Varsayılan Örnek Verilere Sıfırla</span>
                  </button>
                ) : (
                  <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-4 space-y-3 animate-in fade-in zoom-in-95">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-xs text-rose-900">Emin misiniz?</p>
                        <p className="text-[11px] text-rose-800 leading-relaxed">
                          Mevcut tüm harcamalarınız ve ayarlarınız silinecek ve verilen varsayılan örnek bütçe verileri eklenecektir.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleConfirmReset}
                        className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm shadow-rose-200"
                      >
                        Evet, Sıfırla
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="py-2 px-3 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
