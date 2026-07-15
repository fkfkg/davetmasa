'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { createClient } from '@/lib/supabase/client';
import type { Event } from '@/types/database';

export default function QRCodePage() {
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualIp, setManualIp] = useState('');
  const [networkInfo, setNetworkInfo] = useState<{ localIp: string | null; port: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()
      .then(({ data }: { data: Event | null }) => {
        if (data) setEvent(data);
        setLoading(false);
      });

    supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single()
      .then(({ data }: { data: any }) => {
        setManualIp(String(data?.manual_network_ip || '').trim());
      });

    fetch('/api/network')
      .then((res) => res.json())
      .then((data) => setNetworkInfo(data))
      .catch(() => setNetworkInfo({ localIp: null, port: '3000' }));
  }, [eventId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="w-8 h-8 animate-spin text-gold-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!event || !event.public_lookup_slug) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-navy-800">Geçersiz Etkinlik</h2>
        <p className="text-navy-500 mt-2">Bu etkinlik için QR kod oluşturulamıyor.</p>
        <Link href={`/events/${eventId}`} className="text-gold-600 mt-4 inline-block">← Etkinliğe Dön</Link>
      </div>
    );
  }

  // Tarayıcı ortamında tam URL oluştur
  const normalizeManualIp = (value: string) =>
    value
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '');

  let baseUrl = 'https://davetmasa.com';
  if (typeof window !== 'undefined') {
    const manualHost = normalizeManualIp(manualIp);
    const browserHost = window.location.hostname;
    const browserHostIsLocal =
      browserHost === 'localhost' || browserHost === '127.0.0.1' || browserHost === '::1';
    const host = manualHost || networkInfo?.localIp || (!browserHostIsLocal ? browserHost : '');
    const port = networkInfo?.port || window.location.port || '3000';

    baseUrl = host
      ? `http://${host.includes(':') ? host : `${host}:${port}`}`
      : window.location.origin;
  }
  const publicUrl = `${baseUrl}/public/${event.public_lookup_slug}`;
  const needsManualIp = !manualIp && !networkInfo?.localIp;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Controls - Hidden in print */}
      <div className="flex items-center justify-between mb-8 no-print">
        <div>
          <Link href={`/events/${eventId}`} className="text-sm text-navy-400 hover:text-gold-600 mb-1 inline-block">
            ← Etkinlik
          </Link>
          <h1 className="text-2xl font-bold text-navy-800">Misafir Karşılama QR Kodu</h1>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-medium rounded-xl shadow-md"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          QR Kodu Yazdır
        </button>
      </div>

      {/* QR Code Card */}
      <div className="bg-white p-12 rounded-3xl shadow-xl border border-cream-200 text-center print:shadow-none print:border-none print:p-0">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-navy-800 mb-2">{event.title}</h2>
          <p className="text-lg text-navy-500">Hoş Geldiniz</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border-4 border-gold-500 inline-block mb-8">
          <QRCode
            value={publicUrl}
            size={256}
            level="H"
            fgColor="#1e3a5f" // navy-800
            bgColor="#ffffff"
          />
        </div>

        <div className="space-y-4">
          <p className="text-navy-600 font-medium max-w-sm mx-auto">
            Masanızı öğrenmek için telefonunuzun kamerasıyla yukarıdaki QR kodu okutun.
          </p>
          
          <div className="text-sm text-navy-400 no-print">
            <p>veya şu bağlantıya gidin:</p>
            <a 
              href={publicUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gold-600 hover:text-gold-700 hover:underline mt-1 inline-block break-all"
            >
              {publicUrl}
            </a>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-cream-200 print:border-black text-xs text-navy-400 font-medium tracking-widest uppercase">
          DavetMasa
        </div>
      </div>

      <div className="no-print mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
        Windows Güvenlik Duvarı izin isterse <strong>İzin ver</strong> seçin. Telefonlar ve diğer bilgisayarlar aynı Wi-Fi / yerel ağda olmalı.
        {needsManualIp && (
          <div className="mt-1">
            Yerel ağ IP adresi otomatik bulunamadı. <Link href="/settings" className="font-semibold underline">Ayarlar</Link> ekranından manuel IP girin.
          </div>
        )}
      </div>
    </div>
  );
}
