import { useRef } from 'react';
import { adminApi } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Station {
  id: number;
  name: string;
  city?: string;
  frequency?: string;
  listen_count: number;
  is_active: boolean;
  is_featured: boolean;
  cover_url?: string;
  stream_url: string;
  description?: string;
  category_id?: number;
  genre_id?: number;
  category_name?: string;
  genre_name?: string;
}

interface Props {
  stations: Station[];
  categories: { id: number; name: string; slug: string; color: string }[];
  genres: { id: number; name: string }[];
  searchStations: string;
  setSearchStations: (v: string) => void;
  editStation: Station | null;
  setEditStation: (s: Station | null) => void;
  newStation: boolean;
  setNewStation: (v: boolean) => void;
  uploadUrl: string;
  setUploadUrl: (v: string) => void;
  stationForm: Partial<Station & { category_id: string; genre_id: string }>;
  setStationForm: React.Dispatch<React.SetStateAction<Partial<Station & { category_id: string; genre_id: string }>>>;
  onReload: () => void;
}

export default function AdminStations({
  stations, categories, genres,
  searchStations, setSearchStations,
  editStation, setEditStation,
  newStation, setNewStation,
  uploadUrl, setUploadUrl,
  stationForm, setStationForm,
  onReload,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async e => {
        const b64 = (e.target?.result as string).split(',')[1];
        const res = await adminApi.uploadImage(b64, file.name, file.type);
        if (res.ok) resolve(res.data.url);
        else reject(new Error(res.data.error));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleStationFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    setStationForm(f => ({ ...f, cover_url: url }));
    setUploadUrl(url);
  };

  const saveStation = async () => {
    const data = {
      ...stationForm,
      category_id: stationForm.category_id ? parseInt(String(stationForm.category_id)) : null,
      genre_id: stationForm.genre_id ? parseInt(String(stationForm.genre_id)) : null,
    };
    if (editStation) {
      await adminApi.updateStation(editStation.id, data);
    } else {
      await adminApi.createStation(data);
    }
    setEditStation(null);
    setNewStation(false);
    setStationForm({});
    onReload();
  };

  const deleteStation = async (id: number) => {
    if (!confirm('Скрыть эту станцию?')) return;
    await adminApi.deleteStation(id);
    onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchStations}
            onChange={e => setSearchStations(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onReload()}
            placeholder="Поиск станций..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button
          onClick={() => { setNewStation(true); setEditStation(null); setStationForm({}); setUploadUrl(''); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 whitespace-nowrap"
        >
          <Icon name="Plus" size={16} />
          Добавить
        </button>
      </div>

      {/* Station Form */}
      {(newStation || editStation) && (
        <div className="gradient-card rounded-2xl p-5 neon-border">
          <h3 className="font-semibold mb-4">{editStation ? 'Редактировать станцию' : 'Новая станция'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Название *', placeholder: 'Название радиостанции' },
              { key: 'stream_url', label: 'URL потока *', placeholder: 'https://...' },
              { key: 'city', label: 'Город', placeholder: 'Москва' },
              { key: 'frequency', label: 'Частота', placeholder: '107.5 FM' },
              { key: 'website_url', label: 'Сайт', placeholder: 'https://...' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                <input
                  value={(stationForm as Record<string, string>)[f.key] || ''}
                  onChange={e => setStationForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            ))}

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Описание</label>
              <textarea
                value={stationForm.description || ''}
                onChange={e => setStationForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Категория</label>
              <select
                value={stationForm.category_id || ''}
                onChange={e => setStationForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none"
              >
                <option value="">— Выбрать —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Жанр</label>
              <select
                value={stationForm.genre_id || ''}
                onChange={e => setStationForm(f => ({ ...f, genre_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none"
              >
                <option value="">— Выбрать —</option>
                {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            {/* Cover upload */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Обложка</label>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border text-sm hover:border-primary/50 transition-colors"
                >
                  <Icon name="Upload" size={14} />
                  Загрузить
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleStationFileChange} />
                {(stationForm.cover_url || uploadUrl) && (
                  <img src={stationForm.cover_url || uploadUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stationForm.is_featured || false}
                  onChange={e => setStationForm(f => ({ ...f, is_featured: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm">Рекомендуемая</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={saveStation} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
              Сохранить
            </button>
            <button onClick={() => { setEditStation(null); setNewStation(false); }} className="px-4 py-2 rounded-lg bg-secondary text-sm">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Stations list */}
      <div className="space-y-1">
        {stations.map(station => (
          <div key={station.id} className={`flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-all ${!station.is_active ? 'opacity-40' : ''}`}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {station.cover_url ? <img src={station.cover_url} alt="" className="w-full h-full object-cover" /> : <Icon name="Radio" size={16} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{station.name}</p>
              <p className="text-xs text-muted-foreground">{station.city} · {station.listen_count?.toLocaleString('ru')} прослушиваний</p>
            </div>
            <div className="flex items-center gap-1">
              {station.is_featured && <Icon name="Star" size={14} className="text-yellow-400" />}
              <button
                onClick={() => { setEditStation(station); setNewStation(false); setStationForm(station); }}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="Pencil" size={14} />
              </button>
              <button onClick={() => deleteStation(station.id)} className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
