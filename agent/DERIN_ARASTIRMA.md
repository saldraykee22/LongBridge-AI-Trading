# 🚀 Derin Araştırma (Deep Research) Kılavuzu

Derin Araştırma, seçilen bir piyasadaki (BIST 614+, ABD Hisseleri, Almanya DAX 40 veya Kripto Top 200) tüm varlık havuzunu arka planda asenkron olarak tarayan, teknik puanlama ve çoklu yapay zeka ajan analizini birleştiren gelişmiş bir bulk araştırma sistemidir.

---

## 🎨 Ön Yüz Bileşeni (`DeepResearch.js`)
- **Dosya Yolu:** [DeepResearch.js](file:///C:/Denemeler/RAG%20borsa%20sistemi%20deneme/frontend/src/app/components/DeepResearch.js)
- **Arayüz Tasarımı:**
  - Kullanıcı taramak istediği pazarı seçer (BIST, NASDAQ, Almanya veya Kripto) ve **"Derin Araştırmayı Başlat"** butonuna tıklar.
  - Canlı süreç takibi için terminal benzeri bir log penceresi ve %0 ile %100 arasında değişen bir ilerleme çubuğu (progress bar) gösterilir.
  - Görev tamamlandığında, AI Puanına göre azalan sırada sıralanmış en iyi 5 yatırım fırsatının detaylı kartı render edilir.
  - Her kartta; AI Puanı, Teknik Momentum Skoru ve hisseye ait vade bazlı strateji kartları (Kısa, Orta, Uzun Vade Stratejileri, Alım/Giriş Seviyeleri, Kar Alma ve Stop-Loss Hedefleri) yer alır.

---

## 💻 Arka Plan Servisleri
- **Görev Başlatma:** `POST /api/market/deep-research` (Gövdede `market` ve `model` parametreleri alır). Görevi FastAPI `BackgroundTasks` aracılığıyla asenkron iş parçacığına fırlatır ve anında bir `task_id` döner.
- **Durum Sorgulama:** `GET /api/market/deep-research/status/{task_id}` (Görevin ilerleme yüzdesini, son aşama metnini, detaylı log satırlarını ve tamamlandıysa sonuçları döner).
- **Oturum Temizliği:** Bellek şişmesini önlemek için 1 saatten daha eski tüm derin araştırma görevleri `_cleanup_old_tasks` fonksiyonu ile otomatik temizlenir.

---

## ⚙️ Asenkron İşlem Hattı (`run_async_deep_research`)

### Adım 1: Havuz Tanımlama ve Toplu İndirme
- Seçilen pazara göre sembol havuzları belirlenir:
  - **BIST:** `bist_companies.json` dosyasından okunan **614 şirketi** kapsar (symbols sonuna `.IS` eklenir).
  - **Almanya:** `GERMANY_ACTIVE_POOL` içindeki **30 DAX hissesi**.
  - **ABD:** `POPULAR_US_STOCKS` ve ek popüler ABD hisselerinden oluşan ~30 hisse.
  - **Kripto:** CoinGecko üzerinden market cap'e göre sıralanmış en popüler Top 200 USD çifti.
- Veriler Yahoo Finance üzerinden yığın indirme (bulk download) yöntemiyle 100'erli chunk grupları halinde çekilir.

### Adım 2: Teknik Momentum Puanlaması (Scoring)
- Her hissenin son **1 aylık fiyat geçmişi** (`period="1mo"`) incelenir.
- **Parametreler:** RSI(14) (NaN filtresi uygulanarak), SMA20 trendi, haftalık fiyat değişimi ve hacim gücü (volume ratio).
- **Eşitlik Bozucu Sıralama (Tie-breaker):** En yüksek puanlı adayları belirlemek için sıralama algoritması ham ve sınırsız momentum puanı (`raw_score`) üzerinden gerçekleştirilir:
  `scored_candidates.sort(key=lambda x: (-x["raw_score"], -x.get("weekly_change", 0), -x["change"], -x["volume_ratio"]))`
  Bu sayede tavan skora ulaşan hisselerin alfabetik olarak seçilmesi engellenir ve en gerçekçi 5 aday belirlenir.

### Adım 3: Çoklu Ajan AI Analizi
- Belirlenen en iyi 5 aday sırayla çoklu ajan ekibine (Teknik, Temel ve Haber Duyarlılık Ajanları) gönderilir (`get_stock_analysis()`).
- **AI Hata Toleransı ve Fallback (Bug #7):** Bir adayın yapay zeka analizi sırasında bir hata oluşursa (örn. LLM zaman aşımı, kota limiti veya JSON parse hatası), tüm derin araştırma görevinin çökmesini engellemek için o aday `ai_score=0` ve `ai_error` hata detayı ile listeye eklenir, diğer adayların analizi devam eder.

---

## ⚠️ Kritik Hususlar ve Dikkat Edilecekler
- **Cache Eviction:** Derin araştırma esnasında yapılan yfinance sorguları sunucunun ana önbelleğini ısıtır (`set_cached_yfinance`).
- **GIL & Concurrency:** Yoğun CPU ve I/O barındıran bu işlem, sunucunun ana thread'ini engellememek için bağımsız bir asenkron task worker içerisinde koşturulur.

---

## AI Analiz Fallback Davranışı

- Derin araştırma `get_stock_analysis()` sonucunu kullandığı için, LLM analizi geçici olarak üretilemediğinde aday tamamen kaybolmaz. Analiz endpoint'i deterministik yedek JSON döndürür; yalnızca daha ağır beklenmeyen hatalarda Deep Research'in aday bazlı `ai_error` toleransı devreye girer.
