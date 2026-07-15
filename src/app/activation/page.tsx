'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ActivationPage() {
  const router = useRouter();
  const [hwid, setHwid] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [startingTrial, setStartingTrial] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<{
    valid: boolean;
    reason?: string;
    type?: string;
    daysLeft?: number;
  } | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/license?action=status');
      const data = await res.json();
      setHwid(data.hwid || '');
      setStatus(data);

      // Lisans geçerliyse doğrudan yönlendir
      if (data.valid) {
        router.push('/login');
        return;
      }
    } catch {
      setError('Lisans durumu kontrol edilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) return;

    setActivating(true);
    setError('');

    try {
      const res = await fetch('/api/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: licenseKey.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        router.push('/login');
        router.refresh();
      } else {
        setError(data.error || 'Aktivasyon başarısız.');
      }
    } catch {
      setError('Sunucu ile iletişim kurulamadı.');
    } finally {
      setActivating(false);
    }
  };

  const handleStartTrial = async () => {
    setStartingTrial(true);
    setError('');

    try {
      const res = await fetch('/api/license?action=trial');
      const data = await res.json();

      if (data.valid) {
        router.push('/login');
        router.refresh();
      } else {
        setError('Deneme süresi başlatılamadı.');
      }
    } catch {
      setError('Sunucu ile iletişim kurulamadı.');
    } finally {
      setStartingTrial(false);
    }
  };

  const copyHwid = () => {
    navigator.clipboard.writeText(hwid);
  };

  const getReasonText = (reason?: string) => {
    switch (reason) {
      case 'expired':
        return 'Lisans süreniz dolmuş.';
      case 'hwid_mismatch':
        return 'Bu lisans farklı bir bilgisayar için üretilmiş.';
      case 'clock_tamper':
        return 'Sistem saati geri alınmış. Lütfen doğru tarih/saati ayarlayın.';
      case 'no_license':
      default:
        return 'Henüz lisans aktive edilmemiş.';
    }
  };

  const isExpired = status?.reason === 'expired';

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-10 h-10 animate-spin text-gold-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-navy-400 text-sm">Lisans kontrol ediliyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-gold-500 to-gold-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-gold-200">
            <span className="text-white font-bold text-3xl">{isExpired ? '🔒' : '🔑'}</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-800">
            {isExpired ? 'Lisans Süresi Doldu' : 'Lisans Aktivasyonu'}
          </h1>
          <p className="text-navy-500 mt-2">
            {isExpired
              ? 'Lütfen bu bilgisayar için key yenileyin.'
              : 'Uygulamayı kullanmak için lisans anahtarı girin.'}
          </p>
        </div>

        {/* Durum mesajı */}
        {status && !status.valid && (
          <div className="mb-6 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
            {isExpired ? '🔒' : '⚠️'} {getReasonText(status.reason)}
          </div>
        )}

        {/* HWID Gösterimi */}
        <div className="bg-white rounded-2xl shadow-lg border border-cream-200 p-6 mb-6">
          <label className="block text-sm font-medium text-navy-600 mb-2">
            {isExpired ? 'PC Adresiniz' : 'Bilgisayar Kimliği (Hardware ID)'}
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-3 bg-navy-800 text-gold-400 rounded-xl font-mono text-lg tracking-widest text-center select-all">
              {hwid}
            </code>
            <button
              onClick={copyHwid}
              className="px-4 py-3 bg-cream-100 hover:bg-cream-200 text-navy-600 rounded-xl text-sm font-medium border border-cream-300"
              title="Kopyala"
            >
              📋
            </button>
          </div>
          <p className="text-xs text-navy-400 mt-2">
            {isExpired
              ? 'Bu PC adresini lisans satıcısına gönderin ve yeni key isteyin.'
              : 'Bu kodu lisans satıcısına gönderin. Size bu bilgisayara özel bir anahtar üretilecektir.'}
          </p>
        </div>

        {/* Lisans Key Girişi */}
        <div className="bg-white rounded-2xl shadow-lg border border-cream-200 p-6 mb-6">
          <form onSubmit={handleActivate}>
            <label className="block text-sm font-medium text-navy-600 mb-2">
              Lisans Anahtarı
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.replace(/\s+/g, ''))}
              placeholder="Lisans anahtarını yapıştırın..."
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-200 bg-cream-50 text-navy-800 font-mono tracking-wide placeholder:text-navy-300 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none text-center"
            />

            {error && (
              <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                ✕ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={activating || !licenseKey.trim()}
              className="w-full mt-4 py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-bold rounded-xl shadow-lg shadow-gold-200 disabled:opacity-50"
            >
              {activating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Kontrol ediliyor...
                </span>
              ) : (
                'Lisansı Aktive Et'
              )}
            </button>
          </form>
        </div>

        {/* Deneme Süresi – sadece henüz lisans yoksa göster */}
        {status?.reason === 'no_license' && (
          <div className="text-center">
            <div className="mb-3 text-sm text-navy-400">veya</div>
            <button
              onClick={handleStartTrial}
              disabled={startingTrial}
              className="px-6 py-3 border-2 border-gold-300 text-gold-700 font-medium rounded-xl hover:bg-gold-50 disabled:opacity-50"
            >
              {startingTrial ? 'Başlatılıyor...' : '7 Günlük Deneme Süresi Başlat'}
            </button>
            <p className="text-xs text-navy-400 mt-2">
              Deneme süresi boyunca tüm özellikler kullanılabilir.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-navy-400">
          Etkinlik Oturma Düzeni © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
