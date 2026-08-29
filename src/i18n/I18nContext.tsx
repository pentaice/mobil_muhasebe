import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageCode, CurrencyConfig, SUPPORTED_CURRENCIES, getTranslations, TranslationKeys } from './translations';

const STORAGE_KEY_LANG = 'cebim_language_v4';
const STORAGE_KEY_CURRENCY = 'cebim_currency_v4';

function loadLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    if (saved && ['tr', 'en', 'es', 'fr', 'zh', 'hi'].includes(saved)) {
      return saved as LanguageCode;
    }
  } catch (e) { /* ignore */ }
  return 'tr';
}

function saveLanguage(lang: LanguageCode) {
  try { localStorage.setItem(STORAGE_KEY_LANG, lang); } catch (e) { /* ignore */ }
}

function loadCurrency(): CurrencyConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENCY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.code) return parsed;
    }
  } catch (e) { /* ignore */ }
  return SUPPORTED_CURRENCIES[0]; // TRY default
}

function saveCurrency(currency: CurrencyConfig) {
  try { localStorage.setItem(STORAGE_KEY_CURRENCY, JSON.stringify(currency)); } catch (e) { /* ignore */ }
}

interface I18nContextType {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  currency: CurrencyConfig;
  setCurrency: (currency: CurrencyConfig) => void;
  t: TranslationKeys;
  formatCurrency: (amount: number) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(() => loadLanguage());
  const [currency, setCurrencyState] = useState<CurrencyConfig>(() => loadCurrency());

  const setLang = (newLang: LanguageCode) => {
    setLangState(newLang);
    saveLanguage(newLang);
  };

  const setCurrency = (newCurrency: CurrencyConfig) => {
    setCurrencyState(newCurrency);
    saveCurrency(newCurrency);
  };

  const translations = getTranslations(lang);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.code === 'JPY' || currency.code === 'KRW' ? 0 : 0,
      maximumFractionDigits: currency.code === 'JPY' || currency.code === 'KRW' ? 0 : 0,
    }).format(amount);
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, currency, setCurrency, t: translations, formatCurrency }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
