import React, { useState, useRef, useEffect } from 'react';
import { Category, CreditCard, Transaction, RecurringExpense, IncomeCategory } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatTL, loadQuickAmounts, saveQuickAmounts, DEFAULT_QUICK_AMOUNTS } from '../utils/storage';
import { useI18n } from '../i18n/I18nContext';
import { RecurringExpensesModal } from './RecurringExpensesModal';
import { useBackHandler } from '../utils/backButton';
import { parseVoiceExpense, getSpeechRecognitionLocale, ParsedVoiceResult } from '../utils/voiceParser';
import {
  Zap,
  CreditCard as CardIcon,
  Wallet,
  Plus,
  Calendar,
  ChevronDown,
  ChevronUp,
  Settings2,
  X,
  RotateCcw,
  Check,
  Info,
  CalendarClock,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Mic,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickAddExpenseProps {
  categories: Category[];
  incomeCategories: IncomeCategory[];
  cards: CreditCard[];
  recurringExpenses: RecurringExpense[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onOpenAddCategoryModal: () => void;
  onAddRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'createdAt'>) => void;
  onUpdateRecurringExpense: (expense: RecurringExpense) => void;
  onDeleteRecurringExpense: (id: string) => void;
  onOpenInvestments?: () => void;
  totalInvestmentsValue?: number;
  liquidCashBalance?: number;
  isScrolled?: boolean;
  doubleTapKeyboardTrigger?: number;
  onRegisterVoiceTrigger?: (fn: () => void) => void;
}

export const QuickAddExpense: React.FC<QuickAddExpenseProps> = ({
  categories,
  incomeCategories,
  cards,
  recurringExpenses,
  onAddTransaction,
  onOpenAddCategoryModal,
  onAddRecurringExpense,
  onUpdateRecurringExpense,
  onDeleteRecurringExpense,
  onOpenInvestments,
  totalInvestmentsValue = 0,
  liquidCashBalance,
  isScrolled = false,
  doubleTapKeyboardTrigger,
  onRegisterVoiceTrigger,
}) => {
  const { t: i18n, formatCurrency, currency, lang } = useI18n();
  const [entryType, setEntryType] = useState<'expense' | 'income'>('expense');
  const [showRecurringModal, setShowRecurringModal] = useState<boolean>(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || 'cat-yemek');
  const [selectedIncomeCategoryId, setSelectedIncomeCategoryId] = useState<string>(incomeCategories[0]?.id || 'inc-maas');
  const [amountStr, setAmountStr] = useState<string>('');
  const [sourceType, setSourceType] = useState<'credit_card' | 'cash_bank'>(cards.length > 0 ? 'credit_card' : 'cash_bank');
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [note, setNote] = useState<string>('');
  const [showDetailsDrawer, setShowDetailsDrawer] = useState<boolean>(false);
  const [isCustomDate, setIsCustomDate] = useState<boolean>(false);
  const [customDateTime, setCustomDateTime] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );

  // Customizable Quick Preset Amounts
  const [quickAmounts, setQuickAmounts] = useState<number[]>(() => loadQuickAmounts());
  const [showQuickAmountModal, setShowQuickAmountModal] = useState<boolean>(false);
  const [newQuickAmountInput, setNewQuickAmountInput] = useState<string>('');

  // Voice Recording & Parsing State
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceParsed, setVoiceParsed] = useState<ParsedVoiceResult | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Register voice trigger function for BottomNav when in scrolled mic mode
  useEffect(() => {
    onRegisterVoiceTrigger?.(() => {
      handleToggleVoice();
    });
  }, [isVoiceModalOpen, isListening]);

  // Handle double-tap on Hızlı Ekle: opens mobile keyboard without hiding mic!
  useEffect(() => {
    if (!doubleTapKeyboardTrigger || doubleTapKeyboardTrigger === 0) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 100);
  }, [doubleTapKeyboardTrigger]);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(i18n.voiceNotSupported || 'Bu tarayıcıda Web Speech API desteği bulunamadı. Lütfen Google Chrome veya Edge kullanın.');
      return;
    }

    if (window.isSecureContext === false && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setVoiceError('Güvenlik Uyarısı: Tarayıcılar ses ve mikrofon özelliğine yalnızca "http://localhost" veya "https://" üzerinden izin verir.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) { /* ignore */ }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Tekil ve kararlı cümle tanıma
      recognition.interimResults = true;
      recognition.lang = getSpeechRecognitionLocale(lang);

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        const cleanTranscript = fullTranscript.trim();
        setVoiceTranscript(cleanTranscript);

        const parsed = parseVoiceExpense(
          cleanTranscript,
          categories,
          incomeCategories,
          cards,
          lang
        );
        setVoiceParsed(parsed);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error, event);
        if (event.error === 'not-allowed') {
          setVoiceError('Mikrofon erişimi engellendi. Lütfen tarayıcı adres çubuğundaki kilit simgesine tıklayıp mikrofona "İzin Ver" seçeneğini işaretleyin.');
        } else if (event.error === 'network') {
          setVoiceError('Ses tanıma servisine ulaşılamadı. İnternet bağlantınızı kontrol edin.');
        } else if (event.error === 'audio-capture') {
          setVoiceError('Mikrofon algılanamadı veya bağlı değil.');
        } else if (event.error === 'no-speech') {
          setVoiceError('Ses duyulmadı. Lütfen mikrofona yakın konuşarak tekrar deneyin.');
        } else {
          setVoiceError(`Ses uyarısı: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start(); // SYNCHRONOUS IN DIRECT USER CLICK!
    } catch (err: any) {
      console.error('SpeechRecognition start error:', err);
      setVoiceError(err?.message || 'Mikrofon başlatılamadı.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) { /* ignore */ }
      }
    };
  }, []);

  const handleStartVoice = () => {
    setVoiceTranscript('');
    setVoiceParsed(null);
    setVoiceError(null);
    setIsVoiceModalOpen(true);
    startListening();
  };

  const handleCancelVoice = () => {
    stopListening();
    setIsVoiceModalOpen(false);
    setVoiceTranscript('');
    setVoiceParsed(null);
    setVoiceError(null);
  };

  const handleToggleVoice = () => {
    if (!isVoiceModalOpen) {
      handleStartVoice();
    } else if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSaveVoice = () => {
    if (!voiceParsed || voiceParsed.amount <= 0) return;
    stopListening();

    const txDate = new Date().toISOString();

    if (voiceParsed.type === 'income') {
      onAddTransaction({
        type: 'income',
        amount: voiceParsed.amount,
        categoryId: voiceParsed.categoryId || incomeCategories[0]?.id || 'inc-maas',
        sourceType: 'cash_bank',
        date: txDate,
        note: voiceParsed.note.trim() || undefined,
      });
    } else {
      onAddTransaction({
        type: 'expense',
        amount: voiceParsed.amount,
        categoryId: voiceParsed.categoryId || categories[0]?.id || 'cat-diger',
        sourceType: cards.length > 0 ? voiceParsed.sourceType : 'cash_bank',
        creditCardId:
          voiceParsed.sourceType === 'credit_card' && cards.length > 0
            ? voiceParsed.creditCardId || cards[0]?.id
            : undefined,
        date: txDate,
        note: voiceParsed.note.trim() || undefined,
      });
    }

    setIsVoiceModalOpen(false);
    setVoiceTranscript('');
    setVoiceParsed(null);
    setVoiceError(null);
  };

  useBackHandler(() => {
    if (isVoiceModalOpen) {
      handleCancelVoice();
      return;
    }
    if (showQuickAmountModal) {
      setShowQuickAmountModal(false);
      return;
    }
    if (showRecurringModal) {
      setShowRecurringModal(false);
      return;
    }
  }, isVoiceModalOpen || showQuickAmountModal || showRecurringModal);

  const amountInputRef = useRef<HTMLInputElement>(null);
  const amountNumber = parseFloat(amountStr) || 0;

  // NOT: Otomatik klavye açma kaldırıldı. Klavye sadece tutar alanına dokunulduğunda açılacaktır.

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseFloat(amountStr) || 0;
    setAmountStr((current + addValue).toString());
  };

  const handleClearAmount = () => {
    setAmountStr('');
  };

  // Preset customization handlers
  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newQuickAmountInput);
    if (!val || val <= 0) return;
    if (quickAmounts.includes(val)) {
      setNewQuickAmountInput('');
      return;
    }
    const updated = [...quickAmounts, val].sort((a, b) => a - b);
    setQuickAmounts(updated);
    saveQuickAmounts(updated);
    setNewQuickAmountInput('');
  };

  const handleRemovePreset = (valToRemove: number) => {
    const updated = quickAmounts.filter((v) => v !== valToRemove);
    setQuickAmounts(updated);
    saveQuickAmounts(updated);
  };

  const handleResetPresets = () => {
    setQuickAmounts(DEFAULT_QUICK_AMOUNTS);
    saveQuickAmounts(DEFAULT_QUICK_AMOUNTS);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountNumber || amountNumber <= 0) return;

    const txDate = isCustomDate ? new Date(customDateTime).toISOString() : new Date().toISOString();

    if (entryType === 'income') {
      onAddTransaction({
        type: 'income',
        amount: amountNumber,
        categoryId: selectedIncomeCategoryId,
        sourceType: 'cash_bank',
        date: txDate,
        note: note.trim() || undefined,
      });
    } else {
      onAddTransaction({
        type: 'expense',
        amount: amountNumber,
        categoryId: selectedCategoryId,
        sourceType: cards.length > 0 ? sourceType : 'cash_bank',
        creditCardId: sourceType === 'credit_card' && cards.length > 0 ? selectedCardId : undefined,
        date: txDate,
        note: note.trim() || undefined,
      });
    }

    // Reset inputs for next fast entry
    setAmountStr('');
    setNote('');
    setIsCustomDate(false);
    setShowDetailsDrawer(false);
    if (entryType === 'income') {
      setEntryType('expense');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Compact Main Card Container (ALWAYS AT TOP) */}
      <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750/80 rounded-3xl p-4 shadow-sm text-gray-900 dark:text-slate-100 relative overflow-hidden transition-colors">
        
        {/* If in Income Mode, show an elegant compact banner to switch back */}
        {entryType === 'income' && (
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-emerald-100 dark:border-emerald-900/40">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
              <ArrowUpRight className="w-4 h-4" />
              <span>{i18n.incomeMode}</span>
            </div>
            <button
              type="button"
              onClick={() => setEntryType('expense')}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>{i18n.backToExpenseMode}</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* AMOUNT INPUT & QUICK CHIPS */}
          <div className="space-y-1.5">
            <div className="relative">
              <input
                ref={amountInputRef}
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className={`w-full bg-gray-50 dark:bg-slate-800 border-2 rounded-2xl py-2.5 pl-3.5 pr-12 text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight focus:outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-slate-600 ${
                  entryType === 'income'
                    ? 'border-emerald-200 dark:border-emerald-900/60 focus:border-emerald-600 dark:focus:border-emerald-500'
                    : 'border-gray-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500'
                }`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {amountStr && (
                  <button
                    type="button"
                    onClick={handleClearAmount}
                    className="text-[10px] text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 bg-gray-200/80 dark:bg-slate-700 px-1.5 py-0.5 rounded cursor-pointer font-semibold"
                  >
                    {i18n.clear}
                  </button>
                )}
                <span className={`text-lg font-bold ${entryType === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {currency.symbol}
                </span>
              </div>
            </div>

            {/* Fast increment chips */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar scrollbar-none flex-1">
                {quickAmounts.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAddAmount(val)}
                    className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 active:scale-95 text-gray-800 dark:text-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-gray-200/80 dark:border-slate-700 whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-2xs"
                  >
                    +{val}{currency.symbol}
                  </button>
                ))}
              </div>

              {/* Edit Quick Amounts Button */}
              <button
                type="button"
                onClick={() => setShowQuickAmountModal(true)}
                title={i18n.editQuickAmounts}
                className="p-1.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer shrink-0"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CATEGORY & SOURCE SECTION */}
          {entryType === 'expense' ? (
            <>
              {/* EXPENSE CATEGORY SELECTION */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                    {i18n.category}
                  </span>
                  <button
                    type="button"
                    onClick={onOpenAddCategoryModal}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-0.5 font-bold cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{i18n.add}</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                  {categories.map((cat) => {
                    const isSelected = cat.id === selectedCategoryId;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`relative flex flex-col items-center justify-center p-1.5 min-h-[60px] rounded-xl transition-all duration-150 border text-center cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 shadow-2xs scale-[1.02]'
                            : 'bg-gray-50/70 dark:bg-slate-800/60 border-gray-200/80 dark:border-slate-750 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-650'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center mb-1 text-white shadow-2xs shrink-0"
                          style={{ backgroundColor: cat.color }}
                        >
                          <CategoryIcon name={cat.icon} size={13} />
                        </div>
                        <span
                          className={`text-[9.5px] leading-[1.15] font-semibold text-center w-full break-words line-clamp-2 px-0.5 ${
                            isSelected ? 'text-blue-900 dark:text-blue-200 font-bold' : 'text-gray-700 dark:text-slate-300'
                          }`}
                        >
                          {cat.name}
                        </span>

                        {isSelected && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PAYMENT SOURCE SELECTOR (KREDİ KARTI VEYA NAKİT/BANKA) */}
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSourceType('credit_card')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      sourceType === 'credit_card'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-300 shadow-2xs'
                        : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-300'
                    }`}
                  >
                    <CardIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{i18n.creditCard}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceType('cash_bank')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      sourceType === 'cash_bank'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500 text-emerald-900 dark:text-emerald-300 shadow-2xs'
                        : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-300'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{i18n.cashBank}</span>
                    {liquidCashBalance !== undefined && (
                      <span className="text-[10px] font-mono opacity-85 font-semibold">
                        ({formatCurrency(liquidCashBalance)})
                      </span>
                    )}
                  </button>
                </div>

                {/* Select Credit Card if Credit Card selected */}
                {sourceType === 'credit_card' && (
                  <select
                    value={selectedCardId}
                    onChange={(e) => setSelectedCardId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-1.5 px-2.5 text-xs text-gray-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-blue-600"
                  >
                    {cards.length === 0 ? (
                      <option value="" disabled>{i18n.noCardsYet}</option>
                    ) : (
                      cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          💳 {card.name} (*{card.last4})
                        </option>
                      ))
                    )}
                  </select>
                )}

                {sourceType === 'credit_card' && cards.length === 0 && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
                    <span>{i18n.noCardsYet}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* INCOME SOURCE SELECTION */
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {i18n.incomeCategory}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {incomeCategories.map((cat) => {
                  const isSelected = cat.id === selectedIncomeCategoryId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedIncomeCategoryId(cat.id)}
                      className={`relative flex flex-col items-center justify-center p-2 min-h-[64px] rounded-xl transition-all duration-150 border text-center cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500 shadow-2xs scale-[1.02]'
                          : 'bg-gray-50/70 dark:bg-slate-800/60 border-gray-200/80 dark:border-slate-750 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-650'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center mb-1 text-white shadow-2xs shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} size={14} />
                      </div>
                      <span
                        className={`text-[10px] leading-[1.15] font-semibold text-center w-full break-words line-clamp-1 px-0.5 ${
                          isSelected ? 'text-emerald-900 dark:text-emerald-200 font-bold' : 'text-gray-700 dark:text-slate-300'
                        }`}
                      >
                        {cat.name}
                      </span>

                      {isSelected && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Income Destination Note */}
              <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{i18n.addedToCashNotice}</span>
              </div>
            </div>
          )}

          {/* ACCORDION/DRAWER FOR OPTIONAL DETAILS */}
          <div className="border-t border-gray-100 dark:border-slate-800 pt-1.5">
            <button
              type="button"
              onClick={() => setShowDetailsDrawer(!showDetailsDrawer)}
              className="w-full flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold py-1 px-1 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1">
                <Plus className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 transition-transform ${showDetailsDrawer ? 'rotate-45' : ''}`} />
                <span>{showDetailsDrawer ? i18n.hideDetails : i18n.addNoteOrDate}</span>
              </span>
              {showDetailsDrawer ? (
                <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>

            <AnimatePresence>
              {showDetailsDrawer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-2 pt-2 overflow-hidden"
                >
                  <input
                    type="text"
                    placeholder={i18n.notePlaceholder}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-1.5 px-2.5 text-base md:text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-600"
                  />

                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsCustomDate(!isCustomDate)}
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold cursor-pointer"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>{isCustomDate ? i18n.returnToCurrentDate : i18n.chooseDifferentDate}</span>
                    </button>
                  </div>

                  {isCustomDate && (
                    <input
                      type="datetime-local"
                      value={customDateTime}
                      onChange={(e) => setCustomDateTime(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-1.5 px-2.5 text-base md:text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:border-blue-600"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={!amountNumber || amountNumber <= 0}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
              amountNumber > 0
                ? entryType === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 dark:shadow-none cursor-pointer'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none cursor-pointer'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>
              {entryType === 'income' ? i18n.saveIncome : i18n.saveExpense} (
              {amountNumber > 0 ? formatCurrency(amountNumber) : `${currency.symbol}0`})
            </span>
          </button>
        </form>
      </div>

      {/* INCOME QUICK ACTION BUTTON / MODULE */}
      <button
        type="button"
        onClick={() => {
          setEntryType('income');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="w-full mt-3.5 p-4 min-h-[66px] bg-white dark:bg-slate-850 hover:bg-emerald-50/50 dark:hover:bg-slate-800/90 border border-gray-100 dark:border-slate-750/80 rounded-3xl flex items-center justify-between transition-all cursor-pointer shadow-sm group active:scale-[0.99] text-gray-900 dark:text-slate-100"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-gray-900 dark:text-slate-100 leading-tight">
                {i18n.saveIncome}
              </span>
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {i18n.salaryAndIncome}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">
              {i18n.salarySubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold pl-2 shrink-0">
          <span className="hidden sm:inline">{i18n.incomeMode}</span>
          <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* RECURRING EXPENSES ACTION BUTTON / MODULE (UNDER MAIN COMPONENT) */}
      <button
        type="button"
        onClick={() => setShowRecurringModal(true)}
        className="w-full mt-2.5 p-4 min-h-[66px] bg-white dark:bg-slate-850 hover:bg-indigo-50/50 dark:hover:bg-slate-800/90 border border-gray-100 dark:border-slate-750/80 rounded-3xl flex items-center justify-between transition-all cursor-pointer shadow-sm group active:scale-[0.99] text-gray-900 dark:text-slate-100"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-gray-900 dark:text-slate-100 leading-tight">
                {i18n.recurringExpenses}
              </span>
              {recurringExpenses.filter((e) => e.isActive).length > 0 ? (
                <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {recurringExpenses.filter((e) => e.isActive).length} {i18n.activeTab}
                </span>
              ) : (
                <span className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {i18n.addNew}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">
              {recurringExpenses.filter((e) => e.isActive).length > 0
                ? `${formatCurrency(recurringExpenses.filter((e) => e.isActive).reduce((sum, e) => sum + Number(e.amount), 0))} / ${i18n.monthly.toLowerCase()} • ${i18n.recurringSubtitle}`
                : i18n.recurringSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-bold pl-2 shrink-0">
          <span className="hidden sm:inline">{i18n.viewAction}</span>
          <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* INVESTMENTS SUMMARY & QUICK NAV BUTTON */}
      {onOpenInvestments && (
        <button
          type="button"
          onClick={onOpenInvestments}
          className="w-full mt-2.5 p-4 min-h-[66px] bg-white dark:bg-slate-850 hover:bg-teal-50/50 dark:hover:bg-slate-800/90 border border-gray-100 dark:border-slate-750/80 rounded-3xl flex items-center justify-between transition-all cursor-pointer shadow-sm group active:scale-[0.99] text-gray-900 dark:text-slate-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-gray-900 dark:text-slate-100 leading-tight">
                  {i18n.investments} {i18n.portfolioSuffix}
                </span>
                <span className="bg-teal-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {formatCurrency(totalInvestmentsValue || 0)}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                {i18n.investSurplusSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 text-xs font-bold pl-2 shrink-0">
            <span className="hidden sm:inline">{i18n.goToPortfolio}</span>
            <div className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </button>
      )}

      {/* QUICK AMOUNT CUSTOMIZATION MODAL */}
      <AnimatePresence>
        {showQuickAmountModal && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-750 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Settings2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100">{i18n.editQuickAmounts}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickAmountModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Existing preset chips with delete badge */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-2">{i18n.existingButtons}</label>
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((val) => (
                    <div
                      key={val}
                      className="bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-xs font-bold py-1 px-2.5 rounded-xl flex items-center gap-1.5"
                    >
                      <span>+{val}{currency.symbol}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePreset(val)}
                        title={i18n.delete}
                        className="hover:text-rose-600 text-gray-400 cursor-pointer p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Preset Form */}
              <form onSubmit={handleAddPreset} className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                  {i18n.addNewAmount}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={i18n.amountPlaceholder}
                    value={newQuickAmountInput}
                    onChange={(e) => setNewQuickAmountInput(e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-base md:text-sm font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{i18n.add}</span>
                  </button>
                </div>
              </form>

              {/* Reset to Defaults / Done */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetPresets}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{i18n.resetToDefaults}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQuickAmountModal(false)}
                  className="bg-gray-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{i18n.done}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECURRING EXPENSES MODAL */}
      <RecurringExpensesModal
        isOpen={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        recurringExpenses={recurringExpenses}
        categories={categories}
        cards={cards}
        onAddRecurringExpense={onAddRecurringExpense}
        onUpdateRecurringExpense={onUpdateRecurringExpense}
        onDeleteRecurringExpense={onDeleteRecurringExpense}
      />

      {/* FLOATING ACTION CLUSTER (MIC IN FIXED COLUMN 0, ÇARPI & OK IMMEDIATELY NEXT TO IT) */}
      {(isVoiceModalOpen || !isScrolled) && (
        <div className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-0 right-0 max-w-md mx-auto pointer-events-none z-50 px-1">
          <div className="grid grid-cols-4 items-center">
            {/* Column 0: Mikrofon Butonu (Konumu hiç değişmez, aynı yerde sabit kalır) */}
            <div className="flex justify-center pointer-events-auto">
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`w-12 h-12 rounded-full text-white shadow-lg flex items-center justify-center transition-all cursor-pointer relative shrink-0 active:scale-95 ${
                  isListening
                    ? 'bg-blue-600 ring-4 ring-blue-400/60 shadow-blue-500/50 scale-105'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                }`}
                title={isListening ? 'Dinlemeyi Durdur' : i18n.voiceRecordTitle}
              >
                {/* Konuşma Esnasında Ses Dalgası ve Titreşim Animasyonları */}
                {isListening && (
                  <>
                    <span className="absolute -inset-3 rounded-full bg-blue-500/25 animate-ping pointer-events-none" />
                    <span className="absolute -inset-1.5 rounded-full border-2 border-blue-400 animate-pulse pointer-events-none" />
                    <span className="absolute -inset-4 rounded-full border border-blue-400/40 animate-ping [animation-duration:2s] pointer-events-none" />
                  </>
                )}
                <Mic className={`w-6 h-6 stroke-[2.2] fill-none ${isListening ? 'animate-bounce [animation-duration:1s]' : ''}`} />
              </button>
            </div>

            {/* Column 1: Kırmızı Çarpı Butonu (Mikrofonun hemen sağında açılır) */}
            <div className="flex justify-center pointer-events-auto">
              <AnimatePresence>
                {isVoiceModalOpen && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5, x: -15 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.5, x: -15 }}
                    transition={{ duration: 0.18 }}
                    type="button"
                    onClick={handleCancelVoice}
                    className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-lg shadow-rose-600/40 flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title={i18n.voiceCancel}
                  >
                    <X className="w-6 h-6 stroke-[2.5]" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Column 2: Yeşil Ok Butonu (Çarpı'nın hemen sağında açılır) */}
            <div className="flex justify-center pointer-events-auto">
              <AnimatePresence>
                {isVoiceModalOpen && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5, x: -15 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.5, x: -15 }}
                    transition={{ duration: 0.18 }}
                    type="button"
                    onClick={handleSaveVoice}
                    disabled={!voiceParsed || voiceParsed.amount <= 0}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      voiceParsed && voiceParsed.amount > 0
                        ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-lg shadow-emerald-600/40'
                        : 'bg-emerald-950/70 text-emerald-600/40 cursor-not-allowed border border-emerald-800/40'
                    }`}
                    title={i18n.voiceSave}
                  >
                    <Check className="w-6 h-6 stroke-[3]" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Column 3: Boş (Hizalamayı korur) */}
            <div />
          </div>
        </div>
      )}

      {/* VOICE RECORDING & LIVE PARSING MODAL (DIMMED OVERLAY) */}
      <AnimatePresence>
        {isVoiceModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col justify-between pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(8.5rem+env(safe-area-inset-bottom))] px-4 text-white overflow-y-auto no-scrollbar"
          >
            {/* Top Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 max-w-md mx-auto w-full">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isListening ? 'bg-blue-600 text-white animate-pulse' : 'bg-white/10 text-white/70'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">{i18n.voiceRecordTitle}</h3>
                  <p className="text-[11px] text-white/60">
                    {isListening ? i18n.voiceListening : i18n.voiceTapToStart}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/80">
                {lang.toUpperCase()}
              </span>
            </div>

            {/* Middle Section: Speech Transcript & Parsed Transaction Cards */}
            <div className="my-auto py-3 space-y-4 max-w-sm mx-auto w-full">
              {/* Live White Transcript Display */}
              <div className="min-h-[85px] flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center shadow-inner space-y-2">
                {voiceTranscript ? (
                  <p className="text-white text-lg sm:text-xl font-bold leading-snug">
                    "{voiceTranscript}"
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-white/80 text-sm font-semibold animate-pulse">
                      {isListening ? i18n.voiceListening : i18n.voiceTapToStart}
                    </p>
                    <p className="text-white/40 text-[11px]">
                      {i18n.voiceTranscriptHint}
                    </p>
                  </div>
                )}

                {/* Konuşma Esnasında Ses Dalgası / Equalizer Animasyonu */}
                {isListening && (
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    <span className="w-1 h-3 bg-blue-400 rounded-full animate-pulse [animation-duration:0.6s] [animation-delay:0.1s]" />
                    <span className="w-1 h-6 bg-blue-400 rounded-full animate-pulse [animation-duration:0.6s] [animation-delay:0.2s]" />
                    <span className="w-1 h-8 bg-cyan-400 rounded-full animate-pulse [animation-duration:0.6s] [animation-delay:0.3s]" />
                    <span className="w-1 h-6 bg-blue-400 rounded-full animate-pulse [animation-duration:0.6s] [animation-delay:0.4s]" />
                    <span className="w-1 h-3 bg-blue-400 rounded-full animate-pulse [animation-duration:0.6s] [animation-delay:0.5s]" />
                  </div>
                )}
              </div>

              {/* Voice Error notice with retry button */}
              {voiceError && (
                <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs text-center space-y-2">
                  <p className="font-medium leading-relaxed">{voiceError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceError(null);
                      startListening();
                    }}
                    className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-xl cursor-pointer transition-all shadow-sm"
                  >
                    Mikrofonu Tekrar Başlat
                  </button>
                </div>
              )}

              {/* Parsed Selections Card */}
              {voiceParsed && (
                <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-4 space-y-3.5 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      {i18n.voiceDetectedDetails}
                    </span>
                    <span className="text-[10px] text-white/50">
                      {i18n.voiceEditHint}
                    </span>
                  </div>

                  {/* Amount & Currency */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                      {i18n.amount}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        placeholder="0"
                        value={voiceParsed.amount && voiceParsed.amount > 0 ? voiceParsed.amount : ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setVoiceParsed({ ...voiceParsed, amount: val });
                        }}
                        className="w-full bg-white/10 border-2 border-white/20 focus:border-blue-400 rounded-2xl py-2 pl-3.5 pr-12 text-2xl font-black text-white placeholder:text-white/30 focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-blue-400">
                        {currency.symbol}
                      </span>
                    </div>
                  </div>

                  {/* Transaction Type (Expense vs Income) */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVoiceParsed({ ...voiceParsed, type: 'expense' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                        voiceParsed.type === 'expense'
                          ? 'bg-rose-500/30 border-rose-400 text-rose-200 shadow-sm'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" />
                      <span>{i18n.expense}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceParsed({ ...voiceParsed, type: 'income', sourceType: 'cash_bank' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                        voiceParsed.type === 'income'
                          ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-sm'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{i18n.incomeMode}</span>
                    </button>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                      {i18n.category}
                    </label>
                    <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar scrollbar-none">
                      {(voiceParsed.type === 'income' ? incomeCategories : categories).map((cat) => {
                        const isSel = voiceParsed.categoryId === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setVoiceParsed({ ...voiceParsed, categoryId: cat.id })}
                            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                              isSel
                                ? 'bg-blue-600 border-blue-400 text-white shadow-sm ring-2 ring-blue-400/40'
                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            <div
                              className="w-4 h-4 rounded-md flex items-center justify-center text-white"
                              style={{ backgroundColor: cat.color }}
                            >
                              <CategoryIcon name={cat.icon} size={10} />
                            </div>
                            <span>{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Source (if Expense) */}
                  {voiceParsed.type === 'expense' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                        {i18n.paymentSource}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setVoiceParsed({
                            ...voiceParsed,
                            sourceType: 'credit_card',
                            creditCardId: voiceParsed.creditCardId || cards[0]?.id
                          })}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            voiceParsed.sourceType === 'credit_card'
                              ? 'bg-blue-600/40 border-blue-400 text-blue-200'
                              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          <CardIcon className="w-3.5 h-3.5 text-blue-400" />
                          <span>{i18n.creditCard}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVoiceParsed({
                            ...voiceParsed,
                            sourceType: 'cash_bank',
                            creditCardId: undefined
                          })}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            voiceParsed.sourceType === 'cash_bank'
                              ? 'bg-emerald-600/40 border-emerald-400 text-emerald-200'
                              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{i18n.cashBank}</span>
                        </button>
                      </div>

                      {/* Card dropdown if credit card selected */}
                      {voiceParsed.sourceType === 'credit_card' && cards.length > 0 && (
                        <select
                          value={voiceParsed.creditCardId || cards[0]?.id}
                          onChange={(e) => setVoiceParsed({ ...voiceParsed, creditCardId: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 rounded-xl py-2 px-2.5 text-xs text-white font-semibold focus:outline-none"
                        >
                          {cards.map((c) => (
                            <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                              💳 {c.name} (*{c.last4})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Note / Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                      {i18n.description}
                    </label>
                    <input
                      type="text"
                      value={voiceParsed.note}
                      placeholder={i18n.notePlaceholder}
                      onChange={(e) => setVoiceParsed({ ...voiceParsed, note: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 focus:border-blue-400 rounded-xl py-2 px-3 text-xs text-white placeholder:text-white/40 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
