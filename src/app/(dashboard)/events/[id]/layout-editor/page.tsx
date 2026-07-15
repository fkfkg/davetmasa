'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { createClient } from '@/lib/supabase/client';
import type { Table, Guest, SaveStatus, SalonTemplateTable } from '@/types/database';

export default function LayoutEditorPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  
  // Settings
  const [shopWidth, setShopWidth] = useState(1200);
  const [shopHeight, setShopHeight] = useState(800);
  const [presets, setPresets] = useState<any[]>([]);

  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [eventRes, tablesRes, guestsRes, settingsRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).single(),
      supabase.from('tables').select('*').eq('event_id', eventId).order('sort_order'),
      supabase.from('guests').select('*').eq('event_id', eventId).order('full_name'),
      supabase.from('settings').select('*')
    ]);
    
    setTables(tablesRes.data || []);
    setGuests(guestsRes.data || []);
    setEventTitle(eventRes.data?.title || '');
    
    if (settingsRes.data && settingsRes.data.length > 0) {
      setShopWidth(eventRes.data?.layout_width || settingsRes.data[0].shop_width || 1200);
      setShopHeight(eventRes.data?.layout_height || settingsRes.data[0].shop_height || 800);
      const loadedPresets = settingsRes.data[0].table_presets || [];
      setPresets(loadedPresets);
      if (loadedPresets.length > 0) {
        setSelectedPresetId(loadedPresets[0].id);
      }
    }

    setLoading(false);
  }, [eventId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Masa ekleme
  const addTable = async () => {
    if (!newTableName.trim()) return;
    
    let presetToUse = presets.find(p => p.id === selectedPresetId);
    if (!presetToUse) {
      // Fallback
      presetToUse = { capacity: 10, type: 'round', width: 120, height: 120 };
    }

    setSaveStatus('saving');
    const supabase = createClient();
    const { data, error } = await supabase
      .from('tables')
      .insert({
        event_id: eventId,
        name: newTableName.trim(),
        type: presetToUse.type,
        capacity: presetToUse.capacity,
        width: presetToUse.width,
        height: presetToUse.height,
        x_position: 100 + Math.random() * 200,
        y_position: 100 + Math.random() * 200,
        sort_order: tables.length,
      })
      .select()
      .single();

    if (!error && data) {
      setTables([...tables, data]);
      setNewTableName('');
      setShowAddTable(false);
      setSaveStatus('saved');
    } else {
      setSaveStatus('error');
    }
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  // Masa silme
  const deleteTable = async (tableId: string) => {
    if (!confirm('Bu masayı silmek istediğinize emin misiniz? Atanmış misafirler masasız kalacak.')) return;
    setSaveStatus('saving');
    const supabase = createClient();
    await supabase.from('tables').delete().eq('id', tableId);
    setTables(tables.filter((t) => t.id !== tableId));
    setSelectedTable(null);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const saveCurrentLayoutAsTemplate = async () => {
    const templateName = prompt('Salon sablonu adi:', eventTitle ? `${eventTitle} Duzeni` : 'Yeni Salon Sablonu');
    if (!templateName?.trim()) return;

    setSaveStatus('saving');
    const supabase = createClient();
    const defaultTables: SalonTemplateTable[] = tables.map((table, index) => ({
      id: table.id,
      name: table.name,
      x: Number(table.x_position) || 0,
      y: Number(table.y_position) || 0,
      width: Number(table.width) || 120,
      height: Number(table.height) || 120,
      capacity: Number(table.capacity) || 10,
      type: table.type,
      rotation: Number(table.rotation) || 0,
      shape: table.type,
      color: table.color,
      sort_order: Number(table.sort_order) || index,
    }));

    const { error } = await supabase
      .from('salon_templates')
      .insert({
        name: templateName.trim(),
        description: eventTitle ? `${eventTitle} etkinliginden kaydedildi` : null,
        width: shopWidth,
        height: shopHeight,
        default_tables: defaultTables,
      });

    setSaveStatus(error ? 'error' : 'saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  // Masa konumunu güncelle (drag)
  const updateTablePosition = async (tableId: string, x: number, y: number) => {
    setSaveStatus('saving');
    const supabase = createClient();
    const { error } = await supabase
      .from('tables')
      .update({ x_position: x, y_position: y })
      .eq('id', tableId);

    setSaveStatus(error ? 'error' : 'saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  // Misafiri masaya ata
  const assignGuest = async (guestId: string, tableId: string | null) => {
    if (tableId) {
      const table = tables.find((t) => t.id === tableId);
      const currentCount = guests.filter((g) => g.table_id === tableId).length;
      if (table && currentCount >= table.capacity) {
        alert(`${table.name} dolu! Kapasite: ${table.capacity}`);
        return;
      }
    }

    setSaveStatus('saving');
    const supabase = createClient();
    await supabase.from('guests').update({ table_id: tableId }).eq('id', guestId);
    setGuests(guests.map((g) => g.id === guestId ? { ...g, table_id: tableId } : g));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  // Canvas pan ve zoom
  const handleWheel = (e: React.WheelEvent) => {
    const zoomSensitivity = 0.002;
    const newScale = Math.min(Math.max(0.3, scale - e.deltaY * zoomSensitivity), 3);
    setScale(newScale);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) { // Middle or Right click
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  // Masa sürükleme (canvas üzerinde)
  const handleTableMouseDown = (e: React.MouseEvent, table: Table) => {
    if (e.button !== 0) return; // Sadece sol tık
    e.preventDefault();
    e.stopPropagation();
    setDraggingTable(table.id);
    const rect = (e.currentTarget.parentElement?.parentElement as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left - pan.x) / scale - Number(table.x_position),
      y: (e.clientY - rect.top - pan.y) / scale - Number(table.y_position),
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      return;
    }
    if (!draggingTable) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.max(0, (e.clientX - rect.left - pan.x) / scale - dragOffset.x);
    const y = Math.max(0, (e.clientY - rect.top - pan.y) / scale - dragOffset.y);
    setTables(tables.map((t) => t.id === draggingTable ? { ...t, x_position: x, y_position: y } : t));
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (draggingTable) {
      const table = tables.find((t) => t.id === draggingTable);
      if (table) {
        updateTablePosition(draggingTable, Number(table.x_position), Number(table.y_position));
      }
      setDraggingTable(null);
    }
  };

  // Sandalyeleri çiz
  const renderChairs = (capacity: number, type: string, width: number, height: number, isFull: boolean) => {
    const chairs = [];
    const rX = width / 2 + 14;
    const rY = height / 2 + 14;
    for (let i = 0; i < capacity; i++) {
      let cx, cy;
      if (type === 'round') {
        const angle = (i / capacity) * 2 * Math.PI;
        cx = width / 2 + rX * Math.cos(angle);
        cy = height / 2 + rY * Math.sin(angle);
      } else {
        const perimeter = 2 * (width + height);
        const pos = (i / capacity) * perimeter;
        if (pos < width) { cx = pos; cy = -14; }
        else if (pos < width + height) { cx = width + 14; cy = pos - width; }
        else if (pos < 2 * width + height) { cx = width - (pos - width - height); cy = height + 14; }
        else { cx = -14; cy = height - (pos - 2 * width - height); }
      }
      chairs.push(
        <div key={i} className={`absolute w-3.5 h-3.5 rounded-full -ml-[7px] -mt-[7px] border border-white shadow-sm transition-colors ${isFull ? 'bg-red-400' : 'bg-gold-400'}`} style={{ left: cx, top: cy }} />
      );
    }
    return chairs;
  };

  // DnD misafir atama
  const handleDragStart = (event: DragStartEvent) => {
    const guest = guests.find((g) => g.id === event.active.id);
    if (guest) setActiveGuest(guest);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveGuest(null);
    if (over) {
      const tableId = over.id as string;
      if (tableId === 'unassign') {
        assignGuest(active.id as string, null);
      } else {
        assignGuest(active.id as string, tableId);
      }
    }
  };

  const unseatedGuests = guests.filter((g) => !g.table_id);

  const getTableGuests = (tableId: string) =>
    guests.filter((g) => g.table_id === tableId);

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

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <Link href={`/events/${eventId}`} className="text-sm text-navy-400 hover:text-gold-600 mb-1 inline-block">
              ← Etkinlik
            </Link>
            <h1 className="text-xl font-bold text-navy-800">Salon Planı Editörü</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Save Status */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              saveStatus === 'saving' ? 'bg-yellow-100 text-yellow-700' :
              saveStatus === 'saved' ? 'bg-green-100 text-green-700' :
              saveStatus === 'error' ? 'bg-red-100 text-red-700' :
              saveStatus === 'offline' ? 'bg-orange-100 text-orange-700' :
              'bg-cream-100 text-navy-500'
            }`}>
              {saveStatus === 'saving' && '⏳ Kaydediliyor...'}
              {saveStatus === 'saved' && '✓ Kaydedildi'}
              {saveStatus === 'error' && '✕ Hata'}
              {saveStatus === 'offline' && '📡 Bağlantı yok'}
              {saveStatus === 'idle' && '● Hazır'}
            </div>
            <button
              onClick={saveCurrentLayoutAsTemplate}
              className="px-4 py-2 border border-cream-300 bg-white text-navy-600 text-sm font-medium rounded-xl shadow-sm hover:bg-cream-50"
            >
              Bu duzeni sablon kaydet
            </button>
            <button
              onClick={() => setShowAddTable(true)}
              className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white text-sm font-medium rounded-xl shadow-md"
            >
              + Masa Ekle
            </button>
          </div>
        </div>

        <div className="flex gap-4 h-[calc(100%-3rem)]">
          {/* Canvas */}
          <div
            className={`flex-1 bg-white rounded-2xl border border-cream-200 relative overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-crosshair'}`}
            onWheel={handleWheel}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Zoom Göstergesi ve Kontroller */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              <button onClick={() => setScale(Math.min(scale + 0.1, 3))} className="w-8 h-8 bg-white border border-cream-200 rounded-lg shadow-sm flex items-center justify-center text-navy-600 hover:bg-cream-50 font-bold">+</button>
              <button onClick={() => setScale(Math.max(scale - 0.1, 0.3))} className="w-8 h-8 bg-white border border-cream-200 rounded-lg shadow-sm flex items-center justify-center text-navy-600 hover:bg-cream-50 font-bold">-</button>
              <button onClick={() => { setScale(1); setPan({x:0, y:0}); }} className="px-3 h-8 bg-white border border-cream-200 rounded-lg shadow-sm flex items-center justify-center text-xs font-medium text-navy-600 hover:bg-cream-50">Sıfırla</button>
            </div>
            <div className="absolute bottom-4 left-4 z-20 text-xs text-navy-400 bg-white/80 px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
              Zoom: {Math.round(scale * 100)}% | Sağ Tık/Orta Tuş: Kaydır
            </div>

            <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>

            {/* Dükkan Sınırları */}
            <div 
              className="absolute border-2 border-dashed border-navy-200 bg-white"
              style={{
                width: `${shopWidth}px`,
                height: `${shopHeight}px`,
                left: 0,
                top: 0
              }}
            >
              <span className="absolute -top-6 left-0 text-xs text-navy-400 font-medium">Dükkan Sınırı ({shopWidth}x{shopHeight})</span>
            </div>

            {tables.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-4">🪑</div>
                  <h3 className="text-lg font-semibold text-navy-700 mb-2">Henüz masa yok</h3>
                  <p className="text-navy-500 mb-4">Masa ekleyerek başlayın</p>
                  <button
                    onClick={() => setShowAddTable(true)}
                    className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white text-sm font-medium rounded-xl"
                  >
                    + Masa Ekle
                  </button>
                </div>
              </div>
            ) : (
              tables.map((table) => {
                const tableGuests = getTableGuests(table.id);
                const isFull = tableGuests.length >= table.capacity;
                return (
                  <div
                    key={table.id}
                    className={`absolute cursor-grab active:cursor-grabbing select-none ${
                      selectedTable?.id === table.id ? 'ring-2 ring-gold-500 ring-offset-2' : ''
                    } ${draggingTable === table.id ? 'z-10 opacity-90' : ''}`}
                    style={{
                      left: `${table.x_position}px`,
                      top: `${table.y_position}px`,
                      transform: `rotate(${table.rotation}deg)`,
                    }}
                    onMouseDown={(e) => handleTableMouseDown(e, table)}
                    onClick={(e) => {
                      if (!draggingTable) {
                        e.stopPropagation();
                        setSelectedTable(selectedTable?.id === table.id ? null : table);
                      }
                    }}
                  >
                    <div
                      className={`flex flex-col items-center justify-center border-2 shadow-lg ${
                        isFull ? 'border-red-400 bg-red-50' : 'border-gold-400 bg-gold-50'
                      } ${table.type === 'round' ? 'rounded-full' : 'rounded-xl'} relative`}
                      style={{
                        width: `${table.width || 120}px`,
                        height: `${table.height || 120}px`,
                        backgroundColor: isFull ? '#fef2f2' : `${table.color}15`,
                        borderColor: isFull ? '#f87171' : table.color,
                      }}
                    >
                      {/* Sandalyeleri Çiz */}
                      {renderChairs(table.capacity, table.type, table.width || 120, table.height || 120, isFull)}
                      
                      <span className="text-xs font-bold text-navy-700 leading-tight z-10 bg-white/60 px-2 py-0.5 rounded">{table.name}</span>
                      <span className={`text-xs mt-0.5 font-bold z-10 px-1.5 py-0.5 rounded bg-white/60 ${isFull ? 'text-red-600' : 'text-navy-600'}`}>
                        {tableGuests.length}/{table.capacity}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>

          {/* Sidebar Panel */}
          <div className="w-72 flex flex-col gap-3 overflow-hidden">
            {/* Selected Table Info */}
            {selectedTable && (
              <div className="bg-white rounded-2xl border border-cream-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-navy-700">{selectedTable.name}</h3>
                  <button onClick={() => deleteTable(selectedTable.id)} className="text-xs text-red-500 hover:text-red-700">Sil</button>
                </div>
                <div className="text-sm text-navy-500 space-y-1">
                  <p>Kapasite: {selectedTable.capacity}</p>
                  <p>Dolu: {getTableGuests(selectedTable.id).length}</p>
                </div>
                {/* Masadaki misafirler */}
                <div className="mt-3 space-y-1">
                  {getTableGuests(selectedTable.id).map((g) => (
                    <div key={g.id} className="flex items-center justify-between px-2 py-1.5 bg-cream-50 rounded-lg text-sm">
                      <span className="text-navy-700 truncate">{g.full_name}</span>
                      <button
                        onClick={() => assignGuest(g.id, null)}
                        className="text-xs text-red-500 hover:text-red-700 ml-2 shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Atanmamış Misafirler */}
            <div className="flex-1 bg-white rounded-2xl border border-cream-200 p-4 overflow-hidden flex flex-col">
              <h3 className="font-semibold text-navy-700 mb-1">
                Atanmamış Misafirler
                <span className="ml-2 text-xs font-normal text-navy-400">({unseatedGuests.length})</span>
              </h3>
              <div className="flex-1 overflow-y-auto mt-2 space-y-1">
                {unseatedGuests.length === 0 ? (
                  <p className="text-sm text-navy-400 text-center py-4">Tüm misafirler atandı ✓</p>
                ) : (
                  unseatedGuests.map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between px-3 py-2 bg-cream-50 rounded-lg hover:bg-gold-50 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-navy-700 truncate">{guest.full_name}</span>
                        {guest.is_vip && <span className="text-xs text-yellow-600">★</span>}
                      </div>
                      {selectedTable && (
                        <button
                          onClick={() => assignGuest(guest.id, selectedTable.id)}
                          className="text-xs text-gold-600 hover:text-gold-800 font-medium shrink-0 opacity-0 group-hover:opacity-100"
                        >
                          Ata →
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
              {!selectedTable && unseatedGuests.length > 0 && (
                <p className="text-xs text-navy-400 mt-2 text-center">Bir masa seçerek misafir atayın</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Table Modal */}
      {showAddTable && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddTable(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-navy-800 mb-4">Masa Ekle</h2>
            
            {presets.length === 0 ? (
              <div className="text-center py-4 text-navy-500 text-sm">
                Sistemde hiç masa şablonu bulunmuyor. <br/> Lütfen önce <Link href="/settings" className="text-gold-600 font-bold underline">Ayarlar</Link> sayfasından masa şablonu ekleyin.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy-600 mb-1">Masa Adı *</label>
                  <input type="text" value={newTableName} onChange={(e) => setNewTableName(e.target.value)} placeholder="ör: Masa 1"
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 placeholder:text-navy-300 focus:border-gold-400 focus:bg-white outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && addTable()} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-600 mb-1">Masa Şablonu (Çeşidi)</label>
                  <select value={selectedPresetId} onChange={(e) => setSelectedPresetId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 focus:border-gold-400 outline-none">
                    {presets.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.capacity} Kişilik, {p.type === 'round' ? 'Yuvarlak' : 'Dikdörtgen'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowAddTable(false)} className="px-5 py-2.5 border border-cream-300 text-navy-600 rounded-xl hover:bg-cream-100">İptal</button>
                  <button onClick={addTable} className="flex-1 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-medium rounded-xl">Ekle</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <DragOverlay>
        {activeGuest && (
          <div className="px-3 py-2 bg-gold-100 border border-gold-400 rounded-lg shadow-lg text-sm font-medium text-navy-700">
            {activeGuest.full_name}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
