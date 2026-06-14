# 🗺️ Yol Haritası ve Geçmiş

Bu dosya, LongBridge AI projesinde gerçekleştirilen son güncellemeleri, hata düzeltmelerini, performans iyileştirmelerini ve gelecek geliştirme planlarını içerir.

---

## 📅 Son Güncellemeler (Haziran 2026)

### 🚀 1. Modüler Dikey Ajan Belgeleri Yapısı
- Proje rehberleri, gizli nokta klasörü olan `.agent/` yerine indeksleyicilerin ve CLI araçlarının `@` aramalarında anında algılayabileceği noktasız **`agent/`** klasörüne taşındı.
- Belgeler dikey alanlara (Akıllı Arama, RAG Sohbet, Hisse Detay) göre parçalanarak token tasarrufu sağlandı.

### 🔍 2. ABD Borsaları (US Screener) Fallback ve Stabilite Güncellemeleri
- **Fallback Havuzu:** Yahoo Finance API'sinin boş veya başarısız yanıt dönmesi durumuna karşılık `POPULAR_US_STOCKS` (11 büyük ABD hissesi) havuzu `ThreadPoolExecutor` kullanılarak `get_ticker_summary` üzerinden taranacak şekilde fallback mekanizması kuruldu.
- **Preset Alt Havuzları:** `value_stocks`, `growth_stocks` ve `dividend_stocks` presetleri için ilgili semboller filtrelendi.
- **Name Alanı Entegrasyonu:** Fallback verisinde şirket adlarının doğru gösterilmesi için `POPULAR_US_STOCKS` içindeki şirket isimleri fallback sonuçlarına eklendi.
- **Parametre Optimizasyonları:** Arama zaman aşımı 5 saniyeden 15 saniyeye çıkarıldı, istek öncesi `yf_rate_limit_wait()` çağrılarak rate-limit koruması eklendi.
- **Hata ve Cache Yönetimi:** Boş liste döndüğünde cache'lenme sorunu giderildi (artık boş listeler cache'lenmeyip 5 dakika boş kalması engelleniyor). Başarısız HTTP durum kodları `logger.warning` ile izlenebilir hale getirildi.

### 🐛 3. 11 Kritik Hata Düzeltmesi (Commit `aa1e5f5`)

#### Arayüz ve Sohbet Düzeltmeleri:
- **Bug #1 (RAGChat.js Çökmesi):** `RAGChat.js` içerisinde `setMessages` fonksiyonunun `useChat` hook'undan destructure edilmemesinden kaynaklanan frontend crash hatası düzeltildi.
- **Bug #6 (Stale Ticker Düzeltmesi):** `useChat.js` kancasında `ticker_changed` mesajı alındığında eski ticker verisinin gösterilmesi sorunu, `data.new_ticker` (sunucunun onayladığı yeni ticker) kullanılarak giderildi.

#### Sunucu Tarafı Mantık Hataları:
- **Bug #3 (Sistem Prompt Yazım Hatası):** `main.py` içerisindeki sistem promptlarında yer alan `"YER AMAMALIDIR"` yazım hatası `"YER ALMALIDIR"` olarak düzeltildi.
- **Bug #5 (Screener Değişken Overwrite Hatası):** `/api/market/screener` endpoint'inde `results` değişkeninin üst üste yazılmasından kaynaklanan tarama sonuçlarının kaybolması hatası giderildi.
- **Bug #7 (AI Önerileri Sıfır Fiyat Fallback):** Yapay zeka piyasa genel önerilerinde fiyatı `0.0` dönen fallback varlıklar için `get_ticker_summary` entegre edilerek güncel fiyatların başarıyla çekilmesi sağlandı.
- **Bug #11 (YF Download Multi-Index Hatası):** Kripto bulk indirme işleminde yfinance'ten dönen tek sembollü çoklu indeks serilerindeki parse hatası düzeltildi.

#### Veritabanı ve Sunucu Performans İyileştirmeleri:
- **Bug #8 (Oturum Temizleme Optimizasyonu):** `ChatStore._cleanup` temizleme işleminin her okunma/dokunulma (touch) işleminde gereksiz çalışması engellendi. Artık sadece `create()` ve `add_message()` işlemlerinde %5 olasılıkla tetikleniyor.
- **Bug #9 (Çeviri Önbelleği Full Table Scan Fix):** `TranslationCache` üzerinde tüm tabloyu tarayan `select()` sorgusu kaldırılarak `TranslationCache.get_or_none()` ile tekil satır araması getirildi. DB üzerindeki CPU yükü düşürüldü.
- **Bug #10 (Analiz Önbelleği Full Table Scan Fix):** `AnalysisCache` sorgularında indeks kullanan `get_analysis_cache_entry()` fonksiyonu eklenerek performans artırıldı.
- **Bug #12 (Cache Warmer DAX 40):** Periyodik önbellek ısıtıcıya (`periodic_cache_warmer`) Almanya Borsası endeksi olan `^GDAXI` (DAX 40) eklendi.
- **Bug #13 (Thread Pool Concurrency Sınırlandırması):** Piyasa genel özeti çekilirken kullanılan ThreadPoolExecutor maksimum worker sayısı 15'ten 5'e düşürülerek sunucu kaynak tüketimi ve CPU darboğazları önlendi.

---

## 🔮 Gelecek Geliştirme Planları (Yol Haritası)

### 1. Avrupa Borsaları Entegrasyonunun Genişletilmesi
- Almanya dışındaki diğer Avrupa borsalarının da (Fransa `.PA`, İngiltere `.L`, İsviçre `.SW` vb.) hisselerinin aranabilmesi.
- `GBP`, `CHF`, `SEK`, `NOK` ve `DKK` para birimleri için arayüzde dinamik para birimi sembolü desteğinin tam olarak tamamlanması.

### 2. Teknik Göstergelerin Grafik Üzerinde Çizilmesi
- `SVGChart.js` üzerinde sadece fiyat çizgisini değil, hareketli ortalamaları (EMA20, EMA50, EMA200), RSI seviyelerini veya Bollinger Bantlarını da açıp kapatılabilen çizgiler halinde görselleştirme desteği.

### 3. Ajan Yanıtlarında Tablosal Gösterimlerin Zenginleştirilmesi
- RAG Sohbet pencerelerinde finansal karşılaştırmaların daha okunaklı olması için Markdown tablolarının ve mini kartların CSS entegrasyonlarının zenginleştirilmesi.

### 4. Çoklu Sağlayıcı API Yedekliliği (LLM Fallback)
- OpenCode Zen/Go API'sinde kesinti yaşandığında, sistemin çökmeden otomatik olarak Gemini veya OpenAI API anahtarlarıyla analizi tamamlayabileceği dinamik bir hata kurtarma mekanizmasının kurulması.
