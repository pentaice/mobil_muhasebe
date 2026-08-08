import React, { useState } from 'react';
import { CreditCard, Transaction } from '../types';
import { calculateCardCycleInfo, formatTL } from '../utils/storage';
import { CreditCardPaymentModal } from './CreditCardPaymentModal';
import { AddCreditCardModal } from './AddCreditCardModal';
import { EditCreditCardModal } from './EditCreditCardModal';
import { DeleteCardConfirmModal } from './DeleteCardConfirmModal';
import { CreditCard as CardIcon, Plus, ShieldCheck, Trash2, Pencil } from 'lucide-react';

interface CreditCardsViewProps {
  cards: CreditCard[];
  transactions: Transaction[];
  onAddCard: (card: Omit<CreditCard, 'id'>) => void;
  onDeleteCard: (cardId: string, action: 'keep_records' | 'delete_all') => void;
  onAddPayment: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdateCard: (card: CreditCard) => void;
}

export const CreditCardsView: React.FC<CreditCardsViewProps> = ({
  cards,
  transactions,
  onAddCard,
  onDeleteCard,
  onAddPayment,
  onUpdateCard,
}) => {
  const [selectedCardForPayment, setSelectedCardForPayment] = useState<CreditCard | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedCardForEdit, setSelectedCardForEdit] = useState<CreditCard | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);

  // Total credit cards debt across all cards
  const totalAllCardsDebt = cards.reduce((sum, card) => {
    const info = calculateCardCycleInfo(card, transactions);
    return sum + info.totalUnpaidDebt;
  }, 0);

  const totalAllCardsLimit = cards.reduce((sum, card) => sum + card.limit, 0);

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 pb-8">
      {/* Top Total Debt Overview */}
      <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-5 shadow-sm text-gray-900 dark:text-slate-100 flex items-center justify-between transition-colors">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-slate-400 font-semibold">
            Toplam Kart Borçları
          </p>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            {formatTL(totalAllCardsDebt)}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            Kullanılabilir Toplam Limit: {formatTL(Math.max(0, totalAllCardsLimit - totalAllCardsDebt))}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-3.5 rounded-2xl flex items-center gap-1.5 shadow-md shadow-blue-200 dark:shadow-none transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Kart Ekle</span>
        </button>
      </div>

      {/* Credit Cards List */}
      <div className="space-y-4">
        {cards.length === 0 ? (
          <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-8 text-center space-y-3 shadow-sm transition-colors">
            <CardIcon className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto" />
            <p className="text-gray-800 dark:text-slate-200 font-bold text-sm">Kayıtlı Kredi Kartınız Bulunmuyor</p>
            <p className="text-gray-500 dark:text-slate-400 text-xs">
              Hesap kesim döngülerini ve borçlarınızı takip etmek için ilk kartınızı ekleyebilirsiniz.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-200 dark:shadow-none"
            >
              <Plus className="w-4 h-4" /> Kart Ekle
            </button>
          </div>
        ) : (
          cards.map((card) => {
            const cycle = calculateCardCycleInfo(card, transactions);
            const usagePercent = Math.min(100, (cycle.totalUnpaidDebt / card.limit) * 100);

            return (
              <div
                key={card.id}
                className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl overflow-hidden shadow-sm space-y-4 transition-colors"
              >
                {/* Physical Card Graphic */}
                <div
                  className={`bg-gradient-to-r ${card.color} p-5 text-white space-y-4 relative overflow-hidden shadow-xs`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-lg tracking-wide">{card.name}</p>
                      <p className="text-xs text-white/80 uppercase tracking-widest font-mono">
                        {card.cardNetwork} •••• {card.last4}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCardToDelete(card)}
                        title="Kartı Sil"
                        className="text-white/80 hover:text-rose-200 bg-black/20 hover:bg-black/30 p-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedCardForEdit(card); setShowEditModal(true); }}
                        title="Kartı Düzenle"
                        className="text-white/80 hover:text-blue-200 bg-black/20 hover:bg-black/30 p-1.5 rounded-lg transition-colors cursor-pointer ml-1"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Debt & Limit Info */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20">
                    <div>
                      <p className="text-[10px] uppercase text-white/80 font-semibold">
                        Kalan Limit
                      </p>
                      <p className="text-base font-bold text-white">
                        {formatTL(cycle.availableLimit)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] uppercase text-white/80 font-semibold">
                        Mevcut Toplam Borç
                      </p>
                      <p className="text-base font-extrabold text-white">
                        {formatTL(cycle.totalUnpaidDebt)}
                      </p>
                    </div>
                  </div>

                  {/* Limit Usage Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/80 font-medium">
                      <span>Limit Kullanımı (%{usagePercent.toFixed(0)})</span>
                      <span>{formatTL(card.limit)}</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          usagePercent > 80
                            ? 'bg-rose-400'
                            : usagePercent > 50
                            ? 'bg-amber-300'
                            : 'bg-emerald-300'
                        }`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Cycle Info & Action */}
                <div className="px-5 pb-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-gray-200/80 dark:border-slate-700">
                    <div>
                      <span className="text-gray-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">Hesap Kesim Günü</span>
                      <span className="font-bold text-gray-800 dark:text-slate-200">
                        Her Ayın {card.cutoffDay}. Günü
                      </span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block mt-0.5">
                        ({cycle.daysUntilCutoff} gün kaldı)
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">Dönem İçi Harcama</span>
                      <span className="font-bold text-gray-800 dark:text-slate-200">
                        {formatTL(cycle.currentCycleExpenses)}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                        Ödenen: {formatTL(cycle.currentCyclePayments)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <button
                    onClick={() => setSelectedCardForPayment(card)}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-200 dark:shadow-none transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-white/90" />
                    <span>Ödeme Gir / Dönem Borcu Kapat</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payment Modal */}
      {selectedCardForPayment && (
        <CreditCardPaymentModal
          card={selectedCardForPayment}
          transactions={transactions}
          onClose={() => setSelectedCardForPayment(null)}
          onAddPayment={onAddPayment}
        />
      )}

      {/* Add Card Modal */}
      {showAddModal && (
        <AddCreditCardModal
          onClose={() => setShowAddModal(false)}
          onAddCard={onAddCard}
        />
      )}

      {/* Edit Card Modal */}
      {showEditModal && selectedCardForEdit && (
        <EditCreditCardModal
          card={selectedCardForEdit}
          onClose={() => { setShowEditModal(false); setSelectedCardForEdit(null); }}
          onUpdateCard={onUpdateCard}
        />
      )}

      {/* Delete Card Confirm Modal */}
      {cardToDelete && (
        <DeleteCardConfirmModal
          card={cardToDelete}
          transactionCount={transactions.filter(t => t.cardId === cardToDelete.id).length}
          onClose={() => setCardToDelete(null)}
          onConfirm={(action) => {
            onDeleteCard(cardToDelete.id, action);
            setCardToDelete(null);
          }}
        />
      )}
    </div>
  );
};
