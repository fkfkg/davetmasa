'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Event, Organization } from '@/types/database';

export default function DashboardPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [totalActualGuests, setTotalActualGuests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);

  async function loadData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Kullanıcının organizasyonunu bul
      const { data: members } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1);

      if (members && members.length > 0) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', members[0].organization_id)
          .single();

        if (orgData) {
          setOrg(orgData);

          // Etkinlikleri yükle
          const { data: eventsData } = await supabase
            .from('events')
            .select('*')
            .eq('organization_id', orgData.id)
            .order('created_at', { ascending: false });

          const loadedEvents = eventsData || [];
          setEvents(loadedEvents);

          // Misafir sayısını çek
          if (loadedEvents.length > 0) {
            const { data: guestsData } = await supabase
              .from('guests')
              .select('id')
              .in('event_id', loadedEvents.map((e: Event) => e.id));
            setTotalActualGuests(guestsData?.length || 0);
          } else {
            setTotalActualGuests(0);
          }
        }
      } else {
        setShowOrgForm(true);
      }
    } catch (error) {
      console.error('Yerel veri yüklenemedi:', error);
      setShowOrgForm(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, []);

  const createOrganization = async () => {
    if (!orgName.trim()) return;
    setCreatingOrg(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Organizasyon oluştur
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({ owner_id: user.id, name: orgName.trim() })
      .select()
      .single();

    if (orgError || !newOrg) {
      alert("Yerel kayıt oluşturulamadı. Lütfen tekrar deneyin.");
      setCreatingOrg(false);
      return;
    }

    // Üyelik oluştur (owner)
    await supabase
      .from('organization_members')
      .insert({ organization_id: newOrg.id, user_id: user.id, role: 'owner' });

    setOrg(newOrg);
    setShowOrgForm(false);
    setCreatingOrg(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-gold-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-navy-400 text-sm">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // Organizasyon oluşturma formu
  if (showOrgForm) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏢</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-800">Organizasyonunuzu Oluşturun</h1>
          <p className="text-navy-500 mt-2">Salon veya firma adınızı girin</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-cream-200 p-8">
          <label className="block text-sm font-medium text-navy-600 mb-1.5">
            Organizasyon Adı
          </label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="ör: Manisa Gold Düğün Salonu"
            className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 placeholder:text-navy-300 focus:border-gold-400 focus:bg-white focus:ring-2 focus:ring-gold-200 outline-none mb-4"
            onKeyDown={(e) => e.key === 'Enter' && createOrganization()}
          />
          <button
            onClick={createOrganization}
            disabled={creatingOrg || !orgName.trim()}
            className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold rounded-xl shadow-lg shadow-gold-200 disabled:opacity-50"
          >
            {creatingOrg ? 'Oluşturuluyor...' : 'Oluştur ve Başla'}
          </button>
        </div>
      </div>
    );
  }

  const activeEvents = events.filter((e) => e.status === 'active' || e.status === 'draft');
  const totalEstimatedGuests = activeEvents.reduce((sum, e) => sum + (e.guest_count_estimate || 0), 0);

  // En yakın yaklaşan veya aktif etkinliği bul
  const nowTime = new Date().setHours(0, 0, 0, 0);
  const upcomingEvents = activeEvents
    .filter((e) => e.event_date)
    .map((e) => ({
      ...e,
      dateObj: new Date(e.event_date!),
    }))
    .sort((a, b) => {
      const aDiff = a.dateObj.getTime() - nowTime;
      const bDiff = b.dateObj.getTime() - nowTime;

      // İkisi de gelecekteyse en yakın olan önce gelir
      if (aDiff >= 0 && bDiff >= 0) return aDiff - bDiff;
      // Biri gelecekte biri geçmişteyse, gelecekteki önce gelir
      if (aDiff >= 0 && bDiff < 0) return -1;
      if (aDiff < 0 && bDiff >= 0) return 1;
      // İkisi de geçmişteyse en yakın geçmişteki önce gelir
      return bDiff - aDiff;
    });

  const nearestEvent = upcomingEvents[0] || null;

  const stats = [
    { label: 'Toplam Etkinlik', value: events.length.toString(), icon: '🎉', desc: 'Tüm zamanlar' },
    { label: 'Aktif Etkinlik', value: activeEvents.length.toString(), icon: '📋', desc: 'Planlanan etkinlikler' },
    { 
      label: 'Toplam Davetli', 
      value: totalEstimatedGuests.toLocaleString('tr-TR'), 
      icon: '👥', 
      desc: totalActualGuests > 0 ? `${totalActualGuests} kayıtlı davetli` : 'Tahmini toplam katılım'
    },
    { 
      label: 'En Yakın İş', 
      value: nearestEvent && nearestEvent.event_date
        ? `${new Date(nearestEvent.event_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}${nearestEvent.event_time ? ` - ${nearestEvent.event_time}` : ''}`
        : '-', 
      icon: '⏳', 
      desc: nearestEvent 
        ? `${nearestEvent.title}`
        : 'Etkinlik bulunmuyor'
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-800">Hoş geldiniz 👋</h1>
        <p className="text-navy-500 mt-1">{org?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-cream-200 p-6 hover:shadow-lg hover:shadow-cream-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold text-navy-800">{stat.value}</div>
            <div className="text-sm text-navy-500 mt-1">{stat.label}</div>
            <div className="text-xs text-navy-400 mt-1.5">{stat.desc}</div>
          </div>
        ))}
      </div>

      {/* Events */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-navy-700">Etkinlikler</h2>
        <Link
          href="/events/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white text-sm font-medium rounded-xl shadow-md shadow-gold-200 hover:from-gold-600 hover:to-gold-700"
        >
          + Yeni Etkinlik
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center">
          <div className="text-5xl mb-4">🎊</div>
          <h3 className="text-lg font-semibold text-navy-700 mb-2">Henüz etkinlik yok</h3>
          <p className="text-navy-500 mb-6">İlk etkinliğinizi oluşturarak başlayın</p>
          <Link
            href="/events/new"
            className="inline-block px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-medium rounded-xl shadow-lg shadow-gold-200"
          >
            İlk Etkinliği Oluştur
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="bg-white rounded-2xl border border-cream-200 p-6 hover:shadow-lg hover:shadow-cream-200 hover:-translate-y-0.5 hover:border-gold-300 group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  event.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : event.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-700'
                    : event.status === 'completed'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {event.status === 'active' ? 'Aktif' : event.status === 'draft' ? 'Taslak' : event.status === 'completed' ? 'Tamamlandı' : 'Arşiv'}
                </span>
                <span className="text-sm text-navy-400">
                  {event.event_type === 'wedding' ? '💒' : event.event_type === 'corporate' ? '🏢' : '🎉'}
                </span>
              </div>
              <h3 className="font-semibold text-navy-800 group-hover:text-gold-700 mb-1">
                {event.title}
              </h3>
              {event.venue_name && (
                <p className="text-sm text-navy-500 mb-2">📍 {event.venue_name}</p>
              )}
              {event.event_date && (
                <p className="text-sm text-navy-400">
                  📅 {new Date(event.event_date).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {event.event_time ? ` saat ${event.event_time}` : ''}
                </p>
              )}
              {event.guest_count_estimate > 0 && (
                <p className="text-sm text-navy-400 mt-1">
                  👥 ~{event.guest_count_estimate} misafir
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
