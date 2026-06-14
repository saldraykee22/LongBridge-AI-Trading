<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🎨 Ön Yüz (Frontend) Kılavuzu

Bu dosya, frontend tarafındaki React/Next.js uygulaması, kullanıcı arayüzü ve UI bileşen standartlarını içerir.

## ⚙️ Teknik Yapı ve Mimari
- **Framework:** Next.js 16.2.7 / React 19.2.4 (Tek Sayfa Uygulaması - SPA, yönlendirme/routing yoktur, tüm durum `frontend/src/app/page.js` üzerinde yönetilir).
- **Yardımcı Fonksiyonlar:** Fiyat formatlama ve rozet sınıfları `frontend/src/app/utils.js` dosyasındadır.
- **Bileşenler (Components):** `frontend/src/app/components/` klasöründe yer alır (`Watchlist.js`, `MarketOverview.js`, `RAGChat.js`, `StockDetail.js`, `Screener.js`, `DeepResearch.js`, `SVGChart.js`).
- **Özel Kancalar (Custom Hooks):** `frontend/src/app/hooks/` altında tanımlıdır (`useStockData.js`, `useSearch.js`).
- **Model Seçici / Navigasyon:** Model seçici dropdown'ı barındıran Navbar `frontend/src/app/Navbar.js` dosyasındadır.
- **CSS ve Tema:** Vanilla CSS (`frontend/src/app/globals.css`). Tema yönetimi için CSS değişkenleri kullanılır.
- **İkon Seti:** `lucide-react`
- **Çalıştırma Komutu:** `cd frontend && npm run dev`

---

## 🎨 Tasarım ve Arayüz Kuralları
- Arayüz dili **tamamen Türkçe** olmalıdır.
- **Tema CSS Değişkenleri:** Geliştirmelerde mutlaka şu değişkenler kullanılmalıdır:
  - `--primary`: Ana marka rengi
  - `--card`: Kart arka planı
  - `--border`: Kenarlık ve çizgiler
  - `--foreground`: Ön plan metin rengi
  - `--background`: Sayfa arka planı
  - `--radius`: Köşe yuvarlama yarıçapı
  - `--success`: Başarılı/Pozitif durum rengi
  - `--danger`: Hata/Negatif durum rengi
- **SVG Kuralları:** SVG bileşenlerinde renkler ve boyut stilleri `style={{ attr: 'var(--name)' }}` nesnesi ile atanmalı, sunum nitelikleri (attributes) doğrudan kullanılmamalıdır.

---

## ⚡ React, State ve Veri Yönetimi

### 1. React 19 Strict Mode Uyumluluğu
- React 19 strict mode altındaki olası yan etkileri ve senkronizasyon hatalarını önlemek için, `useEffect` blokları içerisinde `setState` yaparken mutlaka `queueMicrotask` kullanılmalıdır.

### 2. Yarış Durumu (Race Condition) Koruması
- Asenkron API çağrılarından gelen eski verilerin arayüzü bozmasını engellemek için `requestIdRef` kalıbı kullanılmalıdır.

### 3. Tarayıcı Depolama (localStorage)
- Gizlilik modlarında (Privacy/Incognito Mode) uygulamanın çökmesini engellemek için tüm `localStorage` okuma ve yazma işlemleri try-catch blokları içerisine alınmalıdır.
- Aktif sohbet oturum kimliği `localStorage` üzerinde `longbridgeChatSessionId` anahtarıyla saklanır.

### 4. Fiyat ve Para Birimi Formatlama
- Fiyatlar ve para birimi formatları `formatVal()` fonksiyonu aracılığıyla yapılmalıdır.
  - TRY -> TL (Sonek)
  - USD -> $ (Önek)
  - EUR -> € (Önek)
- Kripto para fiyatları ve ABD hisseleri için `USD`, BIST için `TRY` ve Almanya hisseleri için `EUR` kullanılmalıdır.

### 5. Hisse Yenileme Akışı
- Seçili olan hissenin verilerini yenilemek için sayfa yönlendirmesi veya tam sayfa yenilemesi yerine doğrudan `fetchStockDetails` fonksiyonu tetiklenmelidir.

---

## 📊 Grafik ve SVG Çizim Bileşenleri
- **SVG Grafik Bileşeni (`SVGChart.js`):** Grafik yolları `pathD` dizesi şeklinde oluşturulmalı, grafiğin üzerine gelindiğinde (hover) araç ipucu (tooltip) ile birlikte dikey/yatay çapraz çizgiler (crosshairs) gösterilmelidir.
- **Skor/Puan Halkası:** SVG daireleri üzerinde `dasharray` ve `dashoffset` öznitelikleri kullanılarak puanı görselleştiren halkalar tasarlanmalıdır.
- **Derin Araştırma Grafiği (DeepResearch):** Backend bu grafik için düz dizi dönmektedir (`data` dizisi). `data.history` şeklinde veri aranmamalı, doğrudan dönen dizi kullanılmalıdır.

---

## 🔧 Sık Kullanılan Geliştirici Komutları
- ESLint kontrolü için: `cd frontend && npm run lint`
- Üretim (production) derlemesi testi için: `cd frontend && npm run build`
