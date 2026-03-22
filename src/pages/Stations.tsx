import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { radioApi, userApi } from '@/lib/api';
import StationCard from '@/components/StationCard';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/lib/store';
import type { Station } from '@/lib/store';

interface Category { id: number; name: string; color: string; slug: string; }
interface Genre { id: number; name: string; }

const CAT_ICONS: Record<string, string> = {
  'Новости': 'Newspaper',
  'Музыка': 'Music',
  'Разговорное': 'MessageSquare',
  'Спорт': 'Trophy',
  'Детское': 'Star',
  'Классика': 'Music2',
  'Джаз': 'Music4',
  'Рок': 'Guitar',
  'Поп': 'Mic2',
  'Электронная': 'Zap',
};

export default function Stations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category_id') || '';
  const genreId = searchParams.get('genre_id') || '';
  const sort = searchParams.get('sort') || 'listen_count';

  const load = useCallback(async () => {
    setLoading(true);
    const p: Record<string, string> = { sort, limit: '60' };
    if (search) p.search = search;
    if (categoryId) p.category_id = categoryId;
    if (genreId) p.genre_id = genreId;
    const res = await radioApi.getStations(p);
    if (res.ok) {
      setStations(res.data.stations || []);
      setTotal(res.data.total || 0);
    }
    setLoading(false);
  }, [search, categoryId, genreId, sort]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    radioApi.getCategories().then(r => { if (r.ok) setCategories(r.data.categories || []); });
    radioApi.getGenres().then(r => { if (r.ok) setGenres(r.data.genres || []); });
  }, []);

  useEffect(() => {
    if (!user) return;
    userApi.getFavorites().then(r => {
      if (r.ok) setFavorites(r.data.favorites?.map((f: Station) => f.id) || []);
    });
  }, [user]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
    setSidebarOpen(false);
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
    setSidebarOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput) next.set('search', searchInput);
    else next.delete('search');
    setSearchParams(next);
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

  const hasFilters = !!(search || categoryId || genreId || sort !== 'listen_count');
  const activeCat = categories.find(c => String(c.id) === categoryId);

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Categories grid */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Категории</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setFilter('category_id', '')}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
              !categoryId
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-secondary/50 text-muted-foreground border-transparent hover:border-border hover:text-foreground'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!categoryId ? 'bg-primary/20' : 'bg-secondary'}`}>
              <Icon name="Layers" size={16} />
            </div>
            Все
          </button>
          {categories.map(cat => {
            const active = categoryId === String(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => setFilter('category_id', active ? '' : String(cat.id))}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  active
                    ? 'text-white border-transparent'
                    : 'bg-secondary/50 text-muted-foreground border-transparent hover:border-border hover:text-foreground'
                }`}
                style={active ? { backgroundColor: cat.color, borderColor: cat.color } : undefined}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-white/20' : 'bg-secondary'}`}
                  style={!active ? { color: cat.color } : undefined}
                >
                  <Icon name={CAT_ICONS[cat.name] || 'Radio'} size={16} />
                </div>
                <span className="text-center leading-tight">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Сортировка</p>
        <div className="space-y-1">
          {[
            { value: 'listen_count', label: 'По популярности', icon: 'TrendingUp' },
            { value: 'name', label: 'По алфавиту', icon: 'ArrowDownAZ' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter('sort', opt.value)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                sort === opt.value
                  ? 'bg-primary/15 text-primary border border-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
              }`}
            >
              <Icon name={opt.icon} size={15} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Genres */}
      {genres.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Жанры</p>
          <div className="flex flex-wrap gap-1.5">
            {genres.map(g => (
              <button
                key={g.id}
                onClick={() => setFilter('genre_id', genreId === String(g.id) ? '' : String(g.id))}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  genreId === String(g.id)
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'bg-secondary/50 text-muted-foreground hover:text-foreground border border-transparent hover:border-border'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset */}
      {hasFilters && (
        <button
          onClick={resetFilters}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
        >
          <Icon name="RotateCcw" size={14} />
          Сбросить фильтры
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen animate-fade-in">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile filter drawer */}
      <div className={`fixed top-0 left-0 h-full w-72 z-50 flex flex-col bg-[hsl(222,25%,7%)] border-r border-border/50 transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 h-14 border-b border-border/50 flex-shrink-0">
          <span className="font-semibold text-sm">Фильтры</span>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <FilterPanel />
        </div>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-border/50 p-5">
          <div className="mb-5">
            <h2 className="font-oswald text-lg font-bold">Фильтры</h2>
          </div>
          <FilterPanel />
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 px-4 md:px-6 py-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="font-oswald text-2xl md:text-3xl font-bold gradient-text">
                {activeCat ? activeCat.name : 'Радиостанции'}
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {loading ? '...' : `${total} станций`}
                {activeCat && <span className="ml-2 text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: activeCat.color }}>{activeCat.name}</span>}
              </p>
            </div>

            {/* Mobile filter button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${hasFilters ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground'}`}
            >
              <Icon name="SlidersHorizontal" size={16} />
              Фильтры
              {hasFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative mb-5">
            <Icon name="Search" size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Поиск по названию, городу, частоте..."
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setFilter('search', ''); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" size={16} />
              </button>
            )}
          </form>

          {/* Active filters chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-5">
              {search && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-medium border border-primary/25">
                  <Icon name="Search" size={12} />
                  «{search}»
                  <button onClick={() => { setSearchInput(''); setFilter('search', ''); }} className="hover:text-white transition-colors"><Icon name="X" size={11} /></button>
                </span>
              )}
              {activeCat && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-medium" style={{ backgroundColor: `${activeCat.color}33`, border: `1px solid ${activeCat.color}66`, color: activeCat.color }}>
                  <Icon name={CAT_ICONS[activeCat.name] || 'Radio'} size={12} />
                  {activeCat.name}
                  <button onClick={() => setFilter('category_id', '')} className="hover:opacity-70 transition-opacity"><Icon name="X" size={11} /></button>
                </span>
              )}
              {genreId && genres.find(g => String(g.id) === genreId) && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/15 text-cyan-400 text-xs font-medium border border-cyan-500/25">
                  <Icon name="Music" size={12} />
                  {genres.find(g => String(g.id) === genreId)?.name}
                  <button onClick={() => setFilter('genre_id', '')} className="hover:text-white transition-colors"><Icon name="X" size={11} /></button>
                </span>
              )}
              {sort === 'name' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium border border-border">
                  <Icon name="ArrowDownAZ" size={12} />
                  По алфавиту
                  <button onClick={() => setFilter('sort', 'listen_count')} className="hover:text-foreground transition-colors"><Icon name="X" size={11} /></button>
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="gradient-card rounded-2xl h-44 animate-pulse" />
              ))}
            </div>
          ) : stations.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
              {stations.map((station, i) => (
                <div key={station.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}>
                  <StationCard
                    station={station}
                    isFav={favorites.includes(station.id)}
                    onFavChange={() => toggleFav(station)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <Icon name="Radio" size={36} className="text-muted-foreground opacity-40" />
              </div>
              <p className="text-lg font-semibold mb-1">Станции не найдены</p>
              <p className="text-muted-foreground text-sm mb-5">Попробуйте изменить параметры поиска</p>
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/15 text-primary border border-primary/30 text-sm font-semibold hover:bg-primary/25 transition-all"
              >
                <Icon name="RotateCcw" size={15} />
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
