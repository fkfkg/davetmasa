import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-gold-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DM</span>
              </div>
              <span className="text-xl font-bold text-navy-700">
                Davet<span className="text-gold-600">Masa</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-navy-600 hover:text-gold-600">Özellikler</a>
              <a href="#pricing" className="text-sm text-navy-600 hover:text-gold-600">Fiyatlar</a>
              <a href="#how-it-works" className="text-sm text-navy-600 hover:text-gold-600">Nasıl Çalışır</a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-navy-600 hover:text-gold-600 px-4 py-2"
              >
                Giriş Yap
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium text-white bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 px-5 py-2.5 rounded-xl shadow-lg shadow-gold-200 hover:shadow-gold-300"
              >
                Ücretsiz Dene
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gold-100 text-gold-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6 animate-fade-in">
            <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse-gold" />
            Düğün salonları için #1 masa planı sistemi
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-800 leading-tight mb-6">
            Masa Karışıklığını
            <br />
            <span className="bg-gradient-to-r from-gold-500 to-gold-700 bg-clip-text text-transparent">
              Tarihe Gömün
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-navy-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Misafir listesi oluşturun, masaları düzenleyin, sürükle-bırak ile
            yerleştirin. PDF çıktı alın, QR kod ile misafirlerin masasını
            bulsun. Her şey bulutta, güvenle.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold rounded-2xl text-lg shadow-xl shadow-gold-200 hover:shadow-gold-300 hover:-translate-y-0.5"
            >
              Ücretsiz Başla →
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 bg-white text-navy-700 font-semibold rounded-2xl text-lg border border-cream-300 hover:border-gold-300 hover:bg-cream-50 hover:-translate-y-0.5"
            >
              Nasıl Çalışır?
            </a>
          </div>
          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div>
              <div className="text-3xl font-bold text-gold-600">500+</div>
              <div className="text-sm text-navy-400 mt-1">Misafir Desteği</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gold-600">PDF</div>
              <div className="text-sm text-navy-400 mt-1">Anında Çıktı</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gold-600">QR</div>
              <div className="text-sm text-navy-400 mt-1">Masa Sorgulama</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-800 mb-4">
              Neden DavetMasa?
            </h2>
            <p className="text-navy-500 max-w-xl mx-auto">
              Tek bir yerden misafir listesi, masa planı ve etkinlik yönetimi
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "👥",
                title: "Misafir Yönetimi",
                desc: "Excel/CSV yükleme, taraf ve grup bilgisi, VIP/çocuk/yaşlı işaretleme, arama ve filtreleme",
              },
              {
                icon: "🪑",
                title: "Sürükle-Bırak Masa Planı",
                desc: "Masaları sürükleyerek konumlandırın, misafirleri atayın, kapasite dolduğunda otomatik uyarı alın",
              },
              {
                icon: "📱",
                title: "QR Kod ile Masa Sorgulama",
                desc: "Etkinlik girişine QR kodu asın, misafir telefondan adını aratarak masasını bulsun",
              },
              {
                icon: "🖨️",
                title: "PDF Çıktı",
                desc: "Masa listelerini, misafir yerleşimini ve oturma düzenini profesyonel PDF olarak indirin",
              },
              {
                icon: "☁️",
                title: "Bulutta Güvenli Saklama",
                desc: "Veriler profesyonel sunucularda şifreli saklanır. Tarayıcı kapansa bile hiçbir veri kaybolmaz",
              },
              {
                icon: "📊",
                title: "Anlık İstatistikler",
                desc: "Toplam misafir, oturan, oturmayan, masa doluluk oranı — her şey tek panelde",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl bg-cream-50 border border-cream-200 hover:border-gold-300 hover:shadow-lg hover:shadow-gold-100 hover:-translate-y-1"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-navy-700 mb-2">
                  {feature.title}
                </h3>
                <p className="text-navy-500 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-800 mb-4">
              5 Adımda Hazır
            </h2>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            {[
              { step: "1", title: "Hesap Aç", desc: "E-posta veya Google ile kayıt ol" },
              { step: "2", title: "Etkinlik Oluştur", desc: "Düğün bilgilerini gir" },
              { step: "3", title: "Misafir Ekle", desc: "Tek tek veya CSV ile toplu yükle" },
              { step: "4", title: "Masaları Düzenle", desc: "Sürükle-bırak ile yerleştir" },
              { step: "5", title: "Paylaş", desc: "PDF indir, QR kod oluştur" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 shadow-lg shadow-gold-200">
                  {item.step}
                </div>
                <h3 className="font-semibold text-navy-700 mb-1">{item.title}</h3>
                <p className="text-sm text-navy-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-800 mb-4">
              Basit ve Şeffaf Fiyatlandırma
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="p-8 rounded-2xl bg-cream-50 border border-cream-200">
              <div className="text-sm font-medium text-navy-400 mb-2">Ücretsiz</div>
              <div className="text-4xl font-bold text-navy-800 mb-1">0 ₺</div>
              <div className="text-sm text-navy-400 mb-6">Sonsuza kadar</div>
              <ul className="space-y-3 text-sm text-navy-600 mb-8">
                <li className="flex items-center gap-2"><span className="text-success">✓</span> 1 etkinlik</li>
                <li className="flex items-center gap-2"><span className="text-success">✓</span> 50 misafir</li>
                <li className="flex items-center gap-2"><span className="text-success">✓</span> 5 masa</li>
                <li className="flex items-center gap-2"><span className="text-success">✓</span> PDF çıktı</li>
                <li className="flex items-center gap-2"><span className="text-success">✓</span> QR sorgulama</li>
              </ul>
              <Link href="/register" className="block text-center py-3 rounded-xl border border-gold-300 text-gold-600 font-medium hover:bg-gold-50">
                Ücretsiz Başla
              </Link>
            </div>
            {/* Tek Etkinlik — Popular */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-gold-50 to-white border-2 border-gold-400 shadow-xl shadow-gold-100 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                EN POPÜLER
              </div>
              <div className="text-sm font-medium text-gold-600 mb-2">Tek Etkinlik</div>
              <div className="text-4xl font-bold text-navy-800 mb-1">399 ₺</div>
              <div className="text-sm text-navy-400 mb-6">Tek seferlik</div>
              <ul className="space-y-3 text-sm text-navy-600 mb-8">
                <li className="flex items-center gap-2"><span className="text-success">✓</span> 1 etkinlik</li>
                <li className="flex items-center gap-2"><span className="text-success">✓</span> 500 misafir</li>
                <li className="flex items-center gap-2"><span className="text-success">✓</span> Sınırsız masa</li>
                <li className="flex items-center gap-2"><span className="text-success">✓</span> PDF çıktı</li>
                <li className="flex items-center gap-2"><span className="text-success">✓</span> QR sorgulama</li>
                <li className="flex items-center gap-2"><span className="text-success">✓</span> CSV yükleme</li>
              </ul>
              <Link href="/register" className="block text-center py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-white font-medium hover:from-gold-600 hover:to-gold-700 shadow-lg shadow-gold-200">
                Hemen Al
              </Link>
            </div>
            {/* Salon */}
            <div className="p-8 rounded-2xl bg-cream-50 border border-cream-200">
              <div className="text-sm font-medium text-navy-400 mb-2">Salon Paketi</div>
              <div className="text-4xl font-bold text-navy-800 mb-1">1.499 ₺</div>
              <div className="text-sm text-navy-400 mb-6">/ ay</div>
              <ul className="space-y-3 text-sm text-navy-600 mb-8">
                <li className="flex items-center gap-2"><span className="text-success">✓</span> Sınırsız etkinlik</li>
                <li className="flex items-center gap-2"><span className="text-success">✓</span> 2.000 misafir/etkinlik</li>
                <li className="flex items-center gap-2"><span className="text-success">✓</span> Salon logosu</li>
                <li className="flex items-center gap-2"><span className="text-success">✓</span> 3 çalışan hesabı</li>
                <li className="flex items-center gap-2"><span className="text-success">✓</span> Öncelikli destek</li>
              </ul>
              <Link href="/register" className="block text-center py-3 rounded-xl border border-gold-300 text-gold-600 font-medium hover:bg-gold-50">
                İletişime Geç
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-navy-700 to-navy-900 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-4">
            İlk Etkinliğinizi Ücretsiz Oluşturun
          </h2>
          <p className="text-navy-200 mb-8">
            Kredi kartı gerekmez. 2 dakikada hazır.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold rounded-2xl text-lg shadow-xl"
          >
            Ücretsiz Başla →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-navy-800 text-navy-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-gold-500 to-gold-700 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">DM</span>
            </div>
            <span className="text-sm font-medium text-white">DavetMasa</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} DavetMasa. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
