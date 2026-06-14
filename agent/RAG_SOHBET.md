# 💬 RAG ve Sohbet Modülleri

LongBridge AI sohbet sistemi, iki farklı modda çalışacak şekilde yapılandırılmıştır. Bu modlar hem kullanıcı arayüzü bazında hem de arka planda tamamen izole edilmiştir.

---

## 🧭 İki Farklı Sohbet Modu

### 1. Ticker-Bağlı Sohbet Modu (`ticker`)
- **İşlevi:** Detay sayfası (`StockDetail.js`) içerisinde seçili olan hisseye odaklı çalışır.
- **Endpoint:** `POST /api/chat/v2`
- **Bağlam Entegrasyonu:** Backend tarafında güncel fiyat, son 1 aydaki fiyat değişimi ve son haberlerden oluşan bir bağlam bloğu hazırlanarak LLM'e `<GÜVENİLMEYEN_PİYASA_VERİSİ>` etiketiyle beslenir.
- **Tekerlek Değişimi:** Kullanıcı arama kısmından hisse değiştirdiğinde veya sunucu bunu algıladığında, LLM bağlamının tutarlı kalması için sohbet geçmişi otomatik olarak temizlenir (`ticker_changed=True`). Sunucunun onayladığı yeni ticker `data.new_ticker` üzerinden ön yüze bildirilir ve stale ticker durumu engellenir.
- **localStorage Anahtarı:** `longbridgeChatSessionId`

### 2. Bağımsız Sohbet Modu (`independent`)
- **İşlevi:** Herhangi bir hisse senedine bağlı değildir. Kullanıcı genel borsa soruları veya hisse senetleri hakkında karma sorular sorabilir.
- **Endpoint:** `POST /api/chat/independent`
- **Araç Desteği (Tool Calling):** Model, kullanıcı sorusuna cevap verebilmek için yfinance ve KAP verilerine bağlı dahili araçları çağırabilir:
  - `get_stock_quote`: Anlık fiyat, hacim, değişim.
  - `get_stock_news`: Son haberler ve KAP duyuruları.
  - `get_stock_fundamentals`: F/K, PD/DD, piyasa değeri vb. temel rasyolar.
  - `get_stock_history`: Hisse geçmiş fiyat grafiği özeti (OHLC).
- **Maksimum Tur:** Tool çağırma döngüsü en fazla 3 tur (`MAX_TOOL_TURNS = 3`) sürebilir.
- **localStorage Anahtarı:** `longbridgeChatSessionIdIndependent`

---

## 🗄️ SQLite Tabanlı Oturum Yönetimi (`chat_store.py`)

- **Veritabanı Tablosu:** `ChatSession` tablosunda `session_id`, `messages` (JSON formatlı liste), `current_ticker`, `mode` ve `last_active` sütunları tutulur.
- **Oturum Süresi (TTL):** Varsayılan `3600` saniyedir (1 saat). `CHAT_SESSION_TTL` env değişkeniyle özelleştirilebilir.
- **Olasılıksal Oturum Temizleme (Eviction):** Veritabanı yazma kilitlerini (write lock contention) azaltmak için eski/süresi dolmuş oturumları temizleyen `_cleanup` metodu her okuma/yazma işleminde değil, sadece **`create()` ve `add_message()`** adımlarında **%5 olasılıkla** (`random.random() < 0.05`) çalıştırılır.
- **Hata Anında Rollback:** LLM API çağrısı sırasında bir hata oluşursa, sohbet geçmişinin bozulmaması için kullanıcının son mesajı `rollback_last_message` yardımıyla oturum geçmişinden geri alınır.

---

## 🎨 Ön Yüz ve State Yönetimi

### 1. Kanca Bileşeni (`useChat.js`)
- **Dosya Yolu:** [useChat.js](file:///C:/Denemeler/RAG%20borsa%20sistemi%20deneme/frontend/src/app/hooks/useChat.js)
- **Görev:** Ticker ve independent modlarının state'lerini, mesaj gönderme (`sendMessage`), yanıt durdurma (`handleStop`) ve yeni sohbet başlatma (`handleNewSession`) fonksiyonlarını yönetir.
- **İstek Kontrolü:** İstek gönderilirken bir `AbortController` oluşturulur. Kullanıcı veya sistem isteği iptal ederse asistan mesaj listesine `⏹ Yanıt durduruldu.` eklenerek loading state'i sonlandırılır.

### 2. Arayüz Bileşenleri
- **[RAGChat.js](file:///C:/Denemeler/RAG%20borsa%20sistemi%20deneme/frontend/src/app/components/RAGChat.js):** Ticker modundaki sohbet kutusunu ve karşılama mesajlarını yönetir. `setMessages` fonksiyonunun `useChat` hook'undan destructure edilmesiyle frontend crash hatası giderilmiştir (Bug #1).
- **[IndependentChat.js](file:///C:/Denemeler/RAG%20borsa%20sistemi%20deneme/frontend/src/app/components/IndependentChat.js):** Bağımsız ve araç destekli sohbet arayüzüdür.
- **[Markdown.js](file:///C:/Denemeler/RAG%20borsa%20sistemi%20deneme/frontend/src/app/components/Markdown.js):** Asistanın ürettiği zengin metinleri (tablolar, kalın metinler, başlıklar) güvenli biçimde render etmek için kullanılır.

---

## 🔒 Güvenlik Kuralları (Prompt Injection Koruması)

Sistem bağımsız ve araç destekli sohbetlerde veri bütünlüğünü ve LLM güvenliğini korumak için 4 katmanlı güvenlik kontrolü barındırır:

1. **L1 Guard (Regex):** Kullanıcı mesajı işlenmeden önce regex tabanlı `contains_prompt_injection` kontrolünden geçirilir ve şüpheli durumlarda 400 Bad Request fırlatılır.
2. **L2 Guard (Sanitizer):** Kullanıcı girdileri `sanitize_user_input` yardımıyla temizlenerek zararlı karakterlerden arındırılır.
3. **L3 Guard (Tool Output Envelope):** Bağımsız sohbet modunda araçlardan (tools) dönen tüm yanıtlar LLM'e beslenmeden önce mutlaka `<GÜVENİLMEYEN_DIŞ_VERİ>` etiketleriyle sarmalanır ve içerisindeki hiçbir komutun/talimatın uygulanmaması LLM'e sistem promptuyla bildirilir.
4. **L4 Guard (Tool Allowlist):** Çalıştırılmak istenen fonksiyon adının `tool_registry.get_tool_names()` listesinde olup olmadığı kontrol edilir, listede bulunmayan araçlar `ToolCallLog` tablosuna `blocked=True` olarak kaydedilip engellenir.
