# 📊 Hisse Detay ve Analiz Kılavuzu

Hisse Detay ve Analiz modülü, seçilen bir hisse senedinin veya kripto varlığın finansal metriklerini, fiyat geçmişini (interaktif grafiklerini) ve yapay zeka analiz raporlarını (3 paralel ajan görüşü ve haber duyarlılığı) tek bir sayfada birleştiren detaylı analiz panelidir.

---

## 🎨 Ön Yüz Arayüzü (`StockDetail.js` & `SVGChart.js`)
- **Dosya Yolu:** [StockDetail.js](file:///C:/Denemeler/RAG%20borsa%20sistemi%20deneme/frontend/src/app/components/StockDetail.js)
- **Tasarım Kuralları:**
  - **Skor Halkası (Score Ring):** Ajan skorunu görselleştirmek için SVG çemberleri üzerinde `stroke-dasharray` ve `stroke-dashoffset` animasyonları kullanılır.
  - **Ajan Görüşleri:** Yapay zeka analizi 3 farklı ajan şeklinde kartlarda gösterilir: `Teknik Analiz Ajanı`, `Temel Analiz Ajanı`, `Haber/Duyarlılık Analiz Ajanı`.
  - **Haber Duyarlılık Göstergesi (Sentiment Gauge):** Eğer backend'den `news_sentiment` verisi gelirse, toplam skor (-1.0 ile +1.0 arası) %0-%100 aralığına haritalanır ve renkli bir gradient bar üzerinde beyaz gösterge iğnesiyle gösterilir.
  - **Makale Duyarlılıkları:** Her makale için yön okları gösterilir: Yeşil ↑ (Pozitif), Kırmızı ↓ (Negatif), Sarı → (Nötr).
  - **İnteraktif SVG Grafik (`SVGChart.js`):** Grafik yolu `pathD` dizesi şeklinde `useMemo` ile hesaplanır. Hover yapıldığında yatay ve dikey çapraz çizgiler (crosshairs) ve o tarihteki fiyatı içeren tooltip gösterilir. Zaman aralığı sekmeleri: `1d`, `5d`, `1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y`.

---

## 💻 Arka Plan Servisleri

### 1. Temel Hisse Verileri (`GET /api/stock/{ticker}`)
- Hisselerin temel verilerini (isim, fiyat, F/K, PD/DD, sektör vb.) yfinance üzerinden çekip Türkçe'ye çevirir.
- **Zaman Aşımı Koruması:** yfinance sorguları için global requests.Session zaman aşımı 30 saniyedir.
- **Dinamik TTL (`get_dynamic_ttl`):** Borsa çalışma saatleri içerisinde (hafta içi 10:00 - 19:00 arası) TTL değeri **10 dakika (600s)**, borsa kapalıyken veya hafta sonları ise **2 saat (7200s)** olarak atanır.
- **Para Birimi Eşlemesi:**
  - `.IS` soneki ➔ `TRY` (TL soneki)
  - `.DE` soneki veya `^GDAXI` ➔ `EUR` (€ öneki)
  - `-USD` soneki ➔ `USD` ($ öneki)
  - Diğer durumlarda varsayılan `USD`dir.

### 2. Hisse Fiyat Geçmişi (`GET /api/stock/{ticker}/chart`)
- Grafik çizimi için hissenin geçmiş fiyat serisini dizi olarak döndürür.
- `DeepResearch` grafik veri akışında `data.history` aranmamalı, doğrudan dönen dizi (`data`) kullanılmalıdır.

### 3. Çok Ajanlı AI Analizi (`GET /api/stock/{ticker}/analysis`)
- Teknik, Temel ve Haber ajanlarını tek bir LLM bağlamında paralelleştirip vade bazlı stratejiler üretir.
- **Önbellek Anahtarı Hatası (Düzeltildi):** Analiz veritabanına kaydedilirken sonekli hisse adı (örn: `THYAO.IS`) yerine son eksiz `base_ticker` (`THYAO`) anahtarı kullanılır. Bu sayede sonraki detay açılışlarında sürekli cache-miss yaşanması engellenmiştir (Bug #10).
- **Haber Duyarlılık Entegrasyonu:** `analyze_news_sentiment()` fonksiyonu, son haber başlıklarını toplayıp LLM duyarlılık analizi yaptıktan sonra `sentiment_{ticker}` anahtarı altında **30 dakika (1800s)** TTL ile önbellekler. Bu veri, `get_stock_analysis` sonucundaki `news_sentiment` alanına eklenir.

---

## ⚠️ Kritik Hususlar ve Dikkat Edilecekler
- **Mükerrer Ticker Tanımlaması (Düzeltildi):** `get_stock_data`, `get_stock_chart` ve `get_stock_analysis` fonksiyonlarındaki `stock = yf.Ticker(symbol)` satırlarının üst üste mükerrer olarak ikişer kez yazılması hatası giderilmiştir.
- **Translation Loop Engeli (Düzeltildi):** `get_stock_data` içerisindeki translation kontrolü cache-hit bloğundan ayrılmıştır, böylece sonsuz döngülerin önüne geçilmiştir (Bug #9).
