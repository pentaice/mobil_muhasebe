import { Category, CreditCard, Transaction } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-yemek',
    name: 'Yemek & Restoran',
    icon: 'Utensils',
    color: '#f97316',
    isCustom: false,
  },
  {
    id: 'cat-market',
    name: 'Market & Gıda',
    icon: 'ShoppingBag',
    color: '#10b981',
    isCustom: false,
  },
  {
    id: 'cat-tatli-kahve',
    name: 'Kahve & Tatlı',
    icon: 'Coffee',
    color: '#d97706',
    isCustom: false,
  },
  {
    id: 'cat-eglence',
    name: 'Eğlence & Sosyal',
    icon: 'Gamepad2',
    color: '#ec4899',
    isCustom: false,
  },
  {
    id: 'cat-tutun-alkol',
    name: 'Tütün & Alkol',
    icon: 'Wine',
    color: '#ef4444',
    isCustom: false,
  },
  {
    id: 'cat-ulasim',
    name: 'Ulaşım & Taksi',
    icon: 'Car',
    color: '#3b82f6',
    isCustom: false,
  },
  {
    id: 'cat-fatura',
    name: 'Fatura & Abonelik',
    icon: 'Receipt',
    color: '#8b5cf6',
    isCustom: false,
  },
  {
    id: 'cat-bakim',
    name: 'Bakım & Kozmetik',
    icon: 'Sparkles',
    color: '#14b8a6',
    isCustom: false,
  },
  {
    id: 'cat-etkinlik',
    name: 'Etkinlik & Kültür',
    icon: 'Ticket',
    color: '#eab308',
    isCustom: false,
  },
  {
    id: 'cat-giyim',
    name: 'Giyim & Moda',
    icon: 'Shirt',
    color: '#6366f1',
    isCustom: false,
  },
  {
    id: 'cat-elektronik',
    name: 'Elektronik & Teknoloji',
    icon: 'Smartphone',
    color: '#06b6d4',
    isCustom: false,
  },
  {
    id: 'cat-hediye',
    name: 'Hediye & Özel',
    icon: 'Gift',
    color: '#f43f5e',
    isCustom: false,
  },
  {
    id: 'cat-resmi-egitim',
    name: 'Eğitim & Resmi Harçlar',
    icon: 'GraduationCap',
    color: '#a855f7',
    isCustom: false,
  },
  {
    id: 'cat-finans-transfer',
    name: 'Finans & Transfer',
    icon: 'Coins',
    color: '#0284c7',
    isCustom: false,
  },
  {
    id: 'cat-diger',
    name: 'Diğer Harcamalar',
    icon: 'Coins',
    color: '#64748b',
    isCustom: false,
  },
];

export const DEFAULT_CREDIT_CARDS: CreditCard[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];
