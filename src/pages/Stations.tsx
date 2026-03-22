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
  'Новости': 'Newspaper', 'Музыка': 'Music', 'Разговорное': 'MessageSquare',
  'Спорт': 'Trophy', 'Детское': 'Star', 'Классика': 'Music2',
  'Джаз': 'Music4', 'Рок': 'Guitar', 'Поп': 'Mic2', 'Электронная': 'Zap',
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'row'>('grid');

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
    if (res.ok) { setStations(res.data.stations || []); setTotal(res.data.total || 0); }
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
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
    setDrawerOpen(false);
  };
  const resetFilters = () => { setSearchInput(''); setSearchParams(new URLSearchParams()); setDrawerOpen(false); };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput) next.set('search', searchInput); else next.delete('search');
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
  const activeGenre = genres.find(g => String(g.id) === genreId);

  const FilterContent = ({ onSelect }: { onSelect?: () => void }) => (
    <div className="space-y-5">
      {/* Categories */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">Категории</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[{ id: 0, name: 'Все', color: '' }, ...categories].map(cat => {
            const active = cat.id === 0 ? !categoryId : categoryId === String(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => { setFilter('category_id', cat.id === 0 ? '' : String(cat.id)); onSelect?.(); }}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  active
                    ? cat.id === 0 ? 'bg-primary/15 text-primary border-primary/30' : 'text-white border-transparent'
                    : 'bg-secondary/40 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground'
                }`}
                style={active && cat.id !== 0 ? { backgroundColor: cat.color, borderColor: cat.color } : undefined}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-white/20' : 'bg-background/50'}`}
                  style={!active && cat.id !== 0 ? { color: cat.color } : undefined}>
                  <Icon name={cat.id === 0 ? 'Layers' : (CAT_ICONS[cat.name] || 'Radio')} size={13} />
                </div>
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">Сортировка</p>
        <div className="flex flex-col gap-1">
          {[
            { value: 'listen_count', label: 'По популярности', icon: 'TrendingUp' },
            { value: 'name', label: 'По алфавиту', icon: 'ArrowDownAZ' },
          ].map(opt => (
            <button key={opt.value} onClick={() => setFilter('sort', opt.value)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                sort === opt.value
                  ? 'bg-primary/15 text-primary border border-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}>
              <Icon name={opt.icon} size={14} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Genres */}
      {genres.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">Жанры</p>
          <div className="flex flex-wrap gap-1.5">
            {genres.map(g => (
              <button key={g.id}
                onClick={() => setFilter('genre_id', genreId === String(g.id) ? '' : String(g.id))}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                  genreId === String(g.id)
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                    : 'bg-secondary/50 text-muted-foreground border-transparent hover:border-border hover:text-foreground'
                }`}>
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasFilters && (
        <button onClick={resetFilters}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
          <Icon name="RotateCcw" size={13} />Сбросить всё
        </button>
      )}
    </div>
  );

  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3'
    : 'flex flex-col gap-2';

  return (
    <div className="flex min-h-screen animate-fade-in">

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Mobile filter drawer */}
      <div className={`fixed inset-y-0 left-0 w-72 z-50 flex flex-col bg-[hsl(222,25%,7%)] border-r border-border/50 transition-transform duration-300 ease-in-out lg:hidden ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 h-14 border-b border-border/50 flex-shrink-0">
          <span className="font-semibold text-sm flex items-center gap-2">
            <Icon name="SlidersHorizontal" size={16} className="text-primary" />Фильтры
          </span>
          <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <FilterContent onSelect={() => setDrawerOpen(false)} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 border-r border-border/50 transition-all duration-300 overflow-hidden ${sidebarCollapsed ? 'w-14' : 'w-60 xl:w-64'}`}>
        <div className={`sticky top-0 h-screen overflow-y-auto flex flex-col`}>
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-3 py-4 border-b border-border/50 flex-shrink-0">
            {!sidebarCollapsed && <span className="font-semibold text-sm">Фильтры</span>}
            <button
              onClick={() => setSidebarCollapsed(c => !c)}
              className={`p-1.5 rounded-lg hover:bg-secondary transition-colors flex-shrink-0 ${sidebarCollapsed ? 'mx-auto' : 'ml-auto'}`}
            >
              <Icon name={sidebarCollapsed ? 'PanelLeftOpen' : 'PanelLeftClose'} size={17} />
            </button>
          </div>

          {/* Collapsed icons */}
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2 pt-4 px-2">
              {[{ id: 0, name: 'Все', color: '', icon: 'Layers' }, ...categories.map(c => ({ ...c, icon: CAT_ICONS[c.name] || 'Radio' }))].map(cat => {
                const active = cat.id === 0 ? !categoryId : categoryId === String(cat.id);
                return (
                  <button key={cat.id}
                    onClick={() => setFilter('category_id', cat.id === 0 ? '' : String(cat.id))}
                    title={cat.name}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${active ? 'border-primary/40 bg-primary/20 text-primary' : 'border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                    style={active && cat.id !== 0 ? { backgroundColor: `${cat.color}30`, borderColor: `${cat.color}60`, color: cat.color } : undefined}
                  >
                    <Icon name={cat.icon} size={16} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <FilterContent />
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="px-4 md:px-5 py-5">

          {/* Top bar */}
          <div className="flex items-center gap-3 mb-5">
            {/* Mobile filter btn */}
            <button onClick={() => setDrawerOpen(true)}
              className={`lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition-all ${
                hasFilters ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground'
              }`}>
              <Icon name="SlidersHorizontal" size={15} />
              {hasFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
            </button>

            {/* Search */}
            <form onSubmit={handleSearch} className="relative flex-1">
              <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Станция, город, частота..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); setFilter('search', ''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <Icon name="X" size={15} />
                </button>
              )}
            </form>

            {/* View toggle */}
            <div className="flex items-center bg-secondary rounded-xl p-1 flex-shrink-0">
              <button onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon name="LayoutGrid" size={16} />
              </button>
              <button onClick={() => setViewMode('row')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'row' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon name="List" size={16} />
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {search && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium border border-primary/25">
                  <Icon name="Search" size={11} />«{search}»
                  <button onClick={() => { setSearchInput(''); setFilter('search', ''); }}><Icon name="X" size={10} /></button>
                </span>
              )}
              {activeCat && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                  style={{ backgroundColor: `${activeCat.color}20`, borderColor: `${activeCat.color}50`, color: activeCat.color }}>
                  <Icon name={CAT_ICONS[activeCat.name] || 'Radio'} size={11} />{activeCat.name}
                  <button onClick={() => setFilter('category_id', '')}><Icon name="X" size={10} /></button>
                </span>
              )}
              {activeGenre && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 text-xs font-medium border border-cyan-500/25">
                  <Icon name="Music" size={11} />{activeGenre.name}
                  <button onClick={() => setFilter('genre_id', '')}><Icon name="X" size={10} /></button>
                </span>
              )}
              {sort === 'name' && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-medium border border-border">
                  <Icon name="ArrowDownAZ" size={11} />По алфавиту
                  <button onClick={() => setFilter('sort', 'listen_count')}><Icon name="X" size={10} /></button>
                </span>
              )}
            </div>
          )}

          {/* Title row */}
          <div className="flex items-baseline gap-3 mb-4">
            <h1 className="font-oswald text-xl font-bold gradient-text">
              {activeCat ? activeCat.name : 'Все станции'}
            </h1>
            <span className="text-sm text-muted-foreground">{loading ? '...' : `${total} станций`}</span>
          </div>

          {/* Grid */}
          {loading ? (
            <div className={gridClass}>
              {Array.from({ length: viewMode === 'grid' ? 12 : 8 }).map((_, i) => (
                <div key={i} className={`gradient-card animate-pulse ${viewMode === 'grid' ? 'rounded-2xl h-44' : 'rounded-xl h-16'}`} />
              ))}
            </div>
          ) : stations.length > 0 ? (
            <div className={gridClass}>
              {stations.map((station, i) => (
                <div key={station.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(i * 0.025, 0.4)}s` }}>
                  <StationCard
                    station={station}
                    isFav={favorites.includes(station.id)}
                    onFavChange={() => toggleFav(station)}
                    view={viewMode}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <Icon name="Radio" size={28} className="text-muted-foreground opacity-40" />
              </div>
              <p className="font-semibold mb-1">Ничего не найдено</p>
              <p className="text-muted-foreground text-sm mb-5">Попробуйте изменить параметры поиска</p>
              <button onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/15 text-primary border border-primary/30 text-sm font-semibold hover:bg-primary/25 transition-all">
                <Icon name="RotateCcw" size={14} />Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
