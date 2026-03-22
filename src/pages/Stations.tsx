import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { radioApi, userApi } from '@/lib/api';
import StationCard from '@/components/StationCard';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/lib/store';
import type { Station } from '@/lib/store';

interface Category { id: number; name: string; color: string; }
interface Genre { id: number; name: string; }

export default function Stations() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('search') || '');
  const [searchInput, setSearchInput] = useState(params.get('search') || '');

  const categoryId = params.get('category_id') || '';
  const genreId = params.get('genre_id') || '';
  const sort = params.get('sort') || 'listen_count';

  const load = useCallback(async () => {
    setLoading(true);
    const p: Record<string, string> = { sort, limit: '50' };
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

  useEffect(() => {
    load();
  }, [load]);

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
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setFilter('search', searchInput);
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

  return (
    <div className="container py-6">
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 className="font-oswald text-3xl font-bold gradient-text">Радиостанции</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} станций доступно</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Поиск по названию, городу..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          {searchInput && (
            <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setFilter('search', ''); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <Icon name="X" size={16} />
            </button>
          )}
        </form>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Sort */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('sort', 'listen_count')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sort === 'listen_count' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              По популярности
            </button>
            <button
              onClick={() => setFilter('sort', 'name')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sort === 'name' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              По алфавиту
            </button>
          </div>

          <div className="w-px bg-border self-stretch" />

          {/* Categories */}
          <button
            onClick={() => setFilter('category_id', '')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!categoryId ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
          >
            Все
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilter('category_id', categoryId === String(cat.id) ? '' : String(cat.id))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${categoryId === String(cat.id) ? 'text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
              style={categoryId === String(cat.id) ? { backgroundColor: cat.color } : undefined}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Genre Tags */}
        <div className="flex flex-wrap gap-1.5">
          {genres.map(g => (
            <button
              key={g.id}
              onClick={() => setFilter('genre_id', genreId === String(g.id) ? '' : String(g.id))}
              className={`px-2.5 py-1 rounded-full text-xs transition-all ${genreId === String(g.id) ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-secondary/50 text-muted-foreground hover:text-foreground border border-transparent'}`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="gradient-card rounded-2xl h-44 animate-pulse" />
            ))}
          </div>
        ) : stations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {stations.map((station, i) => (
              <div key={station.id} className={`animate-fade-in`} style={{ animationDelay: `${i * 0.04}s` }}>
                <StationCard
                  station={station}
                  isFav={favorites.includes(station.id)}
                  onFavChange={() => toggleFav(station)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Icon name="Radio" size={48} className="text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground">Станции не найдены</p>
            <button onClick={() => { setSearchInput(''); setSearch(''); setParams(new URLSearchParams()); }} className="mt-3 text-primary text-sm hover:underline">
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
