'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { EventType, SalonTemplate } from '@/types/database';

const eventTypes: { value: EventType; label: string }[] = [
  { value: 'wedding', label: 'Dugun' },
  { value: 'engagement', label: 'Nisan' },
  { value: 'corporate', label: 'Kurumsal' },
  { value: 'graduation', label: 'Mezuniyet' },
  { value: 'birthday', label: 'Dogum Gunu' },
  { value: 'other', label: 'Diger' },
];

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState('');
  const [salonTemplates, setSalonTemplates] = useState<SalonTemplate[]>([]);
  const [startMode, setStartMode] = useState<'blank' | 'template'>('blank');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [guestCount, setGuestCount] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      if (data) setOrgId(data.organization_id);
    });

    supabase
      .from('salon_templates')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data }: { data: SalonTemplate[] }) => {
        const templates = data || [];
        setSalonTemplates(templates);
        if (templates.length > 0) setSelectedTemplateId(templates[0].id);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    setLoading(true);

    const supabase = createClient();
    const selectedTemplate = startMode === 'template'
      ? salonTemplates.find((template) => template.id === selectedTemplateId)
      : null;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ\s]/gi, '')
      .replace(/\s+/g, '-')
      .substring(0, 30) + '-' + Date.now().toString(36);

    const { data, error } = await supabase
      .from('events')
      .insert({
        organization_id: orgId,
        title: title.trim(),
        event_type: eventType,
        event_date: eventDate || null,
        event_time: eventTime || null,
        venue_name: venueName.trim() || null,
        venue_address: venueAddress.trim() || null,
        guest_count_estimate: parseInt(guestCount) || 0,
        status: 'draft',
        public_lookup_slug: slug,
        layout_width: selectedTemplate?.width || null,
        layout_height: selectedTemplate?.height || null,
        salon_template_name: selectedTemplate?.name || null,
      })
      .select()
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    if (selectedTemplate) {
      const copiedTables = (selectedTemplate.default_tables || []).map((table, index) => ({
        id: crypto.randomUUID(),
        event_id: data.id,
        name: table.name,
        type: table.type || table.shape || 'round',
        capacity: Number(table.capacity) || 10,
        width: Number(table.width) || 120,
        height: Number(table.height) || 120,
        x_position: Number(table.x) || 0,
        y_position: Number(table.y) || 0,
        rotation: Number(table.rotation) || 0,
        color: table.color || '#c9a24d',
        sort_order: Number(table.sort_order) || index,
      }));

      if (copiedTables.length > 0) {
        await supabase.from('tables').insert(copiedTables);
      }
    }

    router.push(`/events/${data.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-800">Yeni Etkinlik Olustur</h1>
        <p className="text-navy-500 mt-1">Etkinlik bilgilerini girin</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-cream-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-navy-600 mb-1.5">
              Etkinlik Adi *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="or: Ali & Ayse Dugunu"
              required
              className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 placeholder:text-navy-300 focus:border-gold-400 focus:bg-white focus:ring-2 focus:ring-gold-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-600 mb-1.5">
              Etkinlik Turu
            </label>
            <div className="grid grid-cols-3 gap-2">
              {eventTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setEventType(type.value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border ${
                    eventType === type.value
                      ? 'bg-gold-50 border-gold-400 text-gold-700'
                      : 'bg-cream-50 border-cream-300 text-navy-600 hover:border-gold-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-600 mb-1.5">
              Salon Yerlesimi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStartMode('blank')}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium border ${
                  startMode === 'blank'
                    ? 'bg-gold-50 border-gold-400 text-gold-700'
                    : 'bg-cream-50 border-cream-300 text-navy-600 hover:border-gold-300'
                }`}
              >
                Sifirdan Basla
              </button>
              <button
                type="button"
                onClick={() => setStartMode('template')}
                disabled={salonTemplates.length === 0}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium border disabled:opacity-50 ${
                  startMode === 'template'
                    ? 'bg-gold-50 border-gold-400 text-gold-700'
                    : 'bg-cream-50 border-cream-300 text-navy-600 hover:border-gold-300'
                }`}
              >
                Salon Sablonundan
              </button>
            </div>
            {startMode === 'template' && (
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="mt-3 w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 focus:border-gold-400 focus:bg-white focus:ring-2 focus:ring-gold-200 outline-none"
              >
                {salonTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {(template.default_tables || []).length} masa - {template.width}x{template.height}
                  </option>
                ))}
              </select>
            )}
            {salonTemplates.length === 0 && (
              <p className="text-xs text-navy-400 mt-2">
                Henuz salon sablonu yok. Salon editorunden mevcut duzeni sablon olarak kaydedebilirsiniz.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-600 mb-1.5">
                Tarih
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 focus:border-gold-400 focus:bg-white focus:ring-2 focus:ring-gold-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-600 mb-1.5">
                Saat
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 focus:border-gold-400 focus:bg-white focus:ring-2 focus:ring-gold-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-600 mb-1.5">
                Tahmini Misafir Sayisi
              </label>
              <input
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                placeholder="or: 450"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 placeholder:text-navy-300 focus:border-gold-400 focus:bg-white focus:ring-2 focus:ring-gold-200 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-600 mb-1.5">
              Mekan Adi
            </label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="or: Manisa Gold Dugun Salonu"
              className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 placeholder:text-navy-300 focus:border-gold-400 focus:bg-white focus:ring-2 focus:ring-gold-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-600 mb-1.5">
              Mekan Adresi
            </label>
            <input
              type="text"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="or: Manisa Merkez"
              className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 placeholder:text-navy-300 focus:border-gold-400 focus:bg-white focus:ring-2 focus:ring-gold-200 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-cream-300 text-navy-600 font-medium rounded-xl hover:bg-cream-100"
            >
              Iptal
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold rounded-xl shadow-lg shadow-gold-200 disabled:opacity-50"
            >
              {loading ? 'Olusturuluyor...' : 'Etkinlik Olustur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
