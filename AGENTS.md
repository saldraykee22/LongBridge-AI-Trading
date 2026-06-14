# LongBridge AI - Ajan Kılavuzu & Dizin İndeksi

Bu dosya, projede çalışan yapay zeka ajanlarının (LLM) sistemi tanıması ve görev kapsamına göre ilgili kılavuzlara yönlendirilmesi için tasarlanmıştır.

## 📌 Alt Sistem ve Dikey Kılavuzlar
Bağlam verimliliğini ve token tasarrufunu en üst seviyeye çıkarmak amacıyla proje kuralları dikey alanlara (features) bölünmüştür. Yapacağınız görevin kapsamına göre **yalnızca** ilgili dosyayı/dosyaları okuyun:

1. 💻 **[Genel Kodlama Standartları](agent/GENEL_STANDARTLAR.md)**: Proje genelindeki Türkçe arayüz dili kuralı, CSS değişkenleri/temalama, SQLite kilit korumaları, API bağlantıları ve ortak yapay zeka parametreleri.
2. 💬 **[RAG ve Sohbet Modülleri](agent/RAG_SOHBET.md)**: Ticker'a bağlı (`v2`) ve Ticker'dan bağımsız (`independent` + tool calling) sohbet akışları, `chat_store.py` SQLite oturum yönetimi, `useChat.js` ve `RAGChat.js` / `IndependentChat.js` bileşenleri.
3. 🔍 **[Akıllı Arama (Screener)](agent/AKILLI_ARAMA.md)**: BIST, ABD, Almanya (Xetra) ve Kripto piyasalarındaki ön tanımlı filtreler ve preset kuralları, `Screener.js` ve backend `/api/market/screener` akışları.
4. 🚀 **[Derin Araştırma (Deep Research)](agent/DERIN_ARASTIRMA.md)**: Çoklu hisseyi asenkron kuyruk yapısıyla bulk indirme, teknik/temel/hacim puanlama ve listeleme, `DeepResearch.js` ve `/api/market/deep-research` akışları.
5. 📊 **[Hisse Detay ve Analiz](agent/HISSE_DETAY.md)**: Hisse detay verileri (`get_stock_data`), multi-agent teknik/temel analizler (`get_stock_analysis`), haber duyarlılığı, `SVGChart.js` interaktif area grafiği ve `StockDetail.js`.
6. 🗺️ **[Yol Haritası ve Geçmiş](agent/YOL_HARITASI.md)**: Son güncellemeler (Haziran 2026), 11 kritik bug düzeltmesi ve gelecek geliştirme planları.

## 🧭 Ajan Çalışma Protokolü
1. Kullanıcının talebini analiz et.
2. İlgili alt sistem dikey dosyasını (örn. `agent/AKILLI_ARAMA.md`) ve gerekiyorsa `agent/GENEL_STANDARTLAR.md`'yi `view_file` ile oku.
3. İşi uyguladıktan sonra, kurallarda bir değişiklik veya yeni bir ekleme olduysa ilgili dikey kılavuz dosyasını güncelle.
