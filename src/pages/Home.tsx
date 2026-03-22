import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { radioApi, userApi } from '@/lib/api';
import StationCard from '@/components/StationCard';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/lib/store';
import type { Station } from '@/lib/store';

interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  image_url?: string;
  link_url?: string;
}

interface Category {
  id: number;
  name: string;
  color: string;
}

const SLIDE_GRADIENTS = [
  'from-purple-900 via-blue-900 to-cyan-900',
  'from-pink-900 via-purple-900 to-blue-900',
  'from-orange-900 via-red-900 to-purple-900',
];

const CAT_ICONS: Record<string, string> = {
  'Новости': 'Newspaper',
  'Музыка': 'Music',
  'Разговорное': 'MessageSquare',
  'Спорт': 'Trophy',
  'Детское': 'Star',
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'row'>('grid');

  useEffect(() => {
    radioApi.getSlider().then(r => { if (r.ok) setBanners(r.data.banners || []); });
    radioApi.getCategories().then(r => { if (r.ok) setCategories(r.data.categories || []); });
    loadStations();
  }, []);

  useEffect(() => {
    if (!user) return;
    userApi.getFavorites().then(r => {
      if (r.ok) setFavorites(r.data.favorites?.map((s: Station) => s.id) || []);
    });
  }, [user]);

  const loadStations = async (categoryId?: number) => {
    setLoading(true);
    const params: Record<string, string> = { sort: 'listen_count', limit: '50' };
    if (categoryId) params.category_id = String(categoryId);
    const r = await radioApi.getStations(params);
    if (r.ok) setAllStations(r.data.stations || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!banners.length) return;
    const t = setInterval(() => setSlideIdx(i => (i + 1) % banners.length), 4500);
    return () => clearInterval(t);
  }, [banners.length]);

  const handleCategoryClick = (catId: number) => {
    const next = activeCategory === catId ? null : catId;
    setActiveCategory(next);
    loadStations(next || undefined);
  };

  const toggleFav = async (station: Station) => {
    if (!user) return;
    if (favorites.includes(station.id)) {
      await userApi.removeFavorite(station.id);
      setFavorites(f => f.filter(id => id !== station.id));
    } else {
      await userApi.addFavorite(station.id);
      setFavorites(f => [...f, station.id]);
    }
  };

  const featured = allStations.filter(s => s.is_featured);
  const rest = allStations.filter(s => !s.is_featured);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) navigate(`/stations?search=${encodeURIComponent(searchInput.trim())}`);
  };

  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
    : 'flex flex-col gap-2';

  return (
    <div className="px-4 md:px-6 py-5 space-y-6 animate-fade-in">

      {/* Search bar above slider */}
      <form onSubmit={handleSearch} className="relative">
        <Icon name="Search" size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Поиск по станции, городу, частоте..."
          className="w-full pl-11 pr-28 py-3 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
        />
        <button type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
          Найти
        </button>
      </form>

      {/* Hero Slider */}
      {banners.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden h-44 md:h-64 neon-border">
          {banners.map((banner, idx) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-all duration-700 ${idx === slideIdx ? 'opacity-100' : 'opacity-0'}`}
            >
              {banner.image_url ? (
                <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${SLIDE_GRADIENTS[idx % SLIDE_GRADIENTS.length]}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-5 md:p-8">
                <h1 className="font-oswald text-xl md:text-3xl font-bold text-white leading-tight">{banner.title}</h1>
                {banner.subtitle && (
                  <p className="text-white/75 mt-1 text-xs md:text-sm">{banner.subtitle}</p>
                )}
                <Link to="/stations" className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm text-white text-xs font-semibold hover:bg-white/25 transition-colors w-fit">
                  <Icon name="Play" size={12} />
                  Слушать
                </Link>
              </div>
            </div>
          ))}
          {/* Dots */}
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setSlideIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === slideIdx ? 'bg-white w-5' : 'bg-white/40 w-1.5'}`} />
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <section>
        <h2 className="font-oswald text-lg font-bold mb-3 flex items-center gap-2">
          <Icon name="LayoutGrid" size={18} className="text-primary" />
          Категории
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          <button
            onClick={() => { setActiveCategory(null); loadStations(); }}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
              activeCategory === null
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'bg-secondary/50 text-muted-foreground border-transparent hover:border-border hover:text-foreground'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeCategory === null ? 'bg-primary/20' : 'bg-secondary'}`}>
              <Icon name="Layers" size={18} />
            </div>
            Все
          </button>
          {categories.map(cat => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  active
                    ? 'text-white border-transparent'
                    : 'bg-secondary/50 text-muted-foreground border-transparent hover:border-border hover:text-foreground'
                }`}
                style={active ? { backgroundColor: cat.color, borderColor: cat.color } : undefined}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? 'bg-white/20' : 'bg-secondary'}`}
                  style={!active ? { color: cat.color } : undefined}
                >
                  <Icon name={CAT_ICONS[cat.name] || 'Radio'} size={18} />
                </div>
                <span className="text-center leading-tight">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* All Stations grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-oswald text-lg font-bold flex items-center gap-2">
            <Icon name="TrendingUp" size={18} className="text-primary" />
            {activeCategory ? categories.find(c => c.id === activeCategory)?.name : 'Все станции'}
            {allStations.length > 0 && <span className="text-sm font-normal text-muted-foreground">({allStations.length})</span>}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-secondary rounded-xl p-1">
              <button onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon name="LayoutGrid" size={15} />
              </button>
              <button onClick={() => setViewMode('row')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'row' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon name="List" size={15} />
              </button>
            </div>
            <Link to="/stations" className="text-xs text-primary hover:underline flex items-center gap-1">
              Все <Icon name="ChevronRight" size={12} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className={gridClass}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`gradient-card animate-pulse ${viewMode === 'grid' ? 'rounded-2xl h-44' : 'rounded-xl h-16'}`} />
            ))}
          </div>
        ) : allStations.length > 0 ? (
          <div className={gridClass}>
            {(activeCategory ? allStations : rest).map((station, i) => (
              <div key={station.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(i * 0.025, 0.4)}s` }}>
                <StationCard station={station} isFav={favorites.includes(station.id)} onFavChange={() => toggleFav(station)} view={viewMode} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Icon name="Radio" size={44} className="text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground text-sm">Станции не найдены</p>
          </div>
        )}
      </section>

      {/* Featured stations — after all */}
      {featured.length > 0 && !activeCategory && (
        <section>
          <h2 className="font-oswald text-lg font-bold flex items-center gap-2 mb-3">
            <Icon name="Star" size={18} className="text-yellow-400" />Рекомендуем
          </h2>
          <div className={gridClass}>
            {featured.slice(0, 5).map((station, i) => (
              <div key={station.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <StationCard station={station} isFav={favorites.includes(station.id)} onFavChange={() => toggleFav(station)} view={viewMode} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Donate CTA */}
      <Link to="/donate" className="block rounded-2xl overflow-hidden neon-border group hover:scale-[1.01] transition-all">
        <div className="p-5 bg-gradient-to-r from-yellow-600/15 via-orange-600/10 to-red-600/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Icon name="Heart" size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-oswald text-lg font-bold">Поддержите проект</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Помогите нам развивать лучший радиосервис России</p>
            </div>
            <div className="ml-auto hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold text-sm">
              Поддержать <Icon name="ArrowRight" size={14} />
            </div>
          </div>
        </div>
      </Link>

      {/* Copyright */}
      <footer className="text-center text-xs text-muted-foreground pb-2">
        © 2026 РАДИО РФ — Все радиостанции России онлайн
      </footer>
    </div>
  );
}