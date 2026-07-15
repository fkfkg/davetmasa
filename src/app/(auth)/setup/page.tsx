'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PasswordSetupPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [masterCode, setMasterCode] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 4) {
      setError('Şifre en az 4 karakter olmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/auth-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup', password }),
      });
      const data = await res.json();

      if (data.success) {
        setMasterCode(data.masterCode);
        setStep('success');
      } else {
        setError(data.error || 'Şifre oluşturulamadı.');
      }
    } catch {
      setError('Sunucu ile iletişim kurulamadı.');
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    router.push('/dashboard');
    router.refresh();
  };

  const copyMasterCode = () => {
    navigator.clipboard.writeText(masterCode);
  };

  // ── Master Kod Gösterim Ekranı ─────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-800">Şifre Oluşturuldu!</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-cream-200 p-6 mb-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-bold text-red-800 mb-2">⚠️ ÖNEMLİ – Master Reset Kodu</h3>
            <p className="text-xs text-red-700 mb-3">
              Şifrenizi unutursanız bu kod ile sıfırlayabilirsiniz. 
              Bu kodu güvenli bir yere kaydedin! Bir daha gösterilmeyecektir.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 bg-navy-800 text-gold-400 rounded-xl font-mono text-lg tracking-widest text-center select-all">
                {masterCode}
              </code>
              <button
                onClick={copyMasterCode}
                className="px-3 py-3 bg-cream-100 hover:bg-cream-200 text-navy-600 rounded-xl text-sm border border-cream-300"
                title="Kopyala"
              >
                📋
              </button>
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="w-full py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-bold rounded-xl shadow-lg shadow-gold-200"
          >
            Devam Et →
          </button>
        </div>
      </div>
    );
  }

  // ── Şifre Oluşturma Formu ──────────────────────────────────────────
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-gold-200">
          <span className="text-white font-bold text-2xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold text-navy-800 mb-2">Şifre Oluşturun</h1>
        <p className="text-navy-500">
          Uygulamaya her giriş yaptığınızda bu şifre sorulacaktır.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-cream-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-600 mb-1">Yeni Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 4 karakter"
              className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 placeholder:text-navy-300 focus:border-gold-400 focus:bg-white focus:ring-2 focus:ring-gold-200 outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-600 mb-1">Şifre Tekrar</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Şifreyi tekrar girin"
              className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 placeholder:text-navy-300 focus:border-gold-400 focus:bg-white focus:ring-2 focus:ring-gold-200 outline-none"
            />
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              ✕ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !password || !confirmPassword}
            className="w-full py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-bold rounded-xl shadow-lg shadow-gold-200 disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Şifreyi Oluştur'}
          </button>
        </form>
      </div>
    </div>
  );
}
