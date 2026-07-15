'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Event, EventStats } from '@/types/database';

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    const supabase = createClient();

    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventData) {
      setEvent(eventData);

      // İstatistikleri yükle
      const { data: statsData } = await supabase.rpc('get_event_stats', { evt_id: eventId });
      if (statsData) setStats(statsData);
    }
    setLoading(false);
  };

  const updateStatus = async (status: string) => {
    const supabase = createClient();
    await supabase.from('events').update({ status }).eq('id', eventId);
    if (event) setEvent({ ...event, status: status as Event['status'] });
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

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-navy-800">Etkinlik bulunamadı</h2>
        <Link href="/events" className="text-gold-600 mt-2 inline-block">← Etkinliklere Dön</Link>
      </div>
    );
  }

  const quickActions = [
    { href: `/events/${eventId}/guests`, label: 'Misafirler', icon: '👥', desc: 'Misafir listesini yönetin' },
    { href: `/events/${eventId}/layout-editor`, label: 'Salon Planı', icon: '🪑', desc: 'Masaları düzenleyin' },
    { href: `/events/${eventId}/print`, label: 'PDF Çıktı', icon: '🖨️', desc: 'Yazdırma önizleme' },
    { href: `/events/${eventId}/qr`, label: 'QR Kod', icon: '📱', desc: 'Misafir sorgulama QR' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/events" className="text-sm text-navy-400 hover:text-gold-600 mb-2 inline-block">
            ← Etkinlikler
          </Link>
          <h1 className="text-2xl font-bold text-navy-800">{event.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            {event.venue_name && <span className="text-sm text-navy-500">📍 {event.venue_name}</span>}
            {event.event_date && (
              <span className="text-sm text-navy-500">
                📅 {new Date(event.event_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {event.event_time ? ` saat ${event.event_time}` : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {event.status === 'draft' && (
            <button
              onClick={() => updateStatus('active')}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl"
            >
              Aktif Yap
            </button>
          )}
          {event.status === 'active' && (
            <button
              onClick={() => updateStatus('completed')}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl"
            >
              Tamamla
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Toplam Misafir', value: stats?.total_guests || 0, icon: '👥' },
          { label: 'Oturan', value: stats?.seated_guests || 0, icon: '✅' },
          { label: 'Oturmayan', value: stats?.unseated_guests || 0, icon: '⏳' },
          { label: 'Masa Sayısı', value: stats?.total_tables || 0, icon: '🪑' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-cream-200 p-5">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-navy-800">{stat.value}</div>
            <div className="text-sm text-navy-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-navy-700 mb-4">Hızlı Erişim</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="bg-white rounded-2xl border border-cream-200 p-6 hover:shadow-lg hover:shadow-cream-200 hover:-translate-y-0.5 hover:border-gold-300 text-center group"
          >
            <div className="text-3xl mb-3">{action.icon}</div>
            <h3 className="font-semibold text-navy-700 group-hover:text-gold-700 mb-1">{action.label}</h3>
            <p className="text-sm text-navy-500">{action.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
