import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '@/lib/api';
import { useAuth } from '@/lib/store';
import StationCard from '@/components/StationCard';
import Icon from '@/components/ui/icon';
import type { Station } from '@/lib/store';

type ViewMode = 'grid' | 'row';

export default function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const load = () => {
    if (!user) return;
    setLoading(true);
    userApi.getFavorites().then(r => {
      if (r.ok) setFavorites(r.data.favorites || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [user]);

  const toggleFav = async (station: Station) => {
    await userApi.removeFavorite(station.id);
    setFavorites(f => f.filter(s => s.id !== station.id));
  };

  if (!user) {
    return (
      <div className="container py-20 text-center animate-fade-in">
        <Icon name="Heart" size={56} className="text-muted-foreground mx-auto mb-4 opacity-30" />
        <h2 className="font-oswald text-2xl font-bold mb-2">Войдите в аккаунт</h2>
        <p className="text-muted-foreground mb-6">Чтобы сохранять избранные станции</p>
        <Link to="/auth" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
          Войти
        </Link>
      </div>
    );
  }

  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3'
    : 'flex flex-col gap-2';

  return (
    <div className="container py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-oswald text-2xl md:text-3xl font-bold gradient-text flex items-center gap-2">
          <Icon name="Heart" size={26} className="text-pink-400" />Избранное
        </h1>
        <div className="flex items-center gap-2">
          {favorites.length > 0 && <span className="text-sm text-muted-foreground">{favorites.length}</span>}
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
        </div>
      </div>

      {loading ? (
        <div className={gridClass}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`gradient-card animate-pulse ${viewMode === 'grid' ? 'rounded-2xl h-44' : 'rounded-xl h-16'}`} />
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className={gridClass}>
          {favorites.map((station, i) => (
            <div key={station.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
              <StationCard station={station} isFav onFavChange={() => toggleFav(station)} view={viewMode} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="Heart" size={40} className="text-pink-400 opacity-50" />
          </div>
          <h3 className="font-oswald text-xl font-bold mb-2">Пока пусто</h3>
          <p className="text-muted-foreground mb-6">Добавляйте станции в избранное во время прослушивания</p>
          <Link to="/stations" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Найти станции
          </Link>
        </div>
      )}
    </div>
  );
}