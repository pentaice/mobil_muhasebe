# 📱 Mobil Muhasebe & Kredi Kartı Takibi (Bütçem)

Modern, şık ve mobil odaklı kişisel finans, harcama girişi ve kredi kartı döngü takip uygulaması. 

Kullanıcıların harcamalarını anlık olarak kaydetmelerini, kredi kartı hesap kesim ve son ödeme tarihlerini otomatik takip etmelerini, bütçelerini grafiklerle analiz etmelerini ve verilerini cihazlarında güvenle saklamalarını sağlar.

---

## 🌟 Öne Çıkan Özellikler

- **⚡ Hızlı Harcama Girişi (Quick Add):**
  - Tek dokunuşla tutar, kategori ve ödeme kaynağı (Nakit / Banka veya Kredi Kartı) seçimi.
  - Tarih ve not ekleme imkanı.
  - İşlem sonrası anlık mikro bildirimler (2 saniyelik Toast bildirimleri).

- **💳 Akıllı Kredi Kartı & Hesap Kesim Takibi:**
  - Kart limiti, hesap kesim günü (Cutoff Day) ve son ödeme tarihi hesaplamaları.
  - Canlı borç ve kalan limit göstergeleri.
  - Kredi kartına borç ödemesi kaydı ekleme ve bakiye senkronizasyonu.
  - Visa, Mastercard, Troy, Amex desteği ve modern kart temaları.

- **📊 Detaylı Raporlar & Grafikler:**
  - Recharts destekli interaktif harcama analizleri.
  - Kategori bazlı harcama dağılım grafikleri.
  - Nakit vs. Kredi Kartı kullanım oranları.
  - Aylık ve dönemsel bütçe özetleri.

- **🗂️ Kategori & İşlem Yönetimi:**
  - Özelleştirilebilir simgeler (Lucide Icons) ve renk paletleri.
  - Yeni kategori ekleme ve silme.
  - Detaylı işlem geçmişi listesi, filtreleme ve silme desteği.

- **🔒 %100 Çevrimdışı & Güvenli Veri Saklama:**
  - Tüm veriler cihazınızda `LocalStorage` üzerinde saklanır; harici sunucuya veri gitmez.
  - **Yedekleme (JSON Export):** Tüm verilerinizi tek tıkla JSON dosyası olarak indirin.
  - **Geri Yükleme (JSON Import):** Yedek dosyanızı geri yükleyin.
  - **Sıfırlama (Reset):** Dilediğinizde varsayılan başlangıç verilerine dönün.

---

## 🛠️ Kullanılan Teknolojiler

- **Arayüz:** React 19, TypeScript
- **Derleme & Sunucu:** Vite 6
- **Stil & Tasarım:** Tailwind CSS v4, Vanilla CSS
- **Animasyonlar:** Motion (Framer Motion)
- **Grafikler:** Recharts
- **İkon Seti:** Lucide React

---

## 🚀 Yerel Geliştirme ve Çalıştırma (Localhost)

Projeyi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin:

### 1. Gereksinimler
- **Node.js:** v18 veya üzeri (Sisteminizde Node.js kurulu olmalıdır)
- **NPM**

### 2. Bağımlılıkları Yükleyin
Proje kök dizininde bir terminal açın ve çalıştırın:
```bash
npm install
```

### 3. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```

Sunucu başarıyla başlatıldığında terminalde aşağıdaki gibi bir adres göreceksiniz:
- **Local:** `http://localhost:3000/`
- **Network (Mobil test için):** `http://<yerel-ip-adresiniz>:3000/`

Tarayıcınızı açıp `http://localhost:3000` adresine giderek uygulamayı kullanmaya başlayabilirsiniz. Mobil tarayıcı görünümünü test etmek için tarayıcıda `F12` > Mobil Cihaz Modu'nu (Device Toolbar) açabilirsiniz.

---

## 📦 Proje Komutları

| Komut | Açıklama |
| :--- | :--- |
| `npm run dev` | Vite geliştirme sunucusunu localhost:3000 portunda başlatır |
| `npm run build` | Üretim (production) için `dist/` klasörüne optimize edilmiş çıktı üretir |
| `npm run preview` | Üretim derlemesini yerel ortamda önizler |
| `npm run lint` | TypeScript tip kontrollerini gerçekleştirir |

---

## 📱 Android APK Oluşturma Rehberi

Uygulama web tabanlı PWA / Mobil formatında hazırlandığı için **Capacitor** köprüsü ile kolayca yerel Android APK dosyasına dönüştürülebilir:

### Adım Adım APK Alma:

1. **Capacitor Paketlerini Yükleyin:**
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```

2. **Capacitor'ı Başlatın:**
   ```bash
   npx cap init "Mobil Muhasebe" "com.mobilmuhasebe.app" --web-dir dist
   ```

3. **Web Uygulamasını Derleyin:**
   ```bash
   npm run build
   ```

4. **Android Platformunu Ekleyin ve Eşitleyin:**
   ```bash
   npx cap add android
   npx cap sync android
   ```

5. **APK Derleme (2 Yöntem):**
   - **Komut Satırından (Gradle ile):**
     ```bash
     cd android
     ./gradlew assembleDebug
     ```
     Oluşan test APK'sı `android/app/build/outputs/apk/debug/app-debug.apk` yolunda hazır olacaktır.
   - **Android Studio ile:**
     ```bash
     npx cap open android
     ```
     Android Studio açıldığında **Build > Build Bundle(s) / APK(s) > Build APK(s)** seçeneğiyle doğrudan APK oluşturabilirsiniz.

---

## 📁 Proje Dosya Yapısı

```
mobil_muhasebe/
├── src/
│   ├── components/            # UI Bileşenleri
│   │   ├── AddCreditCardModal.tsx      # Yeni kart ekleme penceresi
│   │   ├── BottomNav.tsx               # Mobil alt menü gezinme çubuğu
│   │   ├── CategoriesView.tsx          # Kategori listesi & yönetimi
│   │   ├── CategoryIcon.tsx            # Dinamik Lucide ikon bileşeni
│   │   ├── CreditCardPaymentModal.tsx  # Kredi kartı borç ödeme penceresi
│   │   ├── CreditCardsView.tsx         # Kredi kartları & limit durumları
│   │   ├── Header.tsx                  # Üst menü, toplam bakiye & yedekleme
│   │   ├── QuickAddExpense.tsx         # Ana sayfa: Hızlı harcama ekleme
│   │   ├── ReportsView.tsx             # Grafikler & finansal raporlar
│   │   ├── Toast.tsx                   # Canlı bildirim popup'ı
│   │   └── TransactionsView.tsx        # İşlem geçmişi & filtreler
│   ├── data/
│   │   └── initialData.ts              # Varsayılan başlangıç verileri
│   ├── utils/
│   │   └── storage.ts                  # LocalStorage senkronizasyon araçları
│   ├── types.ts                        # TypeScript tip tanımlamaları
│   ├── App.tsx                         # Ana uygulama konteyneri & state
│   ├── main.tsx                        # React giriş noktası
│   └── index.css                       # Global Tailwind CSS stilleri
├── index.html                          # Mobil meta etiketli HTML şablonu
├── package.json                        # Paket bağımlılıkları ve scriptler
├── tsconfig.json                       # TypeScript yapılandırması
├── vite.config.ts                      # Vite yapılandırması
└── README.md                           # Dokümantasyon
```

---

## 📄 Lisans
Bu proje MIT lisansı ile lisanslanmıştır.
