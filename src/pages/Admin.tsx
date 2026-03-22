import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/lib/store';
import Icon from '@/components/ui/icon';

type Tab = 'analytics' | 'stations' | 'users' | 'banners' | 'categories';

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

interface Analytics {
  total_stations: number;
  total_users: number;
  total_listens: number;
  week_listens: number;
  top_stations: { name: string; listen_count: number; cover_url?: string }[];
  recent_users: { username: string; email: string; created_at: string; role: string }[];
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('analytics');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [users, setUsers] = useState<{ id: number; username: string; email: string; role: string; created_at: string; is_blocked: boolean }[]>([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [banners, setBanners] = useState<{ id: number; title: string; subtitle?: string; image_url?: string; is_active: boolean; sort_order: number }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string; color: string }[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [editStation, setEditStation] = useState<Station | null>(null);
  const [newStation, setNewStation] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);
  const [stationForm, setStationForm] = useState<Partial<Station & { category_id: string; genre_id: string }>>({});
  const [bannerForm, setBannerForm] = useState<{ title: string; subtitle: string; image_url: string; link_url: string; sort_order: number }>({ title: '', subtitle: '', image_url: '', link_url: '', sort_order: 0 });
  const [newBanner, setNewBanner] = useState(false);
  const [searchStations, setSearchStations] = useState('');
  const [catForm, setCatForm] = useState({ name: '', slug: '', color: '#8b5cf6' });
  const [editCat, setEditCat] = useState<{ id: number; name: string; slug: string; color: string } | null>(null);
  const [genreForm, setGenreForm] = useState({ name: '', slug: '' });
  const [editGenre, setEditGenre] = useState<{ id: number; name: string; slug: string } | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    loadTab('analytics');
  }, [user]);

  const loadTab = async (t: Tab) => {
    setTab(t);
    setLoading(true);
    if (t === 'analytics') {
      const r = await adminApi.getAnalytics();
      if (r.ok) setAnalytics(r.data);
    } else if (t === 'stations') {
      const r = await adminApi.getStations({ search: searchStations });
      if (r.ok) setStations(r.data.stations || []);
      const [cr, gr] = await Promise.all([adminApi.getCategories(), adminApi.getGenres()]);
      if (cr.ok) setCategories(cr.data.categories || []);
      if (gr.ok) setGenres(gr.data.genres || []);
    } else if (t === 'users') {
      const r = await adminApi.getUsers({ search: searchUsers });
      if (r.ok) setUsers(r.data.users || []);
    } else if (t === 'banners') {
      const r = await adminApi.getBanners();
      if (r.ok) setBanners(r.data.banners || []);
    } else if (t === 'categories') {
      const [cr, gr] = await Promise.all([adminApi.getCategories(), adminApi.getGenres()]);
      if (cr.ok) setCategories(cr.data.categories || []);
      if (gr.ok) setGenres(gr.data.genres || []);
    }
    setLoading(false);
  };

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

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    setBannerForm(f => ({ ...f, image_url: url }));
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
    loadTab('stations');
  };

  const deleteStation = async (id: number) => {
    if (!confirm('Скрыть эту станцию?')) return;
    await adminApi.deleteStation(id);
    loadTab('stations');
  };

  const saveBanner = async () => {
    await adminApi.createBanner(bannerForm);
    setNewBanner(false);
    setBannerForm({ title: '', subtitle: '', image_url: '', link_url: '', sort_order: 0 });
    loadTab('banners');
  };

  const toggleBanner = async (id: number, is_active: boolean) => {
    await adminApi.updateBanner(id, { is_active: !is_active });
    loadTab('banners');
  };

  const toggleBlockUser = async (id: number, is_blocked: boolean) => {
    await adminApi.blockUser(id, !is_blocked);
    const r = await adminApi.getUsers({ search: searchUsers });
    if (r.ok) setUsers(r.data.users || []);
  };

  const handleDeleteUser = async (id: number, username: string) => {
    if (!confirm(`Удалить пользователя "${username}"? Это действие необратимо.`)) return;
    await adminApi.deleteUser(id);
    const r = await adminApi.getUsers({ search: searchUsers });
    if (r.ok) setUsers(r.data.users || []);
  };

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'analytics', icon: 'BarChart2', label: 'Аналитика' },
    { key: 'stations', icon: 'Radio', label: 'Станции' },
    { key: 'banners', icon: 'Image', label: 'Баннеры' },
    { key: 'users', icon: 'Users', label: 'Пользователи' },
    { key: 'categories', icon: 'Grid', label: 'Категории' },
  ];

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="container py-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
          <Icon name="Shield" size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="font-oswald text-2xl font-bold">Панель администратора</h1>
          <p className="text-xs text-muted-foreground">Только для администраторов</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => loadTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}

      {/* Analytics */}
      {!loading && tab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Станций', value: analytics.total_stations, icon: 'Radio', color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { label: 'Пользователей', value: analytics.total_users, icon: 'Users', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { label: 'Прослушиваний', value: analytics.total_listens?.toLocaleString('ru'), icon: 'Headphones', color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'За неделю', value: analytics.week_listens, icon: 'TrendingUp', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            ].map(stat => (
              <div key={stat.label} className="gradient-card rounded-2xl p-5">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon name={stat.icon} size={20} className={stat.color} />
                </div>
                <p className="font-oswald text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="gradient-card rounded-2xl p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Icon name="TrendingUp" size={16} className="text-primary" />Топ-5 станций</h3>
              <div className="space-y-3">
                {analytics.top_stations.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                    </div>
                    <span className="text-xs text-primary font-semibold">{s.listen_count?.toLocaleString('ru')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="gradient-card rounded-2xl p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Icon name="UserPlus" size={16} className="text-cyan-400" />Новые пользователи</h3>
              <div className="space-y-3">
                {analytics.recent_users.map(u => (
                  <div key={u.email} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {u.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{u.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    {u.role === 'admin' && <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">admin</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stations */}
      {!loading && tab === 'stations' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchStations}
                onChange={e => setSearchStations(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadTab('stations')}
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
      )}

      {/* Banners */}
      {!loading && tab === 'banners' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Слайдер на главной</h3>
            <button onClick={() => setNewBanner(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
              <Icon name="Plus" size={15} />Добавить
            </button>
          </div>

          {newBanner && (
            <div className="gradient-card rounded-2xl p-5 neon-border">
              <h3 className="font-semibold mb-4">Новый баннер</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { key: 'title', label: 'Заголовок *', placeholder: 'Текст баннера' },
                  { key: 'subtitle', label: 'Подзаголовок', placeholder: 'Дополнительный текст' },
                  { key: 'link_url', label: 'Ссылка', placeholder: '/stations' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                    <input
                      value={(bannerForm as Record<string, string | number>)[f.key] as string || ''}
                      onChange={e => setBannerForm(b => ({ ...b, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Изображение</label>
                  <div className="flex gap-2 items-center">
                    <button type="button" onClick={() => bannerFileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border text-sm hover:border-primary/50 transition-colors">
                      <Icon name="Upload" size={14} />Загрузить
                    </button>
                    <input ref={bannerFileRef} type="file" accept="image/*" className="hidden" onChange={handleBannerFileChange} />
                    {bannerForm.image_url && <img src={bannerForm.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={saveBanner} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">Сохранить</button>
                <button onClick={() => setNewBanner(false)} className="px-4 py-2 rounded-lg bg-secondary text-sm">Отмена</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {banners.map(banner => (
              <div key={banner.id} className={`flex items-center gap-3 p-4 gradient-card rounded-xl ${!banner.is_active ? 'opacity-50' : ''}`}>
                {banner.image_url && <img src={banner.image_url} alt="" className="w-12 h-8 rounded object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{banner.title}</p>
                  {banner.subtitle && <p className="text-xs text-muted-foreground">{banner.subtitle}</p>}
                </div>
                <button
                  onClick={() => toggleBanner(banner.id, banner.is_active)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${banner.is_active ? 'bg-green-500/20 text-green-400' : 'bg-secondary text-muted-foreground'}`}
                >
                  {banner.is_active ? 'Активен' : 'Скрыт'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      {!loading && tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchUsers}
                onChange={e => setSearchUsers(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadTab('users')}
                placeholder="Поиск по имени или email..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              onClick={() => loadTab('users')}
              className="px-4 py-2 rounded-xl bg-secondary text-sm font-semibold hover:bg-secondary/80 transition-all"
            >
              Найти
            </button>
            <span className="text-xs text-muted-foreground ml-auto">{users.length} пользователей</span>
          </div>

          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${u.is_blocked ? 'border-red-500/20 bg-red-500/5' : 'border-transparent hover:bg-secondary/60'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${u.is_blocked ? 'bg-red-500/40' : 'bg-gradient-to-br from-purple-500 to-cyan-500'}`}>
                  {u.is_blocked ? <Icon name="Lock" size={14} /> : u.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{u.username}</p>
                    {u.role === 'admin' && (
                      <span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">admin</span>
                    )}
                    {u.is_blocked && (
                      <span className="text-xs text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-full">заблокирован</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <p className="text-xs text-muted-foreground hidden sm:block">{new Date(u.created_at).toLocaleDateString('ru-RU')}</p>
                {u.role !== 'admin' && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleBlockUser(u.id, u.is_blocked)}
                      title={u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                      className={`p-2 rounded-lg text-xs font-semibold transition-all ${u.is_blocked ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25' : 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25'}`}
                    >
                      <Icon name={u.is_blocked ? 'Unlock' : 'Lock'} size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id, u.username)}
                      title="Удалить"
                      className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Icon name="Users" size={32} className="mx-auto mb-3 opacity-30" />
                Пользователи не найдены
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories & Genres */}
      {!loading && tab === 'categories' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Icon name="Grid" size={16} className="text-primary" />Категории</h3>
            <div className="space-y-2 mb-4">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 p-3 gradient-card rounded-xl group">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  {editCat?.id === cat.id ? (
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      <input value={editCat.name} onChange={e => setEditCat(c => c ? { ...c, name: e.target.value } : c)}
                        className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-secondary border border-border text-sm focus:outline-none" />
                      <input value={editCat.slug} onChange={e => setEditCat(c => c ? { ...c, slug: e.target.value } : c)}
                        className="w-24 px-2 py-1 rounded-lg bg-secondary border border-border text-sm focus:outline-none" />
                      <input type="color" value={editCat.color} onChange={e => setEditCat(c => c ? { ...c, color: e.target.value } : c)}
                        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0" />
                      <button onClick={async () => { await adminApi.updateCategory(editCat.id, editCat); setEditCat(null); loadTab('categories'); }}
                        className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">OK</button>
                      <button onClick={() => setEditCat(null)} className="px-2 py-1 rounded-lg bg-secondary text-xs">✕</button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium flex-1">{cat.name}</span>
                      <span className="text-xs text-muted-foreground">{cat.slug}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditCat(cat)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <Icon name="Pencil" size={13} />
                        </button>
                        <button onClick={async () => { if (!confirm('Удалить категорию?')) return; await adminApi.deleteCategory(cat.id); loadTab('categories'); }}
                          className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                          <Icon name="Trash2" size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="gradient-card rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium">Добавить категорию</p>
              {[{ key: 'name', ph: 'Название' }, { key: 'slug', ph: 'slug (латиница)' }].map(f => (
                <input key={f.key} value={(catForm as Record<string, string>)[f.key]} onChange={e => setCatForm(c => ({ ...c, [f.key]: e.target.value }))} placeholder={f.ph}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none" />
              ))}
              <div className="flex gap-2 items-center">
                <input type="color" value={catForm.color} onChange={e => setCatForm(c => ({ ...c, color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                <span className="text-xs text-muted-foreground">Цвет</span>
              </div>
              <button onClick={async () => { await adminApi.createCategory(catForm); setCatForm({ name: '', slug: '', color: '#8b5cf6' }); loadTab('categories'); }}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
                Добавить
              </button>
            </div>
          </div>

          {/* Genres */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Icon name="Music" size={16} className="text-cyan-400" />Жанры</h3>
            <div className="space-y-2 mb-4">
              {genres.map(g => (
                <div key={g.id} className="flex items-center gap-3 p-3 gradient-card rounded-xl group">
                  <Icon name="Music2" size={14} className="text-muted-foreground flex-shrink-0" />
                  {editGenre?.id === g.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input value={editGenre.name} onChange={e => setEditGenre(v => v ? { ...v, name: e.target.value } : v)}
                        className="flex-1 px-2 py-1 rounded-lg bg-secondary border border-border text-sm focus:outline-none" />
                      <input value={editGenre.slug} onChange={e => setEditGenre(v => v ? { ...v, slug: e.target.value } : v)}
                        className="w-24 px-2 py-1 rounded-lg bg-secondary border border-border text-sm focus:outline-none" />
                      <button onClick={async () => { await adminApi.updateGenre(editGenre.id, editGenre); setEditGenre(null); loadTab('categories'); }}
                        className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">OK</button>
                      <button onClick={() => setEditGenre(null)} className="px-2 py-1 rounded-lg bg-secondary text-xs">✕</button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium flex-1">{g.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditGenre(g)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <Icon name="Pencil" size={13} />
                        </button>
                        <button onClick={async () => { if (!confirm('Удалить жанр?')) return; await adminApi.deleteGenre(g.id); loadTab('categories'); }}
                          className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                          <Icon name="Trash2" size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="gradient-card rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium">Добавить жанр</p>
              {[{ key: 'name', ph: 'Название' }, { key: 'slug', ph: 'slug' }].map(f => (
                <input key={f.key} value={(genreForm as Record<string, string>)[f.key]} onChange={e => setGenreForm(v => ({ ...v, [f.key]: e.target.value }))} placeholder={f.ph}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none" />
              ))}
              <button onClick={async () => { await adminApi.createGenre(genreForm); setGenreForm({ name: '', slug: '' }); loadTab('categories'); }}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}