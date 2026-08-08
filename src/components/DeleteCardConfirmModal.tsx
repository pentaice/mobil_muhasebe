import React, { useState } from 'react';
import { CreditCard } from '../types';
import { AlertTriangle, Trash2, Archive, X } from 'lucide-react';

interface DeleteCardConfirmModalProps {
  card: CreditCard;
  transactionCount: number;
  onClose: () => void;
  onConfirm: (action: 'keep_records' | 'delete_all') => void;
}

export const DeleteCardConfirmModal: React.FC<DeleteCardConfirmModalProps> = ({
  card,
  transactionCount,
  onClose,
  onConfirm,
}) => {
  const [selectedAction, setSelectedAction] = useState<'keep_records' | 'delete_all'>('keep_records');

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-gray-900 dark:text-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-slate-100 leading-tight">Kartı Sil</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Bu işlem geri alınamaz</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Info */}
        <div className={`bg-gradient-to-r ${card.color} rounded-2xl px-4 py-3 text-white`}>
          <p className="font-bold text-sm">{card.name}</p>
          <p className="text-xs text-white/70 font-mono mt-0.5">{card.cardNetwork.toUpperCase()} •••• {card.last4}</p>
        </div>

        {/* Warning */}
        <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
          <span className="font-semibold text-rose-600 dark:text-rose-400">{card.name}</span> kartını silmek üzeresiniz.
          {transactionCount > 0 && (
            <> Bu karta ait <span className="font-bold">{transactionCount} adet</span> harcama/ödeme kaydı bulunuyor.</>
          )}
        </p>

        {/* Action Selection */}
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
            Kayıtlara ne yapalım?
          </p>

          {/* Option 1: Keep records */}
          <button
            type="button"
            onClick={() => setSelectedAction('keep_records')}
            className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all text-left cursor-pointer ${
              selectedAction === 'keep_records'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              selectedAction === 'keep_records' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-slate-600'
            }`}>
              {selectedAction === 'keep_records' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <p className="text-xs font-bold text-gray-800 dark:text-slate-100">Kayıtları Koru</p>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Kart silinir, harcama ve ödeme kayıtları korunur (kart bağlantısı kesilir).
              </p>
            </div>
          </button>

          {/* Option 2: Delete all */}
          <button
            type="button"
            onClick={() => setSelectedAction('delete_all')}
            className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all text-left cursor-pointer ${
              selectedAction === 'delete_all'
                ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              selectedAction === 'delete_all' ? 'border-rose-500 bg-rose-500' : 'border-gray-300 dark:border-slate-600'
            }`}>
              {selectedAction === 'delete_all' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <p className="text-xs font-bold text-gray-800 dark:text-slate-100">Tümünü Sil</p>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Kart ve bu karta ait tüm kayıtlar kalıcı olarak silinir.
              </p>
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            onClick={() => onConfirm(selectedAction)}
            className={`flex-1 py-3 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
              selectedAction === 'delete_all'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {selectedAction === 'delete_all' ? 'Tümünü Sil' : 'Kartı Sil'}
          </button>
        </div>
      </div>
    </div>
  );
};
