# 🗺️ Yol Haritası ve Geçmiş

Bu dosya, projede gerçekleştirilen son güncellemeleri, hata düzeltmelerini ve gelecekte yapılması planlanan iyileştirme planlarını içerir.

---

## 📅 Son Güncellemeler (Haziran 2026)

### 1. 🇩🇪 Almanya Borsası (DAX 40) Desteği
- **Hisse Kodu Formatlama:** `format_ticker` fonksiyonuna `known_germany_stocks` kümesi eklendi. SAP, SIE, ALV, VOW3, BMW, DTE, BAS, BAYN, IFX, MBG hisseleri arandığında otomatik olarak `.DE` son eki eklenir.
- **Piyasa Özeti (Market Overview):** DAX 40 endeksi (`^GDAXI`) ve pariteler piyasa özeti sayfasına entegre edildi.
- **Akıllı Tarayıcı (Screener):** Screener bileşenine `Almanya Borsası (Xetra)` seçeneği ve 6 ön tanımlı (preset) filtre eklendi.
- **Derin Araştırma (DeepResearch):** DeepResearch sekmesine `Almanya Borsası (DAX 40)` havuzu eklenerek 27 mavi çip hissesinin asenkron olarak taranması ve analiz edilmesi sağlandı.
- **AI Önerileri:** Anasayfadaki AI Recommendations paneline Almanya sekmesi eklenerek vade bazlı en iyi 3 Xetra yatırım fırsatı listelenmeye başladı. Para birimi biçimlendirmesi `EUR` (€) cinsinden entegre edildi.

### 2. 🗄️ SQLite ve Peewee ORM Entegrasyonu
- **Chat Store:** Bellek içi (in-memory) sohbet oturumu deposu yerine veritabanı tabanlı (`ChatSession`) SQLite sohbet deposuna geçildi.
- **WAL Modu ve Concurrency:** SQLite veritabanında **Write-Ahead Logging (WAL)** modu ve `busy_timeout=30000` aktif edilerek eşzamanlı okuma/yazma performansı optimize edildi, veritabanı kilitlenmelerinin önüne geçildi.

### 3. 🛠️ Önemli Hata Düzeltmeleri ve Performans Optimizasyonları
- **RSI NaN Hatası Düzeltildi:** `calculate_rsi` fonksiyonunda NaN/Bilinmeyen fiyat verileri filtrelenerek indikatörün çökmesi engellendi.
- **yfinance Rate Limiter İyileştirmesi:** `yf_rate_limit_wait` fonksiyonundaki `time.sleep` kilidin dışına çıkarıldı. Böylece thread'ler paralel çalışırken birbirlerini bloke etmeden bekleme sürelerini tamamlar hale geldi.
- **Olasılıksal Oturum Temizleme:** `ChatStore._cleanup` temizlik işlemi her istekte tetiklenmek yerine %5 olasılıkla (`random.random() < 0.05`) çalıştırılarak SQLite üzerindeki disk IO yükü azaltıldı.
- **Önbellek Anahtarı Senkronizasyonu:** `get_stock_analysis` önbellek kaydındaki `ticker_upper` ve `base_ticker` arasındaki uyumsuzluk giderildi, artık analizler `.IS` veya `.DE` son eki olmadan saklanarak mükerrer API çağrıları engelleniyor.
- **localStorage Güvenliği:** Tarayıcıların gizlilik modlarında (incognito) uygulamanın çökmesini engellemek için tüm `localStorage` işlemleri try-catch sarmalı içine alındı.
- **AbortController ile Yarış Durumunun Önlenmesi:** Arama ve detay fetch işlemlerinde önceki isteklerin iptal edilebilmesi için `AbortController` kullanıldı.

---

## 🚀 Gelecek İyileştirme Planları (Yol Haritası)

### 1. Avrupa Borsaları Desteğinin Genişletilmesi
- Almanya dışındaki diğer Avrupa borsalarının da (Fransa `.PA`, İngiltere `.L`, İsviçre `.SW` vb.) hisselerinin aranabilmesi.
- `GBP`, `CHF`, `SEK`, `NOK` ve `DKK` para birimleri için `utils.js` üzerinde dinamik formatlama desteğinin tam olarak tamamlanması.

### 2. Toplu Arka Plan Analizi ve SQLite Önbellekleme
- Gelecekte tüm BIST hisselerini, S&P 500'ü ve popüler kripto paraları (1000+ varlık) kapsayacak şekilde genişletmek amacıyla hazırlanan **Toplu Arka Plan Analizi ve SQLite Önbellekleme** planı doğrultusunda altyapı kurulabilir.

### 3. Teknik İndikatörlerin Görselleştirilmesi
- SVG Grafik bileşeni (`SVGChart.js`) üzerinde sadece fiyat serisini değil, hareketli ortalamaları (EMA20/50/200), Bollinger Bantlarını veya RSI seviyelerini de grafik üzerinde çizme/açıp-kapatma desteği.

### 4. Gelişmiş Hata Kurtarma ve Çoklu LLM API Yedekliliği
- LiteLLM entegrasyonu üzerinde, birincil sağlayıcıda (örn: OpenCode Go/Zen) yaşanabilecek kesintilerde otomatik olarak ikincil veya yedek sağlayıcılara (örn: Gemini, DeepSeek) geçiş yapacak dinamik bir fallback mekanizmasının kurulması.
