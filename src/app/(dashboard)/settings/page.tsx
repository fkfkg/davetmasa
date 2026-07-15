'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SalonTemplate } from '@/types/database';

type TablePreset = {
  id: string;
  name: string;
  capacity: number;
  width: number;
  height: number;
  type: string;
};

type BackupStatus = 'idle' | 'working' | 'done' | 'error';

export default function SettingsPage() {
  const [shopWidth, setShopWidth] = useState(1200);
  const [shopHeight, setShopHeight] = useState(800);
  const [manualNetworkIp, setManualNetworkIp] = useState('');
  const [detectedNetworkIp, setDetectedNetworkIp] = useState('');
  const [presets, setPresets] = useState<TablePreset[]>([]);
  const [salonTemplates, setSalonTemplates] = useState<SalonTemplate[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [backupStatus, setBackupStatus] = useState<BackupStatus>('idle');
  const [backupMessage, setBackupMessage] = useState('');
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetCapacity, setNewPresetCapacity] = useState('10');
  const [newPresetWidth, setNewPresetWidth] = useState('120');
  const [newPresetHeight, setNewPresetHeight] = useState('120');
  const [newPresetType, setNewPresetType] = useState('round');

  const [newSalonName, setNewSalonName] = useState('');
  const [newSalonDescription, setNewSalonDescription] = useState('');

  useEffect(() => {
    const supabase = createClient();

    supabase.from('settings').select('*').then(({ data }: { data: any[] }) => {
      if (data && data.length > 0) {
        setShopWidth(data[0].shop_width || 1200);
        setShopHeight(data[0].shop_height || 800);
        setManualNetworkIp(data[0].manual_network_ip || '');
        setPresets(data[0].table_presets || []);
      }
    });

    supabase
      .from('salon_templates')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data }: { data: SalonTemplate[] }) => setSalonTemplates(data || []));

    fetch('/api/network')
      .then((res) => res.json())
      .then((data) => setDetectedNetworkIp(data.localIp || ''))
      .catch(() => setDetectedNetworkIp(''));
  }, []);

  const saveSettings = async () => {
    setSaveStatus('saving');
    const supabase = createClient();

    const { data: existing } = await supabase.from('settings').select('*');
    if (existing && existing.length > 0) {
      await supabase.from('settings').update({
        shop_width: shopWidth,
        shop_height: shopHeight,
        manual_network_ip: manualNetworkIp.trim(),
        table_presets: presets,
      }).eq('id', existing[0].id);
    } else {
      await supabase.from('settings').insert({
        id: 'global',
        shop_width: shopWidth,
        shop_height: shopHeight,
        manual_network_ip: manualNetworkIp.trim(),
        table_presets: presets,
      });
    }
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const addPreset = () => {
    if (!newPresetName) return;
    setPresets([...presets, {
      id: crypto.randomUUID(),
      name: newPresetName,
      capacity: parseInt(newPresetCapacity) || 10,
      width: parseInt(newPresetWidth) || 120,
      height: parseInt(newPresetHeight) || 120,
      type: newPresetType,
    }]);
    setNewPresetName('');
  };

  const deletePreset = (id: string) => {
    setPresets(presets.filter((preset) => preset.id !== id));
  };

  const addSalonTemplate = async () => {
    if (!newSalonName.trim()) return;

    const supabase = createClient();
    const { data } = await supabase
      .from('salon_templates')
      .insert({
        name: newSalonName.trim(),
        description: newSalonDescription.trim() || null,
        width: shopWidth,
        height: shopHeight,
        default_tables: [],
      })
      .select()
      .single();

    if (data) {
      setSalonTemplates([data, ...salonTemplates]);
      setNewSalonName('');
      setNewSalonDescription('');
    }
  };

  const updateSalonLocal = (id: string, changes: Partial<SalonTemplate>) => {
    setSalonTemplates((templates) =>
      templates.map((template) => template.id === id ? { ...template, ...changes } : template)
    );
  };

  const saveSalonTemplate = async (template: SalonTemplate) => {
    setSaveStatus('saving');
    const supabase = createClient();
    await supabase
      .from('salon_templates')
      .update({
        name: template.name,
        description: template.description || null,
        width: Number(template.width) || shopWidth,
        height: Number(template.height) || shopHeight,
        default_tables: template.default_tables || [],
      })
      .eq('id', template.id);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const duplicateSalonTemplate = async (template: SalonTemplate) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('salon_templates')
      .insert({
        name: `${template.name} Kopya`,
        description: template.description,
        width: template.width,
        height: template.height,
        default_tables: (template.default_tables || []).map((table) => ({
          ...table,
          id: crypto.randomUUID(),
        })),
      })
      .select()
      .single();

    if (data) setSalonTemplates([data, ...salonTemplates]);
  };

  const deleteSalonTemplate = async (id: string) => {
    if (!confirm('Bu salon sablonunu silmek istediginize emin misiniz?')) return;
    const supabase = createClient();
    await supabase.from('salon_templates').delete().eq('id', id);
    setSalonTemplates(salonTemplates.filter((template) => template.id !== id));
  };

  const downloadBackup = async () => {
    setBackupStatus('working');
    setBackupMessage('');
    try {
      const response = await fetch('/api/backup');
      if (!response.ok) throw new Error('backup');
      const backup = await response.json();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `oturma-duzeni-yedek-${date}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setBackupStatus('done');
      setBackupMessage('Yedek dosyasi indirildi.');
    } catch {
      setBackupStatus('error');
      setBackupMessage('Yedek alinamadi.');
    }
  };

  const restoreBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!confirm('Yedek geri yuklenecek. Mevcut verinin otomatik guvenlik yedegi alinacak. Devam edilsin mi?')) {
      event.target.value = '';
      return;
    }

    setBackupStatus('working');
    setBackupMessage('');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const result = await response.json();
      if (!response.ok) throw new Error('restore');
      setBackupStatus('done');
      setBackupMessage(`Yedek yuklendi. Onceki veri otomatik saklandi: ${result.safetyBackupPath}`);
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      setBackupStatus('error');
      setBackupMessage('Yedek dosyasi yuklenemedi.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Sistem Ayarlari</h1>
          <p className="text-navy-500 text-sm mt-1">Dukkan sinirlari, salon sablonlari ve masa sablonlarini buradan yonetebilirsiniz.</p>
        </div>
        <button
          onClick={saveSettings}
          className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-medium rounded-xl shadow-md flex items-center gap-2"
        >
          {saveStatus === 'saving' ? 'Kaydediliyor...' : saveStatus === 'saved' ? 'Kaydedildi' : 'Ayarlari Kaydet'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
          <span>📏</span> Dukkan (Calisma Alani) Buyuklugu
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy-600 mb-1">Genislik (piksel/cm)</label>
            <input
              type="number"
              value={shopWidth}
              onChange={(e) => setShopWidth(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 focus:border-gold-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-600 mb-1">Yukseklik (piksel/cm)</label>
            <input
              type="number"
              value={shopHeight}
              onChange={(e) => setShopHeight(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 focus:border-gold-400 outline-none"
            />
          </div>
        </div>
        <p className="text-xs text-navy-400 mt-3">
          Bu degerler yeni bos salonlar icin varsayilan siniri belirler. Salon sablonlari kendi alan olculerini ayrica saklar.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
          <span>🏛️</span> Salon Sablonlari
        </h2>

        <div className="space-y-3 mb-6">
          {salonTemplates.length === 0 ? (
            <div className="text-center py-6 bg-cream-50 rounded-xl text-navy-500 border border-cream-200 border-dashed">
              Henuz salon sablonu yok. Mevcut bir etkinligin salon editorunden de sablon kaydedebilirsiniz.
            </div>
          ) : (
            salonTemplates.map((template) => (
              <div key={template.id} className="p-4 border border-cream-200 rounded-xl hover:border-gold-300 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-navy-600 mb-1">Salon Adi</label>
                    <input
                      type="text"
                      value={template.name}
                      onChange={(e) => updateSalonLocal(template.id, { name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-cream-300 outline-none focus:border-gold-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-600 mb-1">Genislik</label>
                    <input
                      type="number"
                      value={template.width}
                      onChange={(e) => updateSalonLocal(template.id, { width: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-cream-300 outline-none focus:border-gold-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-600 mb-1">Yukseklik</label>
                    <input
                      type="number"
                      value={template.height}
                      onChange={(e) => updateSalonLocal(template.id, { height: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-cream-300 outline-none focus:border-gold-400 text-sm"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button onClick={() => saveSalonTemplate(template)} className="flex-1 py-2 bg-navy-700 text-white text-sm font-medium rounded-lg hover:bg-navy-800">
                      Kaydet
                    </button>
                    <button onClick={() => duplicateSalonTemplate(template)} className="px-3 py-2 border border-cream-300 text-navy-600 text-sm rounded-lg hover:bg-cream-100">
                      Kopyala
                    </button>
                    <button onClick={() => deleteSalonTemplate(template.id)} className="px-3 py-2 text-red-500 text-sm rounded-lg hover:bg-red-50">
                      Sil
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-navy-600 mb-1">Aciklama</label>
                  <input
                    type="text"
                    value={template.description || ''}
                    onChange={(e) => updateSalonLocal(template.id, { description: e.target.value })}
                    placeholder="Orn: Buyuk salon, bahce, ust kat..."
                    className="w-full px-3 py-2 rounded-lg border border-cream-300 outline-none focus:border-gold-400 text-sm"
                  />
                </div>
                <div className="mt-3 text-xs text-navy-500">
                  Masa yerlesimi: {(template.default_tables || []).length} masa kayitli. Bu sablondan etkinlik acilinca masalar yeni ID ile kopyalanir.
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-cream-50 p-4 rounded-xl border border-cream-200">
          <h3 className="text-sm font-bold text-navy-700 mb-3">Yeni Bos Salon Sablonu Ekle</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-navy-600 mb-1">Adi</label>
              <input
                type="text"
                value={newSalonName}
                onChange={(e) => setNewSalonName(e.target.value)}
                placeholder="Orn: Ana Salon"
                className="w-full px-3 py-2 rounded-lg border border-cream-300 outline-none focus:border-gold-400 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-navy-600 mb-1">Aciklama</label>
              <input
                type="text"
                value={newSalonDescription}
                onChange={(e) => setNewSalonDescription(e.target.value)}
                placeholder="Orn: 400 kisilik salon"
                className="w-full px-3 py-2 rounded-lg border border-cream-300 outline-none focus:border-gold-400 text-sm"
              />
            </div>
          </div>
          <button onClick={addSalonTemplate} className="mt-3 w-full py-2 bg-navy-700 text-white text-sm font-medium rounded-lg hover:bg-navy-800 transition-colors">
            + Salon Sablonu Ekle
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
          <span>🪑</span> Masa Sablonlari (Cesitleri)
        </h2>

        <div className="space-y-3 mb-6">
          {presets.length === 0 ? (
            <div className="text-center py-6 bg-cream-50 rounded-xl text-navy-500 border border-cream-200 border-dashed">
              Henuz bir masa sablonu eklenmedi. Asagidan ekleyebilirsiniz.
            </div>
          ) : (
            presets.map((preset) => (
              <div key={preset.id} className="flex items-center justify-between p-3 border border-cream-200 rounded-xl hover:border-gold-300 transition-colors">
                <div>
                  <div className="font-semibold text-navy-700">{preset.name}</div>
                  <div className="text-xs text-navy-500">
                    {preset.type === 'round' ? 'Yuvarlak' : 'Dikdortgen'} | {preset.capacity} Kisilik | {preset.width}x{preset.height}
                  </div>
                </div>
                <button
                  onClick={() => deletePreset(preset.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  Sil
                </button>
              </div>
            ))
          )}
        </div>

        <div className="bg-cream-50 p-4 rounded-xl border border-cream-200">
          <h3 className="text-sm font-bold text-navy-700 mb-3">Yeni Masa Sablonu Ekle</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-navy-600 mb-1">Adi</label>
              <input type="text" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} placeholder="Orn: 10'lu Yuvarlak" className="w-full px-3 py-2 rounded-lg border border-cream-300 outline-none focus:border-gold-400 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-600 mb-1">Tip</label>
              <select value={newPresetType} onChange={(e) => setNewPresetType(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-cream-300 outline-none focus:border-gold-400 text-sm">
                <option value="round">Yuvarlak</option>
                <option value="rectangle">Dikdortgen</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-600 mb-1">Kapasite</label>
              <input type="number" value={newPresetCapacity} onChange={(e) => setNewPresetCapacity(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-cream-300 outline-none focus:border-gold-400 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-600 mb-1">Genislik</label>
              <input type="number" value={newPresetWidth} onChange={(e) => setNewPresetWidth(e.target.value)} placeholder="120" className="w-full px-3 py-2 rounded-lg border border-cream-300 outline-none focus:border-gold-400 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-600 mb-1">Yukseklik</label>
              <input type="number" value={newPresetHeight} onChange={(e) => setNewPresetHeight(e.target.value)} placeholder="120" className="w-full px-3 py-2 rounded-lg border border-cream-300 outline-none focus:border-gold-400 text-sm" />
            </div>
          </div>
          <button onClick={addPreset} className="mt-3 w-full py-2 bg-navy-700 text-white text-sm font-medium rounded-lg hover:bg-navy-800 transition-colors">
            + Sablonu Ekle
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
          <span>💾</span> Yedekleme
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={downloadBackup} className="px-5 py-2.5 bg-navy-700 text-white text-sm font-medium rounded-xl hover:bg-navy-800">
            Yedek Al
          </button>
          <button onClick={() => restoreInputRef.current?.click()} className="px-5 py-2.5 border border-cream-300 text-navy-600 text-sm font-medium rounded-xl hover:bg-cream-100">
            Yedekten Geri Yukle
          </button>
          <input ref={restoreInputRef} type="file" accept="application/json,.json" onChange={restoreBackup} className="hidden" />
        </div>
        <p className="text-xs text-navy-400 mt-3">
          Yedek; organizasyon, etkinlik, misafir, masa, salon sablonu, QR/PDF verileri ve ayarlari icerir. Lisans, sifre, cihaz kimligi ve gizli anahtarlar yedege eklenmez.
        </p>
        {backupMessage && (
          <p className={`text-xs mt-3 ${backupStatus === 'error' ? 'text-red-500' : 'text-green-600'}`}>
            {backupMessage}
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
          <span>🌐</span> Yerel Ag QR Baglantisi
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy-600 mb-1">Otomatik Bulunan IP</label>
            <div className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-navy-500">
              {detectedNetworkIp || 'Bulunamadi'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-600 mb-1">Manuel IP (gerekirse)</label>
            <input
              type="text"
              value={manualNetworkIp}
              onChange={(e) => setManualNetworkIp(e.target.value)}
              placeholder="Orn: 192.168.1.25"
              className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-navy-700 focus:border-gold-400 outline-none"
            />
          </div>
        </div>
        <p className="text-xs text-navy-400 mt-3">
          QR kod baglantilari localhost yerine bu yerel ag adresiyle uretilir. Windows Guvenlik Duvari izin isterse izin verin; telefon ve diger bilgisayarlar ayni agda olmali.
        </p>
      </div>
    </div>
  );
}
