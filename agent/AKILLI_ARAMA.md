# 🔍 Akıllı Arama (Screener) Kılavuzu

Akıllı Arama modülü, BIST, ABD (NASDAQ/NYSE), Almanya (Xetra) ve Kripto piyasalarındaki hisse/varlıkları belirli yatırım temalarına (preset'lere) göre tarayan ve filtreleyen dikey bir sistemdir.

---

## 🎨 Ön Yüz Bileşeni (`Screener.js`)
- **Dosya Yolu:** [Screener.js](file:///C:/Denemeler/RAG%20borsa%20sistemi%20deneme/frontend/src/app/components/Screener.js)
- **Arayüz Tasarımı:**
  - Piyasalar üst sekmelerde listelenir: `"BIST İstanbul"`, `"ABD Borsaları"`, `"Almanya Borsası (Xetra)"`, `"Kripto Paralar"`.
  - Filtre preseti ikinci seviye sekmelerde seçilir: `"Değer Hisseleri"`, `"Büyüme"`, `"Yüksek Temettü"`, `"En Aktifler"`, `"En Çok Kazandıranlar"`, `"En Çok Kaybettirenler"`.
  - Sonuçlar; Sembol, İsim, Fiyat, Günlük Değişim (Signal Badge'leri eşliğinde), Gün İçi Yüksek/Düşük ve Hacim sütunlarını içeren modern, kaydırılabilir bir tablo içinde listelenir.
  - Seçilen satırdaki **"Analiz Et"** butonu, ana uygulamadaki `setTicker(symbol)` state'ini tetikleyerek ilgili varlığı detay paneline yükler ve aktif sekmeyi `analysis` yapar.

---

## 💻 Arka Plan Servisi (`/api/market/screener`)
- **Endpoint:** `GET /api/market/screener`
- **Parametreler:**
  - `market` (varsayılan: `bist`, seçenekler: `bist`, `us`, `germany`, `crypto`)
  - `preset` (varsayılan: `value_stocks`, seçenekler: `value_stocks`, `growth_stocks`, `dividend_stocks`, `most_active`, `day_gainers`, `day_losers`)
- **Önbellek (Caching):** Taramalar `screener_{market}_{preset}` anahtarıyla **300 saniye (5 dakika)** boyunca `YFinanceCache` tablosunda önbelleğe alınır.

---

## ⚙️ Piyasa Bazlı Tarama Algoritmaları

### 1. ABD Borsaları (US)
- Yahoo Finance'in önceden tanımlanmış tarayıcı API'sini kullanır:
  `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds={scr_id}&count=20`
- Eşleşen preset kimlikleri (`scrIds`):
  - `value_stocks` ➔ `undervalued_large_caps`
  - `growth_stocks` ➔ `growth_technology_stocks`
  - `dividend_stocks` ➔ `high_dividend_yield`
  - `most_active` ➔ `most_active`
  - `day_gainers` ➔ `day_gainers`
  - `day_losers` ➔ `day_losers`
- **Fallback Mekanizması:** Yahoo Finance API'si boş sonuç döndürür veya hata verirse (yaygın: consent redirect, HTTP 403/429), `POPULAR_US_STOCKS` (11 büyük ABD hissesi) havuzu `ThreadPoolExecutor(max_workers=10)` ile `get_ticker_summary` üzerinden taranır.
  - Preset bazlı alt havuzlar: `most_active`/`day_gainers`/`day_losers` ➔ tüm havuz; `value_stocks` ➔ AAPL,MSFT,GOOGL,AMZN,BABA,NVDA,META; `growth_stocks` ➔ TSLA,NVDA,AMD,META,COIN,NFLX,MSFT,AMZN; `dividend_stocks` ➔ AAPL,MSFT,GOOGL,BABA,META.
  - Fallback sonuçları presete göre sıralanır: `most_active` ➔ hacim azalan; `day_gainers` ➔ değişim azalan; `day_losers` ➔ değişim artan.
- **Zaman Aşımı:** `timeout=15` saniye, istek öncesi `yf_rate_limit_wait()` çağrılır.
- **Cache:** Boş sonuç cache'lenmez; sadece dolu liste 300 saniye saklanır.

### 2. Kripto Paralar (Crypto)
- `get_top_crypto_symbols(limit=200)` üzerinden en popüler 200 adet `-USD` çiftini alır.
- Yahoo Finance sunucularına aşırı yüklenme ve rate-limit engellerini önlemek için `yf.download` üzerinden **50'şerli chunk (yığın) grupları** halinde asenkron indirilir.
- İndirilen verilerden son kapanış fiyatı, önceki kapanış fiyatı, günlük değişim (`change`), günlük yüksek/düşük ve hacim bilgileri ayıklanır.
- Seçilen presete göre sıralanır (Örn: `top_gainers` ➔ `-change` azalan; `most_active` ➔ `-volume` azalan). En iyi 15 sonuç dönülür.

### 3. Almanya Borsası (Germany)
- `GERMANY_ACTIVE_POOL` içindeki **30 adet** Alman aktif hissesini (DAX 30) tarar.
- Paralel tarama için `ThreadPoolExecutor(max_workers=10)` kullanılarak `get_ticker_summary` çağrılır. Para birimi `EUR` olarak atanır.
- Presete göre şu alt havuzlar filtrelenir:
  - `dividend_stocks` ➔ `["ALV.DE", "BAS.DE", "BMW.DE", "VOW3.DE", "DTE.DE"]`
  - `value_stocks` ➔ `["ALV.DE", "VOW3.DE", "BMW.DE", "BAS.DE", "MBG.DE"]`
  - `growth_stocks` ➔ `["SAP.DE", "SIE.DE", "IFX.DE", "DTE.DE"]`

### 4. BIST İstanbul
- `BIST_ACTIVE_POOL` içindeki **47 adet** aktif BIST hissesini tarar.
- Paralel tarama için `ThreadPoolExecutor(max_workers=15)` kullanılarak hisseler sonuna `.IS` eklenerek sorgulanır. Para birimi `TRY` olarak atanır.
- Presete göre şu alt havuzlar filtrelenir:
  - `dividend_stocks` ➔ `["TUPRS", "EREGL", "VESBE", "TOASO", "FROTO", "TTKOM", "KCHOL"]`
  - `value_stocks` ➔ `["SAHOL", "KCHOL", "YKBNK", "AKBNK", "ISCTR", "SISE", "HALKB", "VAKBN"]`
  - `growth_stocks` ➔ `["ASTOR", "KONTR", "YEOTK", "SMRTG", "ASELS", "EUPWR", "PGSUS"]`

---

## ⚠️ Kritik Hususlar ve Dikkat Edilmesi Gerekenler
- **Overwriting Bug (Düzeltildi):** Tarama sonuçlarını döndürürken `results` değişkeninin farklı koşul blokları arasında çakışıp boş liste döndürmesi hatası, değişken kapsamının izole edilmesiyle engellenmiştir (Bug #5).
- **Hız Sınırı (Rate Limit) ve Deadlock Önleme:** Paralel thread'ler `get_ticker_summary` çağırırken `yf_rate_limit_wait()` bekleme süresini (2s) kilidin dışarısında geçirir. Bu sayede thread'ler birbirlerini kilitlemeden (deadlock) sırayla çalışır.
- **Zaman Aşımı:** Crypto taramasındaki yığın indirme işleminde zaman aşımı `timeout=15` saniye olarak sınırlandırılmıştır.
