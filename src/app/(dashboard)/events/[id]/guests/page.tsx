'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Papa from 'papaparse';
import { createClient } from '@/lib/supabase/client';
import type { Guest, Table, GuestSide } from '@/types/database';

const sideLabels: Record<GuestSide, string> = {
  groom: 'Damat Tarafı',
  bride: 'Gelin Tarafı',
  common: 'Ortak',
  other: 'Diğer',
};

export default function GuestsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSide, setFilterSide] = useState<string>('all');
  const [filterSeated, setFilterSeated] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSide, setNewSide] = useState<GuestSide>('other');
  const [newGroup, setNewGroup] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newVip, setNewVip] = useState(false);
  const [newChild, setNewChild] = useState(false);
  const [newElderly, setNewElderly] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [guestsRes, tablesRes] = await Promise.all([
      supabase.from('guests').select('*').eq('event_id', eventId).order('created_at'),
      supabase.from('tables').select('*').eq('event_id', eventId).order('sort_order'),
    ]);
    setGuests(guestsRes.data || []);
    setTables(tablesRes.data || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { loadData(); }, [loadData]);

  const addGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('guests')
      .insert({
        event_id: eventId,
        full_name: newName.trim(),
        phone: newPhone.trim() || null,
        side: newSide,
        group_name: newGroup.trim() || null,
        notes: newNotes.trim() || null,
        is_vip: newVip,
        is_child: newChild,
        is_elderly: newElderly,
      })
      .select()
      .single();

    if (!error && data) {
      setGuests([...guests, data]);
      setNewName(''); setNewPhone(''); setNewSide('other');
      setNewGroup(''); setNewNotes('');
      setNewVip(false); setNewChild(false); setNewElderly(false);
      setShowAddForm(false);
    }
    setSaving(false);
  };

  const deleteGuest = async (id: string) => {
    if (!confirm('Bu misafiri silmek istediğinize emin misiniz?')) return;
    const supabase = createClient();
    await supabase.from('guests').delete().eq('id', id);
    setGuests(guests.filter((g) => g.id !== id));
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const supabase = createClient();
        const rows = results.data as Record<string, string>[];

        const guestsToInsert = rows
          .filter((row) => row['Ad Soyad'] || row['full_name'] || row['İsim'] || row['ad_soyad'])
          .map((row) => ({
            event_id: eventId,
            full_name: row['Ad Soyad'] || row['full_name'] || row['İsim'] || row['ad_soyad'] || '',
            phone: row['Telefon'] || row['phone'] || row['tel'] || null,
            side: (row['Taraf'] === 'Damat' ? 'groom' : row['Taraf'] === 'Gelin' ? 'bride' : row['Taraf'] === 'Ortak' ? 'common' : 'other') as GuestSide,
            group_name: row['Grup'] || row['group_name'] || null,
            notes: row['Not'] || row['notes'] || null,
            is_vip: row['VIP'] === 'Evet' || row['is_vip'] === 'true',
            is_child: row['Çocuk'] === 'Evet' || row['is_child'] === 'true',
            is_elderly: row['Yaşlı'] === 'Evet' || row['is_elderly'] === 'true',
          }));

        if (guestsToInsert.length > 0) {
          const { data } = await supabase.from('guests').insert(guestsToInsert).select();
          if (data) setGuests([...guests, ...data]);
        }

        setShowCsvModal(false);
        e.target.value = '';
      },
    });
  };

  const handleCsvExport = () => {
    const rows = guests.map((guest) => ({
      'Ad Soyad': guest.full_name,
      Telefon: guest.phone || '',
      Taraf: sideLabels[guest.side],
      Grup: guest.group_name || '',
      Masa: getTableName(guest.table_id) || '',
      Not: guest.notes || '',
      VIP: guest.is_vip ? 'Evet' : 'Hayir',
      Cocuk: guest.is_child ? 'Evet' : 'Hayir',
      Yasli: guest.is_elderly ? 'Evet' : 'Hayir',
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `misafir-listesi-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getTableName = (tableId: string | null) => {
    if (!tableId) return null;
    const table = tables.find((t) => t.id === tableId);
    return table?.name || null;
  };

  const filtered = guests.filter((g) => {
    if (search && !g.full_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSide !== 'all' && g.side !== filterSide) return false;
    if (filterSeated === 'seated' && !g.table_id) return false;
    if (filterSeated === 'unseated' && g.table_id) return false;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link href={`/events/${eventId}`} className="text-sm text-navy-400 hover:text-gold-600 mb-1 inline-block">
            ← Etkinlik
          </Link>
          <h1 className="text-2xl font-bold text-navy-800">Misafir Listesi</h1>
          <p className="text-sm text-navy-500 mt-1">{guests.length} misafir</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCsvExport}
            disabled={guests.length === 0}
            className="px-4 py-2.5 border border-cream-300 text-navy-600 text-sm font-medium rounded-xl hover:bg-cream-100 disabled:opacity-50"
          >
            CSV İndir
          </button>
          <button
            onClick={() => setShowCsvModal(true)}
            className="px-4 py-2.5 border border-cream-300 text-navy-600 text-sm font-medium rounded-xl hover:bg-cream-100"
          >
            📄 CSV Yükle
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 text-white text-sm font-medium rounded-xl shadow-md shadow-gold-200 hover:from-gold-600 hover:to-gold-700"
          >
            + Misafir Ekle
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="İsim ara..."
          className="px-4 py-2.5 rounded-xl border border-cream-300 bg-white text-navy-700 placeholder:text-navy-300 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none w-64"
        />
        <select
          value={filterSide}
          onChange={(e) => setFilterSide(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-cream-300 bg-white text-navy-700 focus:border-gold-400 outline-none"
        >
          <option value="all">Tüm Taraflar</option>
          <option value="groom">Damat Tarafı</option>
          <option value="bride">Gelin Tarafı</option>
          <option value="common">Ortak</option>
          <option value="other">Diğer</option>
        </select>
        <select
          value={filterSeated}
          onChange={(e) => setFilterSeated(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-cream-300 bg-white text-navy-700 focus:border-gold-400 outline-none"
        >
          <option value="all">Tümü</option>
          <option value="seated">Masası Var</option>
          <option value="unseated">Masası Yok</option>
        </select>
      </div>

      {/* Guest Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="w-8 h-8 animate-spin text-gold-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-navy-700 mb-2">
            {search || filterSide !== 'all' || filterSeated !== 'all' ? 'Sonuç bulunamadı' : 'Henüz misafir yok'}
          </h3>
          <p className="text-navy-500">
            {search || filterSide !== 'all' || filterSeated !== 'all' ? 'Filtreleri temizleyin' : 'Misafir ekleyerek başlayın'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase">Ad Soyad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase hidden sm:table-cell">Taraf</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase hidden md:table-cell">Grup</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase">Masa</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase hidden lg:table-cell">Durum</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-navy-500 uppercase">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {filtered.map((guest) => (
                  <tr key={guest.id} className="hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-navy-700">{guest.full_name}</span>
                        {guest.is_vip && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">VIP</span>}
                        {guest.is_child && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Çocuk</span>}
                        {guest.is_elderly && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Yaşlı</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-navy-500 hidden sm:table-cell">{sideLabels[guest.side]}</td>
                    <td className="px-4 py-3 text-sm text-navy-500 hidden md:table-cell">{guest.group_name || '-'}</td>
                    <td className="px-4 py-3">
                      {guest.table_id ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">
                          ✓ {getTableName(guest.table_id)}
                        </span>
                      ) : (
                        <span className="text-xs text-navy-400">Atanmadı</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs px-2 py-1 rounded ${
                        guest.check_in_status === 'checked_in' ? 'bg-green-100 text-green-700' :
                        guest.check_in_status === 'no_show' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {guest.check_in_status === 'checked_in' ? 'Geldi' : guest.check_in_status === 'no_show' ? 'Gelmedi' : 'Bekleniyor'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteGuest(guest.id)}
                        className="text-navy-400 hover:text-red-600 text-sm"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Guest Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-navy-800 mb-4">Misafir Ekle</h2>
            <form onSubmit={addGuest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-600 mb-1">Ad Soyad *</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Ahmet Yılmaz"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 placeholder:text-navy-300 focus:border-gold-400 focus:bg-white outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-navy-600 mb-1">Telefon</label>
                  <input type="text" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="05xx xxx xx xx"
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 placeholder:text-navy-300 focus:border-gold-400 focus:bg-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-600 mb-1">Taraf</label>
                  <select value={newSide} onChange={(e) => setNewSide(e.target.value as GuestSide)}
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 focus:border-gold-400 outline-none">
                    <option value="groom">Damat Tarafı</option>
                    <option value="bride">Gelin Tarafı</option>
                    <option value="common">Ortak</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-600 mb-1">Grup</label>
                <input type="text" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="ör: Aile, Arkadaş, İş"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 placeholder:text-navy-300 focus:border-gold-400 focus:bg-white outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-600 mb-1">Not</label>
                <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} rows={2} placeholder="Opsiyonel not..."
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 placeholder:text-navy-300 focus:border-gold-400 focus:bg-white outline-none resize-none" />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newVip} onChange={(e) => setNewVip(e.target.checked)} className="w-4 h-4 rounded accent-gold-500" />
                  <span className="text-sm text-navy-600">VIP</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newChild} onChange={(e) => setNewChild(e.target.checked)} className="w-4 h-4 rounded accent-gold-500" />
                  <span className="text-sm text-navy-600">Çocuk</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newElderly} onChange={(e) => setNewElderly(e.target.checked)} className="w-4 h-4 rounded accent-gold-500" />
                  <span className="text-sm text-navy-600">Yaşlı</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 border border-cream-300 text-navy-600 rounded-xl hover:bg-cream-100">İptal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-medium rounded-xl disabled:opacity-50">
                  {saving ? 'Kaydediliyor...' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCsvModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-navy-800 mb-2">CSV Dosyası Yükle</h2>
            <p className="text-sm text-navy-500 mb-4">
              CSV dosyanızda şu sütunlar olmalı: <strong>Ad Soyad</strong>, Telefon, Taraf (Damat/Gelin/Ortak), Grup, Not, VIP (Evet/Hayır), Çocuk (Evet/Hayır)
            </p>
            <div className="border-2 border-dashed border-cream-300 rounded-xl p-8 text-center hover:border-gold-400">
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvImport}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="text-4xl mb-3">📄</div>
                <p className="text-navy-600 font-medium">CSV dosyası seçin</p>
                <p className="text-sm text-navy-400 mt-1">veya sürükle-bırak yapın</p>
              </label>
            </div>
            <button onClick={() => setShowCsvModal(false)} className="w-full mt-4 py-2.5 border border-cream-300 text-navy-600 rounded-xl hover:bg-cream-100">
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
