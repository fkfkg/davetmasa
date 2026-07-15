'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Event, Table, Guest } from '@/types/database';

type ElectronPrintApi = {
  savePrintPdf?: (options: { fileName: string }) => Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }>;
};

export default function PrintPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState<'tables' | 'guests'>('tables');
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [pdfMessage, setPdfMessage] = useState('');

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [eventRes, tablesRes, guestsRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).single(),
      supabase.from('tables').select('*').eq('event_id', eventId).order('name'),
      supabase.from('guests').select('*').eq('event_id', eventId).order('full_name'),
    ]);
    
    if (eventRes.data) {
      setEvent(eventRes.data);
      const orgRes = await supabase
        .from('organizations')
        .select('*')
        .eq('id', eventRes.data.organization_id)
        .single();
      setOrganizationName(orgRes.data?.name || '');
    }
    setTables(tablesRes.data || []);
    setGuests(guestsRes.data || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { loadData(); }, [loadData]);

  const sanitizeFileNamePart = (value: string) =>
    value
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const getPdfFileName = () => {
    const name = sanitizeFileNamePart(organizationName || event?.venue_name || event?.title || 'Oturma Duzeni');
    const date = event?.event_date
      ? new Date(event.event_date).toLocaleDateString('tr-TR').replace(/\./g, '-')
      : new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');

    return `${name} ${date}`;
  };

  const handleSavePdf = async () => {
    setPdfStatus('saving');
    setPdfMessage('PDF hazırlanıyor...');

    const electronAPI = window.electronAPI as ElectronPrintApi | undefined;

    if (electronAPI?.savePrintPdf) {
      const result = await electronAPI.savePrintPdf({ fileName: getPdfFileName() });

      if (result.success) {
        setPdfStatus('saved');
        setPdfMessage(`PDF Masaüstü'ne kaydedildi: ${result.filePath}`);
      } else {
        setPdfStatus('error');
        setPdfMessage(result.error || 'PDF kaydedilemedi.');
      }
      return;
    }

    window.print();
    setPdfStatus('idle');
    setPdfMessage('');
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

  if (!event) return <div>Etkinlik bulunamadı</div>;

  const getTableGuests = (tableId: string) => 
    guests.filter((g) => g.table_id === tableId);

  const getGuestTable = (tableId: string | null) => {
    if (!tableId) return 'Atanmadı';
    return tables.find((t) => t.id === tableId)?.name || 'Bilinmiyor';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Controls - Hidden in print */}
      <div className="flex items-center justify-between mb-8 no-print">
        <div>
          <Link href={`/events/${eventId}`} className="text-sm text-navy-400 hover:text-gold-600 mb-1 inline-block">
            ← Etkinlik
          </Link>
          <h1 className="text-2xl font-bold text-navy-800">Yazdır / PDF</h1>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={printMode} 
            onChange={(e) => setPrintMode(e.target.value as 'tables' | 'guests')}
            className="px-4 py-2 border border-cream-300 rounded-xl outline-none focus:border-gold-400"
          >
            <option value="tables">Masalara Göre Liste</option>
            <option value="guests">Alfabetik Misafir Listesi</option>
          </select>
          <button
            onClick={handleSavePdf}
            disabled={pdfStatus === 'saving'}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-medium rounded-xl shadow-md"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {pdfStatus === 'saving' ? 'PDF Kaydediliyor...' : 'PDF Olarak Kaydet'}
          </button>
        </div>
      </div>

      {pdfMessage && (
        <div className={`no-print mb-6 rounded-xl border px-4 py-3 text-sm ${
          pdfStatus === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-green-200 bg-green-50 text-green-700'
        }`}>
          {pdfMessage}
        </div>
      )}

      {/* Printable Area */}
      <div className="bg-white p-8 sm:p-12 border border-cream-200 rounded-2xl print:border-none print:p-0">
        
        {/* Header */}
        <div className="text-center mb-10 pb-6 border-b-2 border-cream-200 print:border-black">
          <h1 className="text-3xl font-bold text-navy-800 print:text-black mb-2">{event.title}</h1>
          <div className="text-navy-500 print:text-gray-600 flex items-center justify-center gap-4 text-sm">
            {event.event_date && (
              <span>Tarih: {new Date(event.event_date).toLocaleDateString('tr-TR')}{event.event_time ? ` saat ${event.event_time}` : ''}</span>
            )}
            {event.venue_name && (
              <span>Mekan: {event.venue_name}</span>
            )}
          </div>
          <p className="text-lg font-medium text-navy-700 print:text-black mt-4">
            {printMode === 'tables' ? 'Masa Oturma Düzeni' : 'Misafir Listesi'}
          </p>
        </div>

        {/* Content - Tables Mode */}
        {printMode === 'tables' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 print:block print:columns-2 print:gap-8">
            {tables.map((table) => {
              const tGuests = getTableGuests(table.id);
              if (tGuests.length === 0) return null;
              
              return (
                <div key={table.id} className="mb-6 print:break-inside-avoid">
                  <div className="bg-cream-100 print:bg-gray-200 px-4 py-2 rounded-t-lg print:rounded-none border-b border-cream-300 print:border-black">
                    <h3 className="font-bold text-navy-800 print:text-black flex justify-between">
                      <span>{table.name}</span>
                      <span className="font-normal text-sm">{tGuests.length} Kişi</span>
                    </h3>
                  </div>
                  <div className="border border-cream-200 print:border-black border-t-0 rounded-b-lg print:rounded-none p-4">
                    <ul className="space-y-1.5">
                      {tGuests.map((g) => (
                        <li key={g.id} className="text-sm text-navy-700 print:text-black flex justify-between">
                          <span>{g.full_name}</span>
                          {g.group_name && <span className="text-navy-400 print:text-gray-500 text-xs">{g.group_name}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Content - Guests Mode */}
        {printMode === 'guests' && (
          <div className="print:columns-2 print:gap-12">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-cream-200 print:border-black text-left">
                  <th className="py-2 font-bold text-navy-800 print:text-black">Ad Soyad</th>
                  <th className="py-2 font-bold text-navy-800 print:text-black">Grup/Taraf</th>
                  <th className="py-2 font-bold text-navy-800 print:text-black">Masa</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g) => (
                  <tr key={g.id} className="border-b border-cream-100 print:border-gray-300 break-inside-avoid">
                    <td className="py-2 text-navy-700 print:text-black font-medium">{g.full_name}</td>
                    <td className="py-2 text-navy-500 print:text-gray-600 text-xs">
                      {g.group_name || (g.side === 'groom' ? 'Damat T.' : g.side === 'bride' ? 'Gelin T.' : '-')}
                    </td>
                    <td className="py-2 text-navy-700 print:text-black font-bold">
                      {getGuestTable(g.table_id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-cream-200 print:border-black text-center text-xs text-navy-400 print:text-gray-500">
          <p>DavetMasa tarafından oluşturulmuştur. | davetmasa.com</p>
        </div>

      </div>
    </div>
  );
}
