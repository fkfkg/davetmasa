'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);

  // Şifremi unuttum modu
  const [showReset, setShowReset] = useState(false);
  const [masterCode, setMasterCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetResult, setResetResult] = useState<{
    success: boolean;
    newMasterCode?: string;
    error?: string;
  } | null>(null);

  // Lisans bilgisi
  const [licenseInfo, setLicenseInfo] = useState<{
    type?: string;
    daysLeft?: number;
  } | null>(null);

  useEffect(() => {
    checkPasswordSetup();
  }, []);

  const checkPasswordSetup = async () => {
    try {
      // Şifre oluşturulmuş mu kontrol et
      const authRes = await fetch('/api/auth-local');
      const authData = await authRes.json();

      if (!authData.passwordSet) {
        // Şifre henüz oluşturulmamış → kurulum sayfasına yönlendir
        router.push('/setup');
        return;
      }

      // Lisans bilgisini çek (kalan gün gösterimi için)
      const licRes = await fetch('/api/license?action=status');
      const licData = await licRes.json();
      if (licData.valid) {
        setLicenseInfo({ type: licData.type, daysLeft: licData.daysLeft });
      }
    } catch {
      // API erişilemezse giriş formunu göster
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLogging(true);
    setError('');

    try {
      const res = await fetch('/api/auth-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Giriş başarısız.');
      }
    } catch {
      setError('Sunucu ile iletişim kurulamadı.');
    } finally {
      setLogging(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetResult(null);

    try {
      const res = await fetch('/api/auth-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          masterCode: masterCode.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      setResetResult(data);

      if (data.success) {
        // Başarılı sıfırlama sonrası formu temizle
        setMasterCode('');
        setNewPassword('');
      }
    } catch {
      setResetResult({ success: false, error: 'Sunucu hatası.' });
    }
  };

  const getLicenseLabel = () => {
    if (!licenseInfo) return null;
    if (licenseInfo.type === 'lifetime') return '♾️ Sınırsız Lisans';
    if (licenseInfo.type === 'trial') return `⏳ Deneme: ${licenseInfo.daysLeft} gün kaldı`;
    return `📅 Lisans: ${licenseInfo.daysLeft} gün kaldı`;
  };

  if (loading) {
    return (
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-gold-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-navy-400 text-sm">Kontrol ediliyor...</span>
        </div>
      </div>
    );
  }

  // ── Şifre Sıfırlama Ekranı ────────────────────────────────────────
  if (showReset) {
    return (
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-gold-200">
            <span className="text-white font-bold text-2xl">🔓</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-800 mb-2">Şifre Sıfırlama</h1>
          <p className="text-navy-500">
            İlk kurulumda aldığınız master reset kodunu girin.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-cream-200 p-6">
          {resetResult?.success ? (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-green-700 font-medium mb-3">✓ Şifre başarıyla sıfırlandı!</p>
                <p className="text-xs text-green-600 mb-2">Yeni Master Kodunuz:</p>
                <code className="block px-4 py-2 bg-navy-800 text-gold-400 rounded-lg font-mono text-lg tracking-widest text-center select-all">
                  {resetResult.newMasterCode}
                </code>
                <p className="text-xs text-red-600 mt-2 font-bold">Bu kodu güvenli bir yere kaydedin!</p>
              </div>
              <button
                onClick={() => { setShowReset(false); setResetResult(null); }}
                className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-bold rounded-xl shadow-lg shadow-gold-200"
              >
                Giriş Ekranına Dön
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-600 mb-1">Master Reset Kodu</label>
                <input
                  type="text"
                  value={masterCode}
                  onChange={(e) => setMasterCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 font-mono tracking-widest placeholder:text-navy-300 focus:border-gold-400 focus:bg-white outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-600 mb-1">Yeni Şifre</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="En az 4 karakter"
                  className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 placeholder:text-navy-300 focus:border-gold-400 focus:bg-white outline-none"
                />
              </div>

              {resetResult?.error && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  ✕ {resetResult.error}
                </div>
              )}

              <button
                type="submit"
                disabled={!masterCode || !newPassword}
                className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-bold rounded-xl shadow-lg shadow-gold-200 disabled:opacity-50"
              >
                Şifreyi Sıfırla
              </button>
              <button
                type="button"
                onClick={() => { setShowReset(false); setResetResult(null); }}
                className="w-full py-2.5 text-sm text-navy-500 hover:text-gold-600"
              >
                ← Giriş Ekranına Dön
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ── Giriş Formu ───────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-gold-200">
          <span className="text-white font-bold text-2xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold text-navy-800 mb-2">Giriş Yapın</h1>
        <p className="text-navy-500">Şifrenizi girerek devam edin.</p>

        {/* Lisans durumu */}
        {licenseInfo && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-gold-50 border border-gold-200 rounded-full text-xs font-medium text-gold-700">
            {getLicenseLabel()}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-cream-200 p-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-600 mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 placeholder:text-navy-300 focus:border-gold-400 focus:bg-white focus:ring-2 focus:ring-gold-200 outline-none"
              autoFocus
            />
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              ✕ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={logging || !password}
            className="w-full py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-bold rounded-xl shadow-lg shadow-gold-200 disabled:opacity-50"
          >
            {logging ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Giriş yapılıyor...
              </span>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setShowReset(true)}
            className="text-sm text-navy-400 hover:text-gold-600"
          >
            Şifremi Unuttum
          </button>
        </div>
      </div>
    </div>
  );
}
