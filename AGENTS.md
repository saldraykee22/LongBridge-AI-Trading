# LongBridge AI - Ajan Kılavuzu & Dizin İndeksi

Bu dosya, projede çalışan yapay zeka ajanlarının (LLM) sistemi tanıması ve görev kapsamına göre ilgili kılavuzlara yönlendirilmesi için tasarlanmıştır.

## 📌 Alt Sistem Kılavuzları ve Kurallar
Bağlam verimliliğini artırmak amacıyla proje kuralları alt sistemlere bölünmüştür. Yapacağınız görevin kapsamına göre **yalnızca** ilgili dosyayı/dosyaları okuyun:

1. 💻 **[Arka Plan Kuralları](.agent/ARKA_PLAN.md)**: FastAPI, LiteLLM modelleri, veritabanı, caching, Yahoo Finance sınırlamaları ve JSON parsing kuralları.
2. 🎨 **[Ön Yüz Kuralları](.agent/ON_YUZ.md)**: React 19, Next.js yapısı, SVG grafikler, CSS değişkenleri, `requestIdRef` kullanımı ve tarayıcı depolama kuralları.
3. 🗺️ **[Yol Haritası ve Geçmiş](.agent/YOL_HARITASI.md)**: Son güncellemeler (Haziran 2026) ve gelecek geliştirme planları.

## ⚡ Çalıştırma Komutları ve Mimari Özet
- **Genel Yapı:** Tek sayfa uygulaması (SPA), yönlendirme yok, tüm durum `page.js` üzerinde yönetilir.
- **Backend Başlatma:** `cd backend && .\venv\Scripts\uvicorn.exe main:app --reload --host 0.0.0.0 --port 8000`
- **Frontend Başlatma:** `cd frontend && npm run dev`
- **API Proxy:** Tüm API istekleri `/api/` önekiyle backend'e yönlendirilir.

## 🧭 Ajan Çalışma Protokolü
1. Kullanıcının talebini analiz et.
2. İlgili alt sistem dosyalarını (örn. `.agent/ARKA_PLAN.md`) `view_file` ile oku.
3. İşi uyguladıktan sonra, kurallarda bir değişiklik veya yeni bir ekleme olduysa ilgili kılavuz dosyasını güncelle.
