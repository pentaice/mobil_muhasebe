import { Category, CreditCard, IncomeCategory, PaymentSourceType, TransactionType } from '../types';
import { LanguageCode } from '../i18n/translations';

export interface ParsedVoiceResult {
  amount: number;
  categoryId: string;
  type: TransactionType;
  sourceType: PaymentSourceType;
  creditCardId?: string;
  note: string;
  rawTranscript: string;
}

const TR_NUMBER_MAP: Record<string, number> = {
  'sıfır': 0,
  'yarım': 0.5,
  'buçuk': 0.5,
  'bir': 1,
  'iki': 2,
  'üç': 3,
  'dört': 4,
  'beş': 5,
  'altı': 6,
  'yedi': 7,
  'sekiz': 8,
  'dokuz': 9,
  'on': 10,
  'yirmi': 20,
  'otuz': 30,
  'kırk': 40,
  'elli': 50,
  'altmış': 60,
  'yetmiş': 70,
  'seksen': 80,
  'doksan': 90,
  'yüz': 100,
  'bin': 1000,
  'milyon': 1000000,
};

const EN_NUMBER_MAP: Record<string, number> = {
  'zero': 0,
  'one': 1,
  'two': 2,
  'three': 3,
  'four': 4,
  'five': 5,
  'six': 6,
  'seven': 7,
  'eight': 8,
  'nine': 9,
  'ten': 10,
  'twenty': 20,
  'thirty': 30,
  'forty': 40,
  'fifty': 50,
  'sixty': 60,
  'seventy': 70,
  'eighty': 80,
  'ninety': 90,
  'hundred': 100,
  'thousand': 1000,
};

// Turkish Category Keyword Dictionaries
const TR_CATEGORY_KEYWORDS: Record<string, string[]> = {
  'cat-yemek': [
    'yemek', 'restoran', 'lokanta', 'döner', 'kebap', 'pizza', 'burger', 'lahmacun',
    'öğle', 'akşam', 'kahvaltı', 'yemeksepeti', 'getir yemek', 'köfte', 'çorba', 'dürüm',
    'pide', 'tavuk', 'balık', 'makarna', 'fast food'
  ],
  'cat-market': [
    'market', 'bakkal', 'süpermarket', 'migros', 'a101', 'bim', 'şok', 'carrefour',
    'manav', 'kasap', 'gıda', 'ekmek', 'su', 'alışveriş', 'file', 'tarım kredi', 'deterjan',
    'peynir', 'süt', 'yumurta', 'manavdan'
  ],
  'cat-tatli-kahve': [
    'kahve', 'starbucks', 'tatlı', 'pasta', 'çay', 'latte', 'espresso', 'dondurma',
    'baklava', 'çikolata', 'fırın', 'pastane', 'kahvesi', 'waffle', 'kruvasan'
  ],
  'cat-ulasim': [
    'taksi', 'benzin', 'yakıt', 'mazot', 'otobüs', 'metro', 'akbil', 'martı', 'uber',
    'bilet', 'uçak', 'yol', 'otopark', 'hgs', 'ogs', 'shell', 'opet', 'petrol', 'bp',
    'dolmuş', 'minibüs', 'vapur', 'tren', 'ulaşım'
  ],
  'cat-fatura': [
    'fatura', 'internet', 'netflix', 'spotify', 'youtube', 'elektrik', 'su faturası',
    'doğalgaz', 'telefon', 'turkcell', 'vodafone', 'türk telekom', 'aidat', 'kira',
    'abonelik', 'disney', 'icloud', 'digiturk', 'd-smart'
  ],
  'cat-eglence': [
    'sinema', 'tiyatro', 'oyun', 'steam', 'eğlence', 'konser', 'bar', 'pub', 'gece',
    'kulüp', 'playstation', 'biletix', 'etkinlik', 'lunapark'
  ],
  'cat-tutun-alkol': [
    'sigara', 'tütün', 'alkol', 'bira', 'şarap', 'tekel', 'rakı', 'viski', 'votka', 'puro'
  ],
  'cat-bakim': [
    'kuaför', 'berber', 'kozmetik', 'bakım', 'şampuan', 'eczane', 'ilaç', 'parfüm',
    'tıraş', 'makyaj', 'cilt', 'gratis', 'watsons', 'rossmann', 'sağlık'
  ],
  'cat-giyim': [
    'giyim', 'kıyafet', 'pantolon', 'tişört', 'ayakkabı', 'zara', 'lcw', 'mango',
    'elbise', 'mont', 'ceket', 'çanta', 'h&m', 'koton', 'boyner', 'sneaker'
  ],
  'cat-elektronik': [
    'elektronik', 'telefon', 'bilgisayar', 'kulaklık', 'şarj', 'kablo', 'teknoloji',
    'mediamarkt', 'vatan', 'apple', 'tablet', 'monitör', 'klavye', 'mouse'
  ],
  'cat-hediye': [
    'hediye', 'çiçek', 'sürpriz', 'doğum günü', 'armağan'
  ],
  'cat-resmi-egitim': [
    'kurs', 'okul', 'kitap', 'eğitim', 'harç', 'vergi', 'ceza', 'noter', 'pasaport', 'ehliyet'
  ],
};

// Turkish Income Keywords
const TR_INCOME_KEYWORDS: Record<string, string[]> = {
  'inc-maas': ['maaş', 'avans', 'aylık', 'bordro', 'prim', 'şirket ödemesi'],
  'inc-nakit': ['nakit geldi', 'harçlık', 'borç ödemesi', 'hediye para'],
  'inc-freelance': ['freelance', 'ek iş', 'proje', 'tasarım', 'yazılım işi', 'danışmanlık'],
  'inc-kira': ['kira geliri', 'kiracı', 'kira yattı', 'kira aldım'],
  'inc-yatirim': ['temettü', 'faiz', 'kâr payı', 'borsa kazancı', 'kripto kazancı'],
};

// English Category Keywords
const EN_CATEGORY_KEYWORDS: Record<string, string[]> = {
  'cat-yemek': ['lunch', 'dinner', 'food', 'restaurant', 'meal', 'burger', 'pizza', 'breakfast'],
  'cat-market': ['grocery', 'supermarket', 'market', 'walmart', 'food shopping', 'bread', 'milk'],
  'cat-tatli-kahve': ['coffee', 'starbucks', 'cafe', 'dessert', 'cake', 'tea', 'latte', 'bakery'],
  'cat-ulasim': ['taxi', 'uber', 'gas', 'fuel', 'bus', 'subway', 'train', 'flight', 'parking'],
  'cat-fatura': ['bill', 'internet', 'netflix', 'spotify', 'electricity', 'water bill', 'rent', 'subscription'],
  'cat-eglence': ['movie', 'cinema', 'game', 'steam', 'concert', 'bar', 'club', 'party'],
  'cat-giyim': ['clothes', 'shirt', 'pants', 'shoes', 'jacket', 'shopping', 'dress'],
  'cat-bakim': ['pharmacy', 'medicine', 'haircut', 'barber', 'cosmetics', 'salon'],
};

/**
 * Extracts a numeric amount from spoken text.
 * Handles both digits ("250", "45.50", "25 bin") and word numbers ("yüz elli").
 */
function extractAmount(text: string): number {
  const clean = text.toLowerCase().trim();

  // 1. Check for "X bin" e.g. "45 bin", "2.5 bin"
  const binMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:bin|k\b)/i);
  if (binMatch) {
    const val = parseFloat(binMatch[1].replace(',', '.'));
    if (!isNaN(val)) return val * 1000;
  }

  // 2. Check for explicit numbers with optional currency: "250 lira", "45.50 tl", "$50"
  const digitMatch = clean.match(/(\d+(?:[.,]\d+)?)/);
  if (digitMatch) {
    const val = parseFloat(digitMatch[1].replace(',', '.'));
    if (!isNaN(val) && val > 0) return val;
  }

  // 3. Check for spoken Turkish number words
  const words = clean.split(/\s+/);
  let totalWordsValue = 0;
  let currentGroup = 0;
  let foundAnyNumber = false;

  for (const w of words) {
    const num = TR_NUMBER_MAP[w] ?? EN_NUMBER_MAP[w];
    if (num !== undefined) {
      foundAnyNumber = true;
      if (num === 1000 || num === 1000000) {
        if (currentGroup === 0) currentGroup = 1;
        totalWordsValue += currentGroup * num;
        currentGroup = 0;
      } else if (num === 100) {
        if (currentGroup === 0) currentGroup = 1;
        currentGroup = currentGroup * 100;
      } else {
        currentGroup += num;
      }
    }
  }
  totalWordsValue += currentGroup;

  if (foundAnyNumber && totalWordsValue > 0) {
    return totalWordsValue;
  }

  return 0;
}

/**
 * Parses user voice transcript and returns structured transaction data.
 */
export function parseVoiceExpense(
  transcript: string,
  categories: Category[],
  incomeCategories: IncomeCategory[],
  cards: CreditCard[],
  lang: LanguageCode = 'tr'
): ParsedVoiceResult {
  const clean = transcript.toLowerCase().trim();
  const amount = extractAmount(clean);

  // 1. Detect Transaction Type (Income vs Expense)
  const isIncome =
    clean.includes('maaş') ||
    clean.includes('avans') ||
    clean.includes('gelir') ||
    clean.includes('yattı') ||
    clean.includes('geldi') ||
    clean.includes('tahsilat') ||
    clean.includes('kazandım') ||
    clean.includes('hesabıma geçti') ||
    clean.includes('salary') ||
    clean.includes('income') ||
    clean.includes('deposit') ||
    clean.includes('received') ||
    clean.includes('earned');

  const type: TransactionType = isIncome ? 'income' : 'expense';

  // 2. Detect Payment Source (Credit Card vs Cash/Bank)
  let sourceType: PaymentSourceType = 'cash_bank';
  let matchedCardId: string | undefined = undefined;

  const cardKeywords = [
    'kart', 'kredi kartı', 'kartla', 'karttan', 'kredi kartından',
    'kredi kartımla', 'kartımla', 'pos', 'card', 'credit card', 'credit', 'visa', 'mastercard'
  ];

  const hasCardKeyword = cardKeywords.some((k) => clean.includes(k));

  // Also check if any registered credit card name was spoken (e.g. "Garanti", "Yapı Kredi", "Enpara", "Axess")
  let cardNameMatch = cards.find((c) =>
    clean.includes(c.name.toLowerCase().trim()) ||
    (c.last4 && clean.includes(c.last4))
  );

  if (hasCardKeyword || cardNameMatch) {
    sourceType = 'credit_card';
    matchedCardId = cardNameMatch?.id || cards[0]?.id;
  } else {
    sourceType = 'cash_bank';
  }

  // 3. Detect Category
  let categoryId = '';

  if (isIncome) {
    // Check income categories
    for (const [catId, keywords] of Object.entries(TR_INCOME_KEYWORDS)) {
      if (keywords.some((kw) => clean.includes(kw))) {
        categoryId = catId;
        break;
      }
    }
    // Check against user's actual income categories
    if (!categoryId) {
      const match = incomeCategories.find((ic) => clean.includes(ic.name.toLowerCase()));
      if (match) categoryId = match.id;
    }
    // Default income category
    if (!categoryId) {
      categoryId = incomeCategories[0]?.id || 'inc-maas';
    }
  } else {
    // Check expense categories (Turkish dictionary)
    const keywordsDict = lang === 'en' ? EN_CATEGORY_KEYWORDS : TR_CATEGORY_KEYWORDS;
    for (const [catId, keywords] of Object.entries(keywordsDict)) {
      if (keywords.some((kw) => clean.includes(kw))) {
        // Verify this category ID exists in active categories
        if (categories.some((c) => c.id === catId)) {
          categoryId = catId;
          break;
        }
      }
    }

    // Also check direct match with user category names
    if (!categoryId) {
      const directMatch = categories.find((c) =>
        clean.includes(c.name.toLowerCase().trim())
      );
      if (directMatch) {
        categoryId = directMatch.id;
      }
    }

    // Default to first category or general/other
    if (!categoryId) {
      categoryId = categories[0]?.id || 'cat-diger';
    }
  }

  // 4. Construct Clean Note
  // Remove numbers and currency keywords from raw text to create clean note
  let note = transcript
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:tl|lira|bin|kuruş|bucks|dollars|euro|€|\$|₺)?\b/gi, '')
    .replace(/\b(verdim|ödedim|harcadım|aldım|yaptım|tuttu|tutmuş|kartla|karttan|nakit|nakitle|kredi kartıyla|paid|spent|bought)\b/gi, '')
    .trim();

  // If note ended up too short or empty, use category name or original transcript
  if (!note || note.length < 2) {
    const matchedCategory = categories.find((c) => c.id === categoryId);
    note = matchedCategory?.name || transcript.slice(0, 30);
  } else {
    // Capitalize first letter
    note = note.charAt(0).toUpperCase() + note.slice(1);
  }

  return {
    amount,
    categoryId,
    type,
    sourceType,
    creditCardId: sourceType === 'credit_card' ? matchedCardId : undefined,
    note,
    rawTranscript: transcript,
  };
}

/**
 * Returns BCP-47 speech recognition language code based on app's selected language.
 */
export function getSpeechRecognitionLocale(lang: LanguageCode): string {
  switch (lang) {
    case 'tr':
      return 'tr-TR';
    case 'en':
      return 'en-US';
    case 'es':
      return 'es-ES';
    case 'fr':
      return 'fr-FR';
    case 'zh':
      return 'zh-CN';
    case 'hi':
      return 'hi-IN';
    default:
      return 'tr-TR';
  }
}
