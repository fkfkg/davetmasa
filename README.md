# 💍 DavetMasa (Oturma Düzeni)

> Next.js ve Electron ile geliştirilen; düğün, nişan ve etkinlikler için masa yerleşimi ve misafir oturma düzeni yönetimi sağlayan Windows masaüstü uygulaması.

**Teknolojiler:** Next.js 16 (standalone) · React 19 · TypeScript · Tailwind CSS v4 · Electron · electron-builder (NSIS) · dnd-kit (sürükle-bırak) · QR kod · PapaParse (CSV)

## ⬇️ İndirme

Bu bir masaüstü uygulamasıdır; canlı web sürümü yoktur.

**➡️ [GitHub Releases sayfasından `OturmaDuzeni-Setup.exe` dosyasını indirin](https://github.com/fkfkg/davetmasa/releases/latest)**

**Kurulum:** İndirilen `OturmaDuzeni-Setup.exe` dosyasını çalıştırın → standart "İleri → İleri → Kur" sihirbazını takip edin. Masaüstü kısayolu otomatik oluşturulur. Uygulama Windows 10/11 üzerinde çalışır.

---

## 📸 Ekran Görüntüleri

<!-- Buraya salon editörü, misafir listesi ve QR ekranı görüntülerini ekleyin -->
*Ekran görüntüleri yakında eklenecek.*

---

## ✨ Özellikler

- **Görsel salon editörü** — Masaları sürükle-bırak ile yerleştirin; masa şekli, boyutu, rengi, kapasitesi ve döndürme ayarlanabilir.
- **Misafir yönetimi** — Misafir ekleme, taraf/grup/VIP/çocuk/yaşlı etiketleri, masalara atama; CSV içe ve dışa aktarma (Excel uyumlu, UTF-8 BOM).
- **Salon şablonları** — Hazırladığınız salon düzenini şablon olarak kaydedin; yeni etkinlikleri "Sıfırdan" veya "Şablondan" başlatın. Şablondan oluşturulan etkinlikler birbirinden bağımsızdır.
- **QR kod ile misafir ekranı** — Misafirler telefonlarından QR okutarak yerel ağ (`http://192.168.x.x:PORT/...`) üzerinden oturma planını görebilir. IP otomatik bulunur, gerekirse elle girilebilir.
- **A4 PDF çıktısı** — Oturma planı tek tıkla A4 PDF olarak masaüstüne kaydedilir (Electron `printToPDF`).
- **Yedekleme** — Tüm veriler tek JSON dosyasına yedeklenir; geri yükleme öncesi otomatik güvenlik yedeği alınır. Yedeklere lisans/şifre gibi gizli veriler dahil edilmez.
- **Tamamen çevrimdışı** — Veriler `%AppData%` altında yerel olarak saklanır; internet bağlantısı gerektirmez.
- **Lisans sistemi** — ECDSA asimetrik imza + donanım kimliği (HWID) tabanlı lisanslama. Uygulama yalnızca public key içerir; saat geri alma hilesine karşı koruma vardır.

## 🏗️ Mimari

```
main.js                 # Electron ana süreç (pencere, yerel sunucu, PDF)
preload.js              # Electron köprüsü
src/app/                # Next.js App Router sayfaları
├── (dashboard)/        # Panel: etkinlikler, misafirler, salon editörü, QR, yazdırma
├── (auth)/             # Giriş / kayıt / kurulum
├── activation/         # Lisans aktivasyon ve kilit ekranı
└── api/                # Yerel API: veri, yedekleme, lisans, ağ bilgisi
src/lib/                # Lisans doğrulama, HWID, yerel veri katmanı
supabase/               # Opsiyonel bulut şeması (SQL) — varsayılan mod tamamen yereldir
```

## 🚀 Geliştirme Ortamı

```bash
git clone https://github.com/fkfkg/davetmasa.git
cd davetmasa
npm install
npm run dev            # Next.js geliştirme sunucusu
npm run electron:dev   # Electron penceresiyle çalıştırma
npm run dist           # Windows kurulum dosyası üretir (dist-electron/)
```

> Not: Uygulama varsayılan olarak tamamen yerel çalışır; `.env` dosyası gerektirmez.

## 👤 Ben Ne Yaptım, AI Ne Yaptı?

- **Ben:** Ürün fikri ve gerçek düğün organizasyonu ihtiyaç analizi, ekran tasarım kararları, Windows üzerinde kurulum/paketleme testleri, yerel ağ QR akışının telefonlarla gerçek ortamda test edilmesi, lisanslama iş modeli.
- **AI (Claude / AI araçları):** Kod yazımının büyük bölümü — salon editörü, Electron paketleme yapılandırması, lisans/HWID sistemi, PDF ve QR akışları AI desteğiyle geliştirildi.

## ⚠️ Bilinen Eksikler

- Yalnızca Windows destekleniyor (macOS/Linux paketi yok).
- `package.json` build ayarları `data/` ve `davetmasa_data.json` dosyalarına başvurur; bu dosyalar kişisel veri içerdiği için repoda yer almaz — kaynak koddan paket almak için boş bir `data/` klasörü oluşturmanız gerekir.
- Lisans anahtarı üreten araç (keygen) güvenlik gereği bu repoda **yer almaz**; kaynak koddan derlenen sürüm aktivasyon ister.
- QR misafir ekranı yalnızca aynı Wi-Fi/yerel ağdaki cihazlarda çalışır; ilk açılışta Windows Güvenlik Duvarı izni gerekir.

## 🔒 Güvenlik

- Repo hiçbir private key, lisans anahtarı, şifre veya kişisel veri içermez; uygulama yalnızca public key barındırır.
- Tüm kullanıcı verileri yerel diskte (`%AppData%`) tutulur; hiçbir veri dışarı gönderilmez.
- Yedek dosyalarına lisans/şifre/cihaz kimliği gibi güvenlik verileri yazılmaz.

## 📄 Lisans

Bu depo kaynak kodun incelenmesi için herkese açıktır ancak **ticari bir üründür — tüm hakları saklıdır**. Kod, izinsiz olarak kopyalanamaz, yeniden dağıtılamaz veya ticari amaçla kullanılamaz.

---

📝 Detaylı geliştirme geçmişi için: [docs/GELISTIRME-NOTLARI.md](docs/GELISTIRME-NOTLARI.md)
