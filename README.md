# LongBridge AI

> Çoklu ajan (multi-agent) yapay zeka destekli BIST, ABD ve kripto varlık analiz terminali. LiteLLM + FastAPI + React 19 + Next.js 16 ile geliştirilmiştir.

LongBridge AI, seçilen bir hisse veya kripto varlık için **teknik analiz**, **temel analiz** ve **haber duyarlılığı** olmak üzere üç farklı ajanı çalıştırır, sonuçları birleştirir ve vade bazlı (kısa / orta / uzun) strateji önerileri üretir. Sohbet tabanlı RAG arayüzü, akıllı tarama (screener) ve toplu derin araştırma (DeepResearch) özellikleri içerir.

## ✨ Özellikler

- 📊 **Detaylı Hisse Analizi** — F/K, PD/DD, SMA20/50/200, RSI(14), hacim analizi, KAP haberleri
- 🤖 **Çoklu Ajan AI Raporu** — 3 ajan paralel çalışır; teknik / temel / haber görüşleri ayrı kartlarda sunulur
- 💬 **RAG Tabanlı Sohbet** — Seçilen hissenin güncel fiyat, metrik ve haberleriyle bağlamlandırılmış konuşma
- 🔍 **Akıllı Tarama (Screener)** — BIST, ABD, Kripto için tematik filtreler (değer, büyüme, temettü, vb.)
- 🚀 **Derin Araştırma (DeepResearch)** — BIST 490+ şirket, S&P 500 ve Kripto havuzlarını bulk indirme + AI ajan analizi
- 💡 **Yapay Zeka Önerileri** — Canlı piyasa verisine dayalı, vade bazlı alım-satım seviyeleri
- ⭐ **Takip Listesi** — localStorage destekli kişisel watchlist
- 🌗 **Türkçe Arayüz** — Tüm UI metni Türkçe

## 🛠 Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Backend | Python 3.11, FastAPI, Uvicorn, LiteLLM |
| Veri | yfinance, BeautifulSoup4 (Mynet/KAP fallback) |
| AI | OpenCode Zen, OpenCode Go, DeepSeek, Gemini, Anthropic (LiteLLM üzerinden) |
| Veritabanı | SQLite (Peewee ORM) — `YFinanceCache`, `AnalysisCache`, `TranslationCache`, `ChatSession` |
| Frontend | Next.js 16.2.7, React 19.2.4, Tailwind CSS v4, lucide-react |
| Grafikler | Saf SVG (gradient area chart, crosshair tooltip) |

## 📁 Proje Yapısı

```
.
├── backend/
│   ├── main.py            # FastAPI uygulaması (tüm endpoint'ler)
│   ├── chat_store.py      # SQLite-backed oturum deposu
│   ├── models.py          # Peewee modelleri (YFinanceCache, ChatSession, ...)
│   ├── bist_companies.json
│   ├── .env.example       # API anahtarları için şablon
│   └── requirements.txt
├── frontend/
│   ├── src/app/
│   │   ├── page.js        # Ana SPA — tüm state burada
│   │   ├── Navbar.js
│   │   ├── utils.js
│   │   ├── hooks/         # useStockData, useSearch
│   │   └── components/    # MarketOverview, RAGChat, StockDetail, Screener, DeepResearch, ...
│   └── package.json
├── AGENTS.md              # Proje rehberi (ajanlar için)
├── backend/AGENTS.md      # Backend kuralları
├── frontend/AGENTS.md     # Frontend kuralları
└── LICENSE
```

## 🚀 Hızlı Başlangıç

### 1. Repo'yu klonla
```bash
git clone https://github.com/saldraykee22/LongBridge-AI-Trading.git
cd LongBridge-AI-Trading
```

### 2. Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\uvicorn.exe  # Windows
# veya: source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
cp .env.example .env
# .env dosyasını aç ve en az bir API anahtarı ekle
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend (yeni terminal)
```bash
cd frontend
npm install
npm run dev
```

Tarayıcıda **http://localhost:3000** adresini aç. Backend **http://localhost:8000** üzerinde çalışıyor olmalı.

## 🔑 API Anahtarları

`backend/.env` dosyasına en az bir LLM sağlayıcısının anahtarını ekle:

| Değişken | Sağlayıcı | Nereden? |
|----------|------------|----------|
| `DEEPSEEK_API_KEY` | DeepSeek | https://platform.deepseek.com |
| `GEMINI_API_KEY` | Google Gemini | https://aistudio.google.com |
| `OPENAI_API_KEY` | OpenAI | https://platform.openai.com |
| `ANTHROPIC_API_KEY` | Anthropic | https://console.anthropic.com |
| `OPENROUTER_API_KEY` | OpenRouter | https://openrouter.ai |
| `OPENCODE_ZEN_API_KEY` | OpenCode Zen | https://opencode.ai |
| `OPENCODE_GO_API_KEY` | OpenCode Go | https://opencode.ai |

Varsayılan model `opencode-go/deepseek-v4-flash`. Navbar'dan çalışma sırasında değiştirilebilir.

## 🧪 Doğrulama

```bash
# Backend Python sözdizimi
cd backend && python -c "import ast; ast.parse(open('main.py', encoding='utf-8').read())"

# Frontend lint
cd frontend && npm run lint

# Frontend build
cd frontend && npm run build
```

## 📡 API Endpoint'leri

| Method | Path | Açıklama |
|--------|------|----------|
| `GET` | `/api/stock/{ticker}` | Hisse detay verisi (yfinance + çeviri) |
| `GET` | `/api/stock/{ticker}/chart` | Fiyat geçmişi (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y) |
| `GET` | `/api/stock/{ticker}/analysis` | 3 ajanlı AI analiz raporu |
| `GET` | `/api/stock/search` | Hisse arama (lokal + Yahoo Finance) |
| `POST` | `/api/chat/session` | Yeni sohbet oturumu |
| `POST` | `/api/chat/v2` | Mesaj gönder (session bazlı) |
| `GET` | `/api/chat/session/{session_id}` | Oturum geçmişi |
| `GET` | `/api/market/overview` | Piyasa özeti (endeksler, kripto, BIST) |
| `GET` | `/api/market/screener` | BIST/US/Kripto tarayıcı |
| `GET` | `/api/market/ai-ranking` | AI yatırım strateji raporları |
| `POST` | `/api/market/scan` | Anlık piyasa taraması (async task) |
| `POST` | `/api/market/deep-research` | 490+ hisseyi kapsayan derin araştırma (async task) |
| `GET` | `/api/config` | Aktif LLM model bilgisi |
| `POST` | `/api/config` | Aktif modeli değiştir (kalıcı) |

## ⚠️ Önemli Notlar

- Bu sistem **kişisel/deneysel** kullanım içindir, yatırım tavsiyesi niteliği taşımaz.
- Yapay zeka çıktıları yanıltıcı olabilir; gerçek işlemler için her zaman kendi araştırmanızı yapın.
- Yahoo Finance rate limit: aynı anda 1-3 paralel istek güvenli aralıktadır.
- İlk çalıştırmada SQLite tabanı otomatik oluşturulur (`backend/longbridge.db`).

## 📝 Lisans

[MIT](LICENSE) © 2026 Alper Yusuf Kesici
