# 💻 Arka Plan (Backend) Kılavuzu

Bu dosya, backend tarafındaki FastAPI uygulaması, veritabanı şeması, önbellekleme (caching) kuralları ve veri çekme/LLM entegrasyonu standartlarını içerir.

## ⚙️ Teknik Yapı ve Kütüphaneler
- **Framework:** FastAPI (`backend/main.py`)
- **Veri Depolama:** SQLite (`backend/longbridge.db`) — `YFinanceCache`, `AnalysisCache`, `TranslationCache`, `ChatSession` tabloları (`backend/models.py` dosyasında Peewee ORM ile tanımlıdır).
- **Oturum Yönetimi:** SQLite tabanlı oturum deposu (`backend/chat_store.py` dosyasında `ChatStore` sınıfı ile yönetilir).
- **Model Entegrasyonu:** LiteLLM (`provider/model-name` formatında).
- **Çalıştırma Komutu:** `cd backend && .\venv\Scripts\uvicorn.exe main:app --reload --host 0.0.0.0 --port 8000`

---

## 🔗 API Endpoint'leri (Servisler)
Backend tarafındaki tüm servislerin listesi ve işlevleri aşağıdadır:
- `GET /api/stock/{ticker}` - Hisse senedinin genel özet verilerini getirir.
- `GET /api/stock/{ticker}/chart` - Grafik çizimi için hissenin geçmiş fiyat serisini getirir.
- `GET /api/stock/{ticker}/analysis` - Çok ajanlı (multi-agent) yapay zeka analiz raporunu tetikler/döner.
- `POST /api/chat/session` - Yeni bir yapay zeka sohbet oturumu oluşturur (UUID döner).
- `GET /api/chat/session/{session_id}` - Oturuma ait mesaj geçmişini getirir.
- `POST /api/chat/session/{session_id}/reset` - Oturum geçmişini ve bağlamını sıfırlar.
- `POST /api/chat/v2` - Oturum destekli olarak yapay zeka sohbet yanıtı üretir.
- `GET /api/chat/stats` - Aktif sohbet oturum istatistiklerini (aktif oturum sayısı, TTL vb.) döner.
- `GET /api/config` - Aktif kullanılan LLM modeli yapılandırmasını getirir.
- `POST /api/config` - Aktif LLM modelini günceller ve `.env` dosyasına yazar.
- `POST /api/market/scan` - Teknik momentum puanlarına göre piyasayı tarar ve en iyi fırsatları bulur.
- `GET /api/market/scan/status/{task_id}` - Başlatılan piyasa tarama görevinin durumunu sorgular.
- `POST /api/market/deep-research` - Veritabanındaki tüm şirketleri tarayan asenkron derin araştırma başlatır.
- `GET /api/market/deep-research/status/{task_id}` - Derin araştırma görevinin durumunu sorgular.
- `GET /api/market/overview` - Endekslerin genel özet ve durum verilerini getirir (DAX 40 dahil).
- `GET /api/market/screener` - Filtrelere göre hisse senedi tarayıcı verilerini getirir.
- `GET /api/market/ai-ranking` - AI Strateji Karşılaştırma sıralama verilerini getirir.
- `GET /api/market/recommendations` - Genel yatırım ve piyasa önerilerini getirir.

---

## ⚠️ Kodlama Kuralları ve Dikkat Edilecek Hususlar

### 1. Hisse Senedi Kodu Formatlama (`format_ticker`)
- `format_ticker(ticker)` fonksiyonu, 5 karakterli sembolleri veya BIST listesinde olan hisseleri BIST hissesi olarak kabul eder ve sonuna `.IS` ekler.
- Almanya hisseleri için `known_germany_stocks` kümesindeki hisselere (SAP, SIE, ALV, VOW3, BMW, DTE, BAS, BAYN, IFX, MBG) `.DE` son eki eklenir.
- 2-3 karakter uzunluğundaki US hisseleri (AI, GE, V, MA, WMT) `.IS` son eki almaz, aynen korunur.

### 2. Zaman Aşımları (Timeouts) ve Hız Sınırları (Rate Limiter)
- **yfinance** istekleri için global `requests.Session.request` zaman aşımı **30 saniye** olarak ayarlanmıştır.
- Yahoo Finance rate limit engellerini aşmak için `yf_rate_limit_wait()` fonksiyonu **2 saniyelik bekleme süresi (cooldown)** ile çalışmalıdır.
- Thread kilitlenmelerini önlemek için bekleme (`time.sleep`) işlemi kilit (`with _yf_rate_limit_lock:`) dışarısında gerçekleştirilmelidir.

### 3. JSON Çıkarma ve LLM Entegrasyonu
- LLM yanıtlarından JSON verilerini ayıklamak için iki katmanlı (doğrudan parse + dengeli parantez regex'i) `extract_json` yardımcısı kullanılmalıdır.
- OpenAI uyumlu modellerde JSON çıktıların stabilitesini artırmak için LLM çağrılarında `response_format={"type": "json_object"}` parametresi kullanılmalıdır.
- JSON çıktıları başarıyla ayıklandıktan sonra Pydantic modelleri (`StockAnalysisResponse`, `MarketRecommendationsResponse`, `NewsSentimentResponse`) ile doğrulanmalıdır.

### 4. Önbellekleme (Caching) Standartları
- SQLite veritabanı kilitlenme hatalarını önlemek için **WAL modu** ve `busy_timeout=30000` aktif edilmiştir.
- Önbellek anahtarı uyumsuzluklarını önlemek için `get_stock_data` ve `get_stock_analysis` gibi fonksiyonlarda yfinance cache anahtarları `.IS` ve `.DE` soneklerinden arındırılarak `base_ticker` üzerinden tutulmalıdır.
- Haber duyarlılık analizleri 30 dakikalık (`1800s`) TTL ile `sentiment_{ticker}` anahtarı altında önbelleğe alınır.
- Hatalı sunucu yanıtları, aşırı yüklenmeyi önlemek amacıyla 60 saniyelik sabit TTL ile önbelleğe alınmalıdır.
- `periodic_cache_warmer` (Önbellek Isıtıcı) API sınırlarını aşmamak için LLM çağrılarını atlayacak şekilde `skip_translation=True` ile çalışmalıdır.

### 5. Oturum Yönetimi ve Eviction
- Sohbet oturumlarının TTL değeri varsayılan 3600 saniyedir ve `CHAT_SESSION_TTL` env değişkeniyle yapılandırılır.
- Oturum temizleme yükünü azaltmak amacıyla `ChatStore._cleanup` işlemi her istekte değil, **%5 olasılıkla** (`random.random() < 0.05`) çalıştırılmalıdır.
- Analiz önbelleği evict edilirken eşzamanlı döngü hatalarını önlemek için `_dynamic_ai_cache_dict` üzerinde LRU algoritması (en eski 5 kaydı temizleme) uygulanır.
