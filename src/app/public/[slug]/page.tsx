'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Event } from '@/types/database';

type SearchResult = {
  guest_name: string;
  table_name: string;
  seat_number: number | null;
};

export default function PublicLookupPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Load basic event details to show the header
    const supabase = createClient();
    supabase
      .from('events')
      .select('*')
      .eq('public_lookup_slug', slug)
      .single()
      .then(({ data }: { data: Event | null }) => {
        if (data) setEvent(data);
        setLoadingEvent(false);
      });
  }, [slug]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.length < 3) return;
    
    setSearching(true);
    setHasSearched(true);
    
    const supabase = createClient();
    
    // Call the RPC function defined in the database
    const { data, error } = await supabase.rpc('public_guest_lookup', {
      lookup_slug: slug,
      search_name: searchQuery.trim(),
    });
    
    if (error) {
      console.error('Search error:', error);
      setResults([]);
    } else {
      setResults(data || []);
    }
    
    setSearching(false);
  };

  if (loadingEvent) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <svg className="w-10 h-10 animate-spin text-gold-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-cream-200 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-navy-800 mb-2">Etkinlik Bulunamadı</h1>
        <p className="text-navy-500">
          Aradığınız etkinlik mevcut değil veya henüz aktif hale getirilmemiş olabilir. Lütfen bağlantıyı kontrol edin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center pt-8 sm:pt-16 max-w-lg mx-auto w-full">
      {/* Event Header */}
      <div className="text-center mb-10 w-full">
        <h1 className="text-3xl sm:text-4xl font-bold text-navy-800 mb-3">{event.title}</h1>
        <p className="text-lg text-navy-600 font-medium">Hoş Geldiniz!</p>
        <p className="text-navy-400 text-sm mt-2">Masanızı öğrenmek için adınızı aratın</p>
      </div>

      {/* Search Box */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl shadow-cream-200 border border-white p-6 sm:p-8 w-full mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2 ml-1">
              Adınız ve Soyadınız
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Örnek: Ali Yılmaz"
                className="w-full pl-5 pr-12 py-4 rounded-2xl border-2 border-cream-200 bg-white text-navy-800 placeholder:text-navy-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-100 outline-none transition-all text-lg"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setResults(null); setHasSearched(false); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-600"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-xs text-navy-400 mt-2 ml-1">En az 3 harf girmelisiniz.</p>
          </div>
          <button
            type="submit"
            disabled={searching || searchQuery.length < 3}
            className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-gold-200/50 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {searching ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Aranıyor...
              </span>
            ) : (
              'Masanı Bul'
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {hasSearched && !searching && (
        <div className="w-full animate-fade-in">
          {results && results.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-navy-600 font-medium ml-2 mb-2">Arama Sonuçları ({results.length}):</h3>
              {results.map((result, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-cream-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-navy-800 text-lg">{result.guest_name}</h4>
                    <p className="text-navy-500 text-sm mt-1">
                      {result.table_name ? 'Masaya atandı' : 'Masa ataması yapılmadı'}
                    </p>
                  </div>
                  <div className="text-right">
                    {result.table_name ? (
                      <div className="bg-gold-50 border-2 border-gold-200 rounded-xl px-4 py-2 sm:px-6 sm:py-3 inline-block">
                        <span className="block text-xs text-gold-700 font-medium mb-0.5">Masa</span>
                        <span className="block text-xl font-bold text-gold-800">{result.table_name}</span>
                      </div>
                    ) : (
                      <span className="text-navy-400 italic text-sm">Bekleniyor</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center shadow-md border border-cream-200">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-semibold text-navy-800 mb-2">Kayıt Bulunamadı</h3>
              <p className="text-navy-500">
                &quot;{searchQuery}&quot; adında bir misafir kaydı bulamadık. İsminizi farklı yazılmış olabilir, sadece adınızla veya soyadınızla tekrar deneyebilirsiniz.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
