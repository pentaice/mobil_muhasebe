import React, { useState } from 'react';
import { CreditCard } from '../types';
import { CreditCard as CardIcon, X, Plus } from 'lucide-react';

interface AddCreditCardModalProps {
  onClose: () => void;
  onAddCard: (card: Omit<CreditCard, 'id'>) => void;
}

const GRADIENT_PRESETS = [
  { label: 'Garanti / Yeşil', value: 'from-emerald-700 via-teal-800 to-slate-900' },
  { label: 'World / Mavi', value: 'from-blue-700 via-indigo-900 to-slate-950' },
  { label: 'Axess / Kırmızı-Turuncu', value: 'from-rose-700 via-amber-800 to-slate-950' },
  { label: 'Maximum / Mor', value: 'from-purple-800 via-indigo-900 to-slate-950' },
  { label: 'Siyah Luxury / Gold', value: 'from-slate-900 via-neutral-900 to-amber-950' },
];

export const AddCreditCardModal: React.FC<AddCreditCardModalProps> = ({
  onClose,
  onAddCard,
}) => {
  const [name, setName] = useState('');
  const [cardNetwork, setCardNetwork] = useState<'visa' | 'mastercard' | 'troy' | 'amex'>('mastercard');
  const [last4, setLast4] = useState('');
  const [limit, setLimit] = useState<string>('50000');
  const [cutoffDay, setCutoffDay] = useState<number>(15);
  const [dueDayOffsetDays, setDueDayOffsetDays] = useState<number>(10);
  const [color, setColor] = useState(GRADIENT_PRESETS[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCard({
      name: name.trim(),
      cardNetwork,
      last4: last4.trim() || '1234',
      limit: parseFloat(limit) || 10000,
      cutoffDay: Number(cutoffDay),
      dueDayOffsetDays: Number(dueDayOffsetDays),
      color,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-gray-100 rounded-3xl w-full max-w-md p-6 shadow-2xl text-gray-900 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CardIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 leading-tight">Yeni Kredi Kartı Ekle</h3>
              <p className="text-xs text-gray-500">Kart ve döngü bilgilerini girin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Kart Adı / Banka
            </label>
            <input
              type="text"
              placeholder="Örn: Garanti Bonus, World, Enpara"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 rounded-2xl py-2.5 px-3 text-xs text-gray-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Card Network */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Kart Tipi
              </label>
              <select
                value={cardNetwork}
                onChange={(e) => setCardNetwork(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 rounded-2xl py-2.5 px-3 text-xs text-gray-800 focus:outline-none"
              >
                <option value="mastercard">Mastercard</option>
                <option value="visa">Visa</option>
                <option value="troy">Troy</option>
                <option value="amex">Amex</option>
              </select>
            </div>

            {/* Last 4 digits */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Son 4 Haneli
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="4821"
                value={last4}
                onChange={(e) => setLast4(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 rounded-2xl py-2.5 px-3 text-xs text-gray-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Limit */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Kart Limiti (₺)
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="50000"
              required
              className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 rounded-2xl py-2.5 px-3 text-xs text-gray-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Cutoff Day */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Hesap Kesim Günü
              </label>
              <select
                value={cutoffDay}
                onChange={(e) => setCutoffDay(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 rounded-2xl py-2.5 px-3 text-xs text-gray-800 focus:outline-none"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    Her ayın {day}. günü
                  </option>
                ))}
              </select>
            </div>

            {/* Due Offset */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Son Ödeme
              </label>
              <select
                value={dueDayOffsetDays}
                onChange={(e) => setDueDayOffsetDays(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 rounded-2xl py-2.5 px-3 text-xs text-gray-800 focus:outline-none"
              >
                <option value={10}>Kesimden 10 gün sonra</option>
                <option value={12}>Kesimden 12 gün sonra</option>
                <option value={15}>Kesimden 15 gün sonra</option>
              </select>
            </div>
          </div>

          {/* Card Theme */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Kart Görünümü / Tema
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GRADIENT_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setColor(preset.value)}
                  className={`h-10 rounded-xl bg-gradient-to-r ${preset.value} border transition-all cursor-pointer ${
                    color === preset.value
                      ? 'border-blue-600 ring-2 ring-blue-500/50 scale-105'
                      : 'border-gray-200 opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Kartı Kaydet</span>
          </button>
        </form>
      </div>
    </div>
  );
};
