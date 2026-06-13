# LongBridge AI - Proje Rehberi

## Hızlı Başlangıç
- Backend: `cd backend && .\venv\Scripts\uvicorn.exe main:app --reload --host 0.0.0.0 --port 8000`
- Frontend: `cd frontend && npm run dev`
- Doğrulama: backend http://localhost:8000, frontend http://localhost:3000

## Mimari
- `backend/main.py` — FastAPI uygulaması (560 satır), tüm endpoint'ler
- `backend/chat_store.py` — TTL ile bellek içi oturum deposu (varsayılan 3600s)
- `frontend/src/app/page.js` — Ana SPA (738 satır)
- `frontend/src/app/Navbar.js` — Model seçici dropdown
- `frontend/src/app/layout.js` — Navbar ile kök yerleşim
- `frontend/next.config.mjs` — API proxy yeniden yazmaları
- `frontend/src/app/globals.css` — CSS değişkenleri, karanlık mod, sohbet stilleri

## Temel Kurallar
- Arayüz tamamen Türkçe
- Tema için CSS değişkenleri: --primary, --card, --border, --foreground, --background, --radius, --success, --danger
- SVG'lerde CSS değişkenleri `style={{}}` ile kullanılmalı, sunum nitelikleri ile değil
- Tüm durum page.js'de (tek sayfa uygulaması), yönlendirme yok
- API çağrıları `/api/` öneki kullanır (backend'e yeniden yazılır)
- API anahtarları `backend/.env` dosyasında, python-dotenv ile yüklenir
- 3 katmanlı JSON ayrıştırma: doğrudan -> regex denge parantezleri -> sıkı komutla yeniden deneme

## Backend Dikkat Edilecekler
- `format_ticker` (satır 84): >= 2 karakter eşiği `.IS` son ekini ekler — 2 harfli ABD hisseleri (AI, GE) bozulur
- LiteLLM model formatı: `provider/model-name` (ör. `deepseek/deepseek-v4-flash`)
- OpenCode Zen/Go yönlendirmesi `_get_litellm_kwargs` yardımcı fonksiyonu ile — `opencode/` (Zen) veya `opencode-go/` (Go) öneki özel `api_base`'ye yönlendirir
- Global `requests.Session.request` zaman aşımı 30s olarak ayarlandı (satır 15-19) yfinance için
- Windows'ta backend yeniden yükleme Askıya Alınırsa tam kapatma gerekebilir
- `extract_json` yardımcısı satır ~114'te LLM JSON çıkarma için (3 deneme)
- Tüm istek/yanıt şemaları için Pydantic `BaseModel`
- LLM için Türkçe sistem istemleri
- Opsiyonel fonksiyon parametreleri için `Optional[X] = None`
- CORS kökleri `ALLOWED_ORIGINS` env değişkeninden (virgülle ayrılmış)
- `DEEPSEEK_API_KEY` düzenleme sırasında yanlışlıkla silindi — eksikse `.env` dosyasını kontrol edin

## Frontend Dikkat Edilecekler
- React 19 sıkı modu: effect'lerde setState için `queueMicrotask` kullanın
- Eski istek koruması `requestIdRef` kalıbı ile (satır 34)
- Sohbet oturumu localStorage `longbridgeChatSessionId` anahtarında saklanır
- Aynı hisse yenileme doğrudan `fetchStockDetails` çağrısı ile yapılır
- SVG grafik: pathD dizesi, fare üzerine gelme araç ipucu ile çapraz çizgi
- Puan halkası: dasharray/dashoffset ile SVG daire
- İkonlar için `lucide-react`

## Yaygın Komutlar
- `cd frontend && npm run lint` — ESLint
- `cd frontend && npm run build` — Next.js üretim derlemesi
- Python sözdizimi kontrolü: `python -c "import ast; ast.parse(open('main.py').read())"`
- `cd backend && python -m pytest` — Testleri çalıştır

## Model Yapılandırması
- Modeller `frontend/src/app/Navbar.js` AVAILABLE_MODELS dizisinde tanımlı
- Varsayılan model `backend/.env` dosyasında `DEFAULT_MODEL` olarak
- Aktif model `POST /api/config` ile `{ model: "..." }` değiştirilebilir
- OpenCode Zen modelleri: `opencode/` öneki → `https://opencode.ai/zen/v1` adresine yönlendirir
- OpenCode Go modelleri: `opencode-go/` öneki → `https://opencode.ai/zen/go/v1` adresine yönlendirir
- Ücretsiz Zen modelleri: `deepseek-v4-flash-free`, `mimo-v2.5-free`, `nemotron-3-ultra-free`, `big-pickle`

## Son Güncellemeler (Haziran 2026)
- **BIST 100/30 Endeks Düzeltmesi**: `main.py` dosyasındaki yfinance endeks sembolleri `^XU100` / `^XU030` yerine `XU100.IS` ve `XU030.IS` olarak düzeltildi, canlı endeks değerleri doğru çekiliyor.
- **Sıralı Detay Yükleyici**: `periodic_cache_warmer` GIL thread ölü kilitlerini ve Yahoo Finance hız sınırlamasını önlemek için `0.1s` gecikmeyle sıralı detay çekilecek şekilde güncellendi.
- **Talep Üzerine Türkçe Çeviri**: Hisse açıklamalarının çeviri çalıştırılması cache warmer başlangıcı yerine talep üzerine detay çağrılarına taşındı, API limitleri aşılıyor.
- **Gelişmiş Öneri Şeması**: `generate_dynamic_ai_market_data` sistem istemi tek bir LLM isteğinde ayrıntılı vadeye dayalı stratejiler (`short_term`, `medium_term`, `long_term`, `plan`, `entry_points`, `take_profit`, `stop_loss`, `score`, `signal`) getirecek şekilde yükseltildi.
- **Strateji Bölümü Birleştirme**: `/api/market/ai-ranking`, AI önerilerini ve kullanıcı önbellek analizlerini birleştirecek şekilde güncellendi, Strateji Karşılaştırma sayfası 9 taze girişle dolu tutuldu.
- **Analiz Yolu Onarımı**: `get_stock_analysis` fonksiyonundaki eksik `@app.get("/api/stock/{ticker}/analysis")` dekoratörü düzeltildi, frontend analiz raporu kartında `404 Not Found` hataları oluşuyordu.
- **Yapay Zeka Piyasa Tarayıcı API Entegrasyonu**: Backend'e `/api/market/scan` adresi altında yeni bir POST endpoint'i eklendi. Bu endpoint seçilen piyasaya (`bist`, `us`, `crypto`) göre anlık fiyat hareketlerini tarar, teknik momentum puanları hesaplar ve en iyi 3 aday için 3 ajanlı AI detay analizini paralel olarak gerçekleştirir.
- **Fırsat Keşfet Sekmesi (Discover.js)**: Arayüze "Fırsat Keşfet" (TrendingUp simgeli) adında yeni bir sekme eklendi. Kullanıcının seçeceği borsayı tarayıp en iyi 3 fırsatı; AI Puanı, Teknik Momentum Skoru, kısa-orta-uzun vade yatırım stratejileri, giriş-kâr al-stop loss seviyeleri ve 3 ajan görüşüyle birlikte detaylı sunar.
- **Teknik Özet Önbellekleme (Caching)**: yfinance paralel sorgulamalarında zaman aşımı (`socket hang up`) hatalarını engellemek için `get_ticker_summary` fonksiyonu `get_cached_yfinance` ve `set_cached_yfinance` yardımıyla önbellek uyumlu hale getirildi.
- **Derin Araştırma Özelliği (DeepResearch.js)**: Eski "Fırsat Keşfet" (Discover) sekmesi yerine BIST veritabanındaki 490+ şirketin, S&P 500 ve Kripto havuzlarının tamamını bulk indirme tekniğiyle saniyeler içinde tarayan asenkron `DeepResearch` özelliği ve arayüzü entegre edildi.
- **Aday Seçim ve Sıralama Düzeltmesi**: Tavan yapan (üst limit skoru 95.0 olan) hisselerin alfabetik olarak seçilme hatasını önlemek için sıralama ham ve sınırsız `raw_score` parametresine kaydırıldı. `(-x["raw_score"], -x["change"], -x["volume_ratio"])` tie-breaker (eşitlik bozucu) formülüyle doğru fırsatların seçilmesi sağlandı.


## Yol Haritası ve Gelecek İyileştirme Planları
Gelecekte tüm BIST hisselerini, S&P 500'ü ve popüler kripto paraları (1000+ varlık) kapsayacak şekilde genişletmek amacıyla hazırlanan **Toplu Arka Plan Analizi ve SQLite Önbellekleme** planı [roadmap.md](file:///C:/Users/alper/.gemini/antigravity/brain/ea0c3b65-16ee-4415-9aa1-c947f2b92ebb/roadmap.md) belgesinde kayıt altına alınmıştır. İlerleyen aşamalarda bu belgedeki adımlar takip edilerek altyapı kurulabilir.

