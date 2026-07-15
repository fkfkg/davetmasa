'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Event } from '@/types/database';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    setEvents(data || []);
    setLoading(false);
  };

  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.venue_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-800">Etkinlikler</h1>
        <Link
          href="/events/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 text-white text-sm font-medium rounded-xl shadow-md shadow-gold-200 hover:from-gold-600 hover:to-gold-700"
        >
          + Yeni Etkinlik
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Etkinlik ara..."
          className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-cream-300 bg-white text-navy-700 placeholder:text-navy-300 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="w-8 h-8 animate-spin text-gold-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center">
          <div className="text-5xl mb-4">🎊</div>
          <h3 className="text-lg font-semibold text-navy-700 mb-2">
            {search ? 'Sonuç bulunamadı' : 'Henüz etkinlik yok'}
          </h3>
          <p className="text-navy-500 mb-6">
            {search ? 'Farklı bir arama deneyin' : 'İlk etkinliğinizi oluşturun'}
          </p>
          {!search && (
            <Link
              href="/events/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-medium rounded-xl"
            >
              İlk Etkinliği Oluştur
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="bg-white rounded-2xl border border-cream-200 p-6 hover:shadow-lg hover:shadow-cream-200 hover:-translate-y-0.5 hover:border-gold-300 group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  event.status === 'active' ? 'bg-green-100 text-green-700' :
                  event.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {event.status === 'active' ? 'Aktif' : event.status === 'draft' ? 'Taslak' : event.status === 'completed' ? 'Tamamlandı' : 'Arşiv'}
                </span>
              </div>
              <h3 className="font-semibold text-navy-800 group-hover:text-gold-700 mb-1">{event.title}</h3>
              {event.venue_name && <p className="text-sm text-navy-500">📍 {event.venue_name}</p>}
              {event.event_date && (
                <p className="text-sm text-navy-400 mt-1">
                  📅 {new Date(event.event_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {event.event_time ? ` saat ${event.event_time}` : ''}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
