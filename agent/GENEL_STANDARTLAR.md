# 💻 Genel Kodlama Standartları

Bu dosya, LongBridge AI projesinde kullanılan ortak kodlama standartlarını, veritabanı kilit korumalarını, yapay zeka entegrasyon ayarlarını ve çalıştırma komutlarını içerir.

---

## ⚙️ Teknik Altyapı ve Çalıştırma Komutları

### 1. Backend (Arka Plan)
- **Teknoloji:** Python 3.11, FastAPI, uvicorn, peewee ORM.
- **Çalıştırma:** `cd backend && .\venv\Scripts\uvicorn.exe main:app --reload --host 0.0.0.0 --port 8000`
- **Sözdizimi Kontrolü:** `python -c "import ast; ast.parse(open('main.py', encoding='utf-8').read())"`
- **Testler:** `cd backend && python -m pytest`

### 2. Frontend (Ön Yüz)
- **Teknoloji:** Next.js 16.2.7, React 19.2.4, Tailwind CSS v4.
- **Çalıştırma:** `cd frontend && npm run dev`
- **Linter:** `cd frontend && npm run lint`
- **Üretim Derlemesi:** `cd frontend && npm run build`

---

## 🎨 Arayüz ve Tasarım Kuralları
- **Dil:** Arayüzdeki tüm metinler, uyarılar, butonlar ve grafik etiketleri **tamamen Türkçe** olmalıdır.
- **Renk ve Temalama (CSS Değişkenleri):** Projede vanilla CSS (`globals.css`) ve Tailwind CSS ortaklaşa çalışır. Renk atamalarında mutlaka şu CSS değişkenleri kullanılmalıdır:
  - `--primary`: Ana tema/vurgu rengi
  - `--card`: Kart arka planı
  - `--border`: Kenarlık ve çizgiler
  - `--foreground`: Ön plan metin rengi
  - `--background`: Sayfa arka planı
  - `--success`: Başarılı/Pozitif durum rengi
  - `--danger`: Hata/Negatif durum rengi
- **SVG Grafiklerinde CSS Değişkenleri:** React 19 bileşenlerindeki SVG elemanlarının nitelikleri (attributes) CSS değişkeni alırken sunum nitelikleri doğrudan kullanılmamalı, mutlaka `style={{ attr: 'var(--name)' }}` formatı kullanılmalıdır.

---

## ⚡ React 19 ve State Yönetim Kuralları
- **Strict Mode Uyumluluğu:** React 19 Strict Mode altında çift render'dan kaynaklanan senkronizasyon hatalarını ve yan etkileri önlemek için, `useEffect` bloklarında state güncellenirken (`setState`) mutlaka `queueMicrotask` sarmalı kullanılmalıdır.
- **İstek İptali (Stale Request Guard):** Arama veya hisse detay fetch işlemlerinde yarış durumlarını (race condition) engellemek için `requestIdRef` ve `AbortController` mekanizmaları kullanılmalıdır.
- **localStorage Güvenliği:** Tarayıcıların gizlilik modlarında (incognito) uygulamanın çökmesini engellemek için tüm `localStorage` okuma ve yazma işlemleri try-catch sarmalı içine alınmalıdır.

---

## 🗄️ SQLite ve Peewee ORM Standartları
- **WAL Modu & busy_timeout:** Eşzamanlı okuma/yazma (read/write concurrency) işlemlerini desteklemek ve SQLite kilitlenmelerini (`database is locked`) önlemek için veritabanında **WAL modu** ve `busy_timeout=30000` aktif edilmiştir (`backend/models.py`).
- **Bağlantı Yönetimi:** Veritabanına bağlanırken her zaman `db.connect(reuse_if_open=True)` kullanılmalıdır.
- **Full Table Scan Engellemesi:** Caching tablolarında (`TranslationCache`, `AnalysisCache` vb.) arama yaparken performans için tüm tabloyu tarayan `select()` sorguları yerine, tekil satır getiren ve index kullanan `get_or_none()` / `get_analysis_cache_entry()` metotları tercih edilmelidir.

---

## 🤖 Yapay Zeka (LiteLLM) Entegrasyon Ayarları
- **Model Formatı:** Modeller `provider/model-name` (örn. `deepseek/deepseek-v4-flash`) formatında olmalıdır.
- **OpenCode Entegrasyonu:**
  - `opencode/` öneki ➔ `https://opencode.ai/zen/v1` API base'ine yönlendirilir (Zen).
  - `opencode-go/` öneki ➔ `https://opencode.ai/zen/go/v1` API base'ine yönlendirilir (Go).
  - Bu eşlemeler `backend/main.py` içerisindeki `_get_litellm_kwargs` fonksiyonunda gerçekleştirilir ve kimlik bilgileri `.env` dosyasındaki `OPENCODE_ZEN_API_KEY` ve `OPENCODE_GO_API_KEY` değişkenlerinden okunur.
- **Model Değişikliğinin Kalıcılığı:** Arayüzden yapılan aktif model değişiklikleri `_persist_model_to_env()` ve `_env_persist_lock` kullanılarak thread-safe biçimde `.env` dosyasına yazılır (böylece sunucu yeniden başladığında model sıfırlanmaz).
- **Yedek Sağlayıcı Otomatik Geçişi (LLM Fallback):** LLM API çağrılarında (özellikle OpenCode Zen/Go API'sinde bakiye yetersizliği, rate limit aşımı veya sunucu hataları durumlarında) sistemin çökmemesi ve analizin tamamlanması için `reliable_llm_completion` fonksiyonu üzerinde yedekleme mekanizması kurulmuştur. Bir sağlayıcı hata verdiğinde sırasıyla ortam değişkenlerinde yüklü olan `DEEPSEEK_API_KEY` (model: `deepseek/deepseek-chat`), `GEMINI_API_KEY` (model: `gemini/gemini-1.5-flash`) ve `OPENAI_API_KEY` (model: `gpt-4o-mini`) anahtarları taranarak çağrı otomatik olarak kurtarılır.
- **Güvenlik (Prompt Injection Guard):** Kullanıcı girdileri işlenmeden önce regex (`contains_prompt_injection`) ve girdi temizleyici (`sanitize_user_input`) kontrolünden geçirilerek LLM'e beslenmelidir.
