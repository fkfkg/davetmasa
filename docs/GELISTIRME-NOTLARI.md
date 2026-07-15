# DavetMasa - Oturma Düzeni Uygulaması

Bu proje, düğün ve etkinlikler için masa ve misafir oturma düzenini ayarlayan, şifreli lisans sistemine sahip bir masaüstü uygulamasıdır.

## Mimari ve Altyapı
- **Arayüz & Backend:** Next.js (Standalone modda) + React + Tailwind CSS
- **Masaüstü Sarıcısı:** Electron.js + Electron Builder
- **Veritabanı:** `data/` klasöründe yerel JSON tabanlı (şifrelenmiş) veri dosyaları.

## Lisans ve Güvenlik Sistemi (Yeni Güncelleme)
Uygulamaya üst düzey bir lisans sistemi entegre edilmiştir:
- **RSA/ECDSA Algoritması:** Lisans anahtarları Asimetrik Şifreleme ile üretilir. Uygulama sadece `Public Key` barındırır, böylece dışarıdan tersine mühendislikle sahte anahtar üretilmesi imkansızdır.
- **Hardware ID (Donanım Kimliği):** Her lisans kodu sadece üretildiği bilgisayarın anakart/işlemci kimliğinde çalışır.
- **Zaman Hilesi Koruması:** `lastSeen` mekanizması ile bilgisayarın saati geri alınsa bile uygulama bunu algılar ve lisansı iptal eder.
- **AdminKeygen.exe:** Lisans anahtarı üretmek için sadece geliştiricide kalması gereken ayrı bir komut satırı aracı oluşturulmuştur.

## Çözülen Kritik Hatalar
- **EPIPE Broken Pipe Hatası:** Windows işletim sistemlerinde Electron uygulaması arka planda çalışırken `console.log` kullanıldığında oluşan çökme (crash) sorunu, `main.js` içerisinde üretim (production) modunda konsol çıktıları susturularak çözüldü.
- **Klasör İzinleri (EPERM):** Kurulum `C:\Program Files` altına yapıldığında Windows'un dosya yazma engeline takılması sorunu, tüm veritabanı ve kayıt dosyalarının `%AppData%` (User Data Path) içine yazılması sağlanarak çözüldü.
- **Asar Kısıtlaması:** Next.js standalone sunucusunun `.asar` arşivi içerisinden çalışamaması sorunu, `package.json` üzerinden `asar: false` yapılarak düzeltildi.
- **Base64 Bozulması:** Lisans kodlarının büyük harfe çevrilip bozulması ve kopyalama boşlukları (trim) hataları giderildi.

## Derleme ve Dağıtım (Build)
Projeyi müşteriye göndermek üzere EXE haline getirmek için şu komut kullanılır:
```bash
npm run dist
```

## Son Yapılan Düzeltmeler

### Uygulama Açılışı ve Paketleme
- Masaüstü kısayolunun açtığı `C:\Program Files\OturmaDuzeni\OturmaDuzeni.exe` güncellendi.
- Electron paketinde Next.js standalone sunucusunun yanlışlıkla tekrar Electron uygulaması gibi açılması düzeltildi.
- Paketli uygulamada sunucu artık `ELECTRON_RUN_AS_NODE=1` ile Node modunda başlatılıyor.
- Uygulama iç penceresi `/dashboard` ekranına açılacak şekilde ayarlandı.
- Port çakışması olursa uygulama 3000'den başlayarak boş port bulacak şekilde düzenlendi.
- Paket içinde CSS ve public dosyaları yanlış yerde kaldığında arayüzün bozulması düzeltildi.
- Dev logo / kocaman siyah görsel sorunu, `.next/static` ve `public` dosyalarının Next standalone klasörüne taşınmasıyla giderildi.

### QR Kod ve Yerel Ağ Sistemi
- QR linkleri artık `localhost` kullanmıyor.
- Bilgisayarın yerel ağ IP adresi otomatik bulunuyor.
- QR linkleri şu formata çevrildi: `http://192.168.x.x:PORT/public/...`
- Yeni `/api/network` endpoint'i eklendi; yerel IP adresini ve çalışan portu döndürüyor.
- Uygulamanın iç sunucusu yerel ağdaki telefon ve diğer bilgisayarlardan erişilebilmesi için `0.0.0.0` üzerinde dinleyecek şekilde ayarlandı.
- Uygulama penceresi kendi içinde yine `127.0.0.1` üzerinden güvenli şekilde açılıyor.
- Test edilen örnek adres: `http://192.168.1.25:3000/public/...`
- Test sonucunda yerel ağ public sayfası `200` cevap verdi.

### Manuel IP Ayarı
- Ayarlar ekranına “Yerel Ağ QR Bağlantısı” bölümü eklendi.
- Otomatik bulunan IP bu ekranda gösteriliyor.
- Otomatik IP bulunamazsa kullanıcı manuel IP girebiliyor.
- Manuel IP girilirse QR kod bağlantılarında otomatik IP yerine bu değer kullanılıyor.

### Windows Firewall Uyarısı
- QR ekranına Windows Güvenlik Duvarı uyarısı eklendi.
- Kullanıcıya izin penceresi çıkarsa “İzin ver” seçmesi gerektiği belirtiliyor.
- Telefonların ve diğer bilgisayarların aynı Wi-Fi / yerel ağda olması gerektiği yazıldı.
- Bu uyarı yazdırma çıktısında görünmeyecek şekilde `no-print` alanında tutuldu.

### Lisans Süresi Bittiğinde Kilit Ekranı
- Lisans süresi bittiğinde aktivasyon ekranı kilit ekranı gibi davranacak şekilde güncellendi.
- Süre dolduysa başlık “Lisans Süresi Doldu” olur.
- Ekranda kilit ikonu gösterilir.
- “PC Adresiniz” alanında bilgisayarın Hardware ID bilgisi gösterilir.
- Kullanıcıya “Lütfen bu bilgisayar için key yenileyin” mesajı gösterilir.
- Kullanıcı bu PC adresini lisans satıcısına gönderip yeni key alabilir.
Bu komut, uygulamayı derler ve `dist/OturmaDuzeni Setup.exe` dosyasını oluşturur.
Oluşan dosya standart bir "İleri-İleri-Kur" sihirbazına (Wizard) sahiptir ve masaüstü kısayolunu otomatik oluşturur.

## Yazdırma ve PDF Kaydetme Güncellemesi
- Yazdırma ekranındaki eski `window.print()` akışı değiştirildi.
- Artık buton doğrudan A4 PDF oluşturup Masaüstü'ne kaydeder.
- PDF dosya adı organizasyon adı ve etkinlik tarihiyle oluşturulur.
- Aynı isimli dosya varsa üstüne yazılmaz; sonuna numara eklenir.
- PDF üretimi Electron `printToPDF` üzerinden yapılır, bu yüzden fiş/fatura yazıcısına yanlışlıkla gönderme sorunu engellenir.
- PDF sayfa boyutu A4 portrait olarak sabitlendi.
- Yazdırmada görünmemesi gereken kontrol butonları `no-print` ile PDF dışında bırakılır.

## Yerel Veri ve Dashboard Güncellemesi
- Dashboard'un sürekli “Organizasyonunuzu Oluşturun” ekranına düşmesine sebep olan yerel sorgu hatası düzeltildi.
- Yerel Supabase taklidine `.in(...)` sorgu desteği eklendi.
- Kayıt işlemleri diske yazma tamamlanmadan bitmiş sayılmayacak şekilde güncellendi.
- Etkinlik detayındaki “Toplam Misafir”, “Oturan”, “Oturmayan” ve “Masa Sayısı” istatistikleri artık gerçek yerel veriden hesaplanıyor.
- Masalar, misafirler ve masa atamaları kaydedildikten sonra ekranda doğru sayılara yansır.

## Klavye ve Form Odak Düzeltmesi
- Electron penceresinde inputlara yazı yazmayı etkileyen odak problemi için pencere açılışında ve pencere odaklandığında `webContents.focus()` çağrısı eklendi.
- Varsayılan Electron menüsü kaldırıldı; klavye odağunun menüye kayması engellendi.
- Arka plan yavaşlatma kapatıldı.
- Yerel kullanıcı oluşturma işlemi kayıt tamamlanmadan devam etmeyecek şekilde güncellendi.
- Chrome üzerinde misafir ekleme inputu test edildi; inputa yazı girme başarılı.

## Uygulama ve Kurulum İkonu Güncellemesi
- Kullanıcının verdiği `ChatGPT Image 3 Tem 2026 15_26_01.png` görselinden Windows `.ico` ikon dosyası üretildi.
- Normal uygulama exe ikonu `build/icon.ico` üzerinden ayarlandı.
- Setup / kurulum exe ikonu `build/installer.ico` üzerinden ayarlandı.
- Electron Builder `win.icon`, `nsis.installerIcon`, `nsis.uninstallerIcon` ve `nsis.installerHeaderIcon` ayarları güncellendi.
- `public/icon.png` aynı görselle yenilendi; uygulama pencere ikonu da aynı logoyu kullanır.
- Masaüstündeki `OturmaDuzeni Setup.exe` ve `Oturma Düzeni Kurulum.exe` yeni ikonlu setup dosyasıyla yenilendi.
- Kurulu `C:\Program Files\OturmaDuzeni\OturmaDuzeni.exe` yeni ikonlu sürümle güncellendi.
- Public Desktop üzerindeki `Oturma Düzeni.lnk` kısayolu yeni exe ikonuna tekrar bağlandı.

## Salon Sablonu ve Yedekleme Guncellemesi
- Ayarlar ekranina "Salon Sablonlari" bolumu eklendi.
- Salon sablonu artik sadece alan olcusunu degil, masa yerlesimlerini de saklar.
- Her sablon masasinda `id`, `name`, `x`, `y`, `width`, `height`, `capacity`, `type`, `rotation`, `shape`, `color` ve `sort_order` bilgileri tutulur.
- Yeni etkinlik olustururken "Sifirdan Basla" veya "Salon Sablonundan" secimi eklendi.
- Sablondan etkinlik olusturulunca masalar deep copy ile kopyalanir ve her masa icin yeni ID uretilir.
- Bu sayede Dugun 1'de masa silmek veya tasimak Dugun 2'yi ya da ana salon sablonunu etkilemez.
- Salon plani editorune "Bu duzeni sablon kaydet" butonu eklendi.
- Kullanici mevcut etkinlikte salonu hazirlayip ayni duzeni tekrar kullanilabilir salon sablonu olarak kaydedebilir.
- Sablondan gelen etkinliklerde salon alan olcusu etkinlige kaydedilir; editor bu olcuyu kullanir.
- Ayarlar ekranina "Yedekleme" bolumu eklendi.
- "Yedek Al" butonu organizasyon, etkinlik, misafir, masa, salon sablonu, QR/PDF verileri ve ayarlari JSON olarak indirir.
- Yedek dosyasina lisans, sifre, cihaz kimligi, private key, token ve gizli anahtar gibi guvenlik verileri eklenmez.
- "Yedekten Geri Yukle" yapmadan once sistem otomatik olarak mevcut verinin guvenlik yedegini alir.
- Yanlis yedek yuklenirse `backups/geri-yukleme-oncesi-...json` dosyasindan onceki veriye donulebilir.
- Derleme testi `npm run build` ile yapildi ve basarili tamamlandi.

## Misafir CSV Disa Aktarma Guncellemesi
- Misafir listesi ekranina `CSV Indir` butonu eklendi.
- Excel'de acilabilmesi icin dosya UTF-8 BOM ile uretilir.
- Disari aktarilan alanlar: Ad Soyad, Telefon, Taraf, Grup, Masa, Not, VIP, Cocuk, Yasli.
- Mevcut CSV yukleme akisi korunur.

## Son Kontrol ve Paketleme
- Salon sablonu testinde masa yerlesimlerinin tam saklandigi dogrulandi.
- Sablondan olusturulan Dugun 1 ve Dugun 2 masalarinin yeni ID aldigi dogrulandi.
- Dugun 1'de masa degisikligi yapildiginda Dugun 2'nin etkilenmedigi dogrulandi.
- "Bu duzeni sablon kaydet" akisinin mevcut masa yerlesimini yeni salon sablonuna kaydettigi dogrulandi.
- Yedek alma testinde gizli alanlarin yedege girmedigi dogrulandi.
- Yedekten geri yukleme oncesinde otomatik guvenlik yedegi olustugu dogrulandi.
- Misafir ekleme ve masaya atama verisi dogrulandi.
- QR public sayfasi, PDF sayfasi, ayarlar, yeni etkinlik, salon editoru, lisans ve sifre ekranlari 200 durum koduyla test edildi.
- CSV ice aktarma ve CSV disa aktarma parser testi basarili oldu.
- `npm run dist` ile yeni Windows setup olusturuldu.
- Yeni setup dosyasi `dist-electron/OturmaDuzeni Setup 0.1.0.exe` altinda olustu.
- Masaustundeki `OturmaDuzeni Setup.exe` ve `Oturma Duzeni Kurulum.exe` yeni setup dosyasiyla yenilendi.
- `AdminKeygen.exe` / `Keygen` dosyalari musteri paketine ve kurulu uygulama klasorune dahil edilmedi.
- Kurulu uygulama `C:\Program Files\OturmaDuzeni` altinda yeniden kurulum yapmadan guncellendi.
- Public Desktop kisayolu `C:\Program Files\OturmaDuzeni\OturmaDuzeni.exe` hedefini gostermeye devam ediyor.
- Kurulu uygulama acildi; `/settings`, `/events/new`, `/api/backup`, `/activation`, `/login` yollari paketli uygulama uzerinde basarili cevap verdi.

## Paketli Uygulama CSS Duzeltmesi
- Paketli uygulamada ekranin duz HTML gibi acilmasina sebep olan static/CSS kopyalama sorunu giderildi.
- `main.js` icindeki standalone asset kopyalama mantigi guncellendi; uygulama acilista eski static dosyalari tutmayip yeni build static/public dosyalarini kopyalar.
- Kurulu `C:\Program Files\OturmaDuzeni` klasoru yeni paketle tekrar esitlendi.
- Masaustundeki setup dosyalari yeniden olusturulan setup ile yenilendi.
- Paketli uygulama acilip `/dashboard` ve ana CSS dosyasi test edildi; CSS dosyasi 200 cevabi verdi.
