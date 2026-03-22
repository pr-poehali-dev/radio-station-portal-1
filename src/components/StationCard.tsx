import { usePlayer, useAuth } from '@/lib/store';
import { radioApi, userApi } from '@/lib/api';
import Icon from '@/components/ui/icon';
import type { Station } from '@/lib/store';

interface Props {
  station: Station;
  onFavChange?: () => void;
  isFav?: boolean;
  compact?: boolean;
  view?: 'grid' | 'row';
}

const GRADIENTS = [
  'from-purple-600 to-blue-600',
  'from-pink-600 to-purple-600',
  'from-blue-600 to-cyan-500',
  'from-orange-500 to-red-500',
  'from-green-600 to-teal-500',
  'from-yellow-500 to-orange-500',
];

export default function StationCard({ station, onFavChange, isFav, compact, view = 'grid' }: Props) {
  const { setStation, currentStation, isPlaying, togglePlay } = usePlayer();
  const { user } = useAuth();
  const isActive = currentStation?.id === station.id;
  const gradient = GRADIENTS[station.id % GRADIENTS.length];

  const handlePlay = () => {
    if (isActive) togglePlay();
    else {
      setStation(station);
      radioApi.incrementListen(station.id, user?.id);
    }
  };

  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (isFav) await userApi.removeFavorite(station.id);
    else await userApi.addFavorite(station.id);
    onFavChange?.();
  };

  /* ── compact list row (used in sidebar / history) ── */
  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group ${
          isActive ? 'bg-primary/15 neon-border' : 'hover:bg-secondary/60'
        }`}
        onClick={handlePlay}
      >
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex-shrink-0 overflow-hidden flex items-center justify-center`}>
          {station.cover_url
            ? <img src={station.cover_url} alt={station.name} className="w-full h-full object-cover" />
            : <Icon name="Radio" size={16} className="text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isActive ? 'text-primary' : ''}`}>{station.name}</p>
          <p className="text-xs text-muted-foreground truncate">{station.city}{station.frequency ? ` · ${station.frequency}` : ''}</p>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {user && (
            <button onClick={handleFav} className={isFav ? 'text-pink-400' : 'text-muted-foreground hover:text-pink-400'}>
              <Icon name="Heart" size={14} />
            </button>
          )}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive && isPlaying ? 'bg-primary/20 text-primary' : 'bg-secondary'}`}>
            <Icon name={isActive && isPlaying ? 'Pause' : 'Play'} size={14} />
          </div>
        </div>
        {isActive && isPlaying && (
          <div className="flex gap-0.5 items-end h-4 ml-1">
            {[1,2,3].map(i => (
              <div key={i} className="wave-bar w-0.5 bg-primary rounded-full h-3" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── row view: horizontal card ── */
  if (view === 'row') {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer group border ${
          isActive ? 'bg-primary/10 border-primary/30' : 'gradient-card hover:border-primary/20 hover:bg-secondary/40'
        }`}
        onClick={handlePlay}
      >
        {/* Cover */}
        <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex-shrink-0 overflow-hidden flex items-center justify-center`}>
          {station.cover_url
            ? <img src={station.cover_url} alt={station.name} className="w-full h-full object-cover" />
            : <Icon name="Radio" size={20} className="text-white/80" />}
          {isActive && isPlaying && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex gap-0.5 items-end h-5">
                {[1,2,3].map(i => (
                  <div key={i} className="wave-bar w-0.5 bg-white rounded-full h-4" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {station.is_featured && <Icon name="Star" size={11} className="text-yellow-400 flex-shrink-0" />}
            <p className={`text-sm font-semibold truncate ${isActive ? 'text-primary' : ''}`}>{station.name}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {station.city && <span className="truncate">{station.city}</span>}
            {station.frequency && <span className="flex-shrink-0">· {station.frequency}</span>}
            {station.genre_name && <span className="hidden sm:block truncate">· {station.genre_name}</span>}
          </div>
        </div>

        {/* Category chip */}
        {station.category_name && (
          <span className="hidden md:block text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{ backgroundColor: `${station.category_color || '#8b5cf6'}25`, color: station.category_color || '#8b5cf6' }}>
            {station.category_name}
          </span>
        )}

        {/* Listen count */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
          <Icon name="Headphones" size={12} />
          {station.listen_count?.toLocaleString('ru')}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {user && (
            <button
              onClick={handleFav}
              className={`p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${isFav ? 'text-pink-400 opacity-100' : 'text-muted-foreground hover:text-pink-400'}`}
            >
              <Icon name="Heart" size={14} />
            </button>
          )}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            isActive ? 'bg-primary text-white' : 'bg-secondary group-hover:bg-primary/20 group-hover:text-primary'
          }`}>
            <Icon name={isActive && isPlaying ? 'Pause' : 'Play'} size={16} />
          </div>
        </div>
      </div>
    );
  }

  /* ── grid view: vertical card ── */
  return (
    <div
      className={`group relative gradient-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/10 ${
        isActive ? 'neon-border' : 'hover:border-primary/25'
      }`}
      onClick={handlePlay}
    >
      {/* Cover */}
      <div className={`relative h-32 bg-gradient-to-br ${gradient} overflow-hidden`}>
        {station.cover_url
          ? <img src={station.cover_url} alt={station.name} className="w-full h-full object-cover" />
          : (
            <div className="w-full h-full flex items-center justify-center opacity-60">
              <Icon name="Radio" size={32} className="text-white" />
            </div>
          )}

        {/* Play overlay */}
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-primary shadow-lg shadow-primary/50' : 'bg-white/20 backdrop-blur-sm'}`}>
            {isActive && isPlaying ? (
              <div className="flex gap-0.5 items-end h-5">
                {[1,2,3,4].map(i => (
                  <div key={i} className="wave-bar w-0.5 bg-white rounded-full h-4" style={{ animationDelay: `${i * 0.12}s` }} />
                ))}
              </div>
            ) : (
              <Icon name="Play" size={20} className="text-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {station.is_featured && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-500/25 border border-yellow-500/40 text-yellow-300 text-[10px] font-semibold">
              <Icon name="Star" size={9} />Топ
            </span>
          )}
        </div>
        {station.category_name && (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white"
            style={{ backgroundColor: `${station.category_color || '#8b5cf6'}66` }}>
            {station.category_name}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start gap-2 justify-between">
          <h3 className={`font-semibold text-sm leading-snug line-clamp-1 flex-1 ${isActive ? 'text-primary' : ''}`}>
            {station.name}
          </h3>
          {user && (
            <button
              onClick={handleFav}
              className={`flex-shrink-0 p-1 rounded-lg transition-all hover:bg-secondary ${isFav ? 'text-pink-400' : 'text-muted-foreground hover:text-pink-400'}`}
            >
              <Icon name="Heart" size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs text-muted-foreground truncate">
            {station.city || station.genre_name || '—'}
            {station.frequency ? ` · ${station.frequency}` : ''}
          </p>
          <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground flex-shrink-0 ml-1">
            <Icon name="Headphones" size={11} />
            <span>{station.listen_count?.toLocaleString('ru') || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
