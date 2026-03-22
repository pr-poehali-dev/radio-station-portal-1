import { usePlayer, useAuth } from '@/lib/store';
import { radioApi, userApi } from '@/lib/api';
import Icon from '@/components/ui/icon';
import type { Station } from '@/lib/store';

interface Props {
  station: Station;
  onFavChange?: () => void;
  isFav?: boolean;
  compact?: boolean;
}

const GRADIENTS = [
  'from-purple-600 to-blue-600',
  'from-pink-600 to-purple-600',
  'from-blue-600 to-cyan-500',
  'from-orange-500 to-red-500',
  'from-green-600 to-teal-500',
  'from-yellow-500 to-orange-500',
];

export default function StationCard({ station, onFavChange, isFav, compact }: Props) {
  const { setStation, currentStation, isPlaying, togglePlay } = usePlayer();
  const { user } = useAuth();
  const isActive = currentStation?.id === station.id;
  const gradient = GRADIENTS[station.id % GRADIENTS.length];

  const handlePlay = () => {
    if (isActive) {
      togglePlay();
    } else {
      setStation(station);
      radioApi.incrementListen(station.id, user?.id);
    }
  };

  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (isFav) {
      await userApi.removeFavorite(station.id);
    } else {
      await userApi.addFavorite(station.id);
    }
    onFavChange?.();
  };

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group ${
          isActive ? 'bg-primary/15 neon-border' : 'hover:bg-secondary/60'
        }`}
        onClick={handlePlay}
      >
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
          {station.cover_url ? (
            <img src={station.cover_url} alt={station.name} className="w-full h-full object-cover" />
          ) : (
            <Icon name="Radio" size={16} className="text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isActive ? 'text-primary' : ''}`}>{station.name}</p>
          <p className="text-xs text-muted-foreground truncate">{station.city} {station.frequency && `· ${station.frequency}`}</p>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {user && (
            <button onClick={handleFav} className={isFav ? 'text-pink-400' : 'text-muted-foreground hover:text-pink-400'}>
              <Icon name="Heart" size={14} />
            </button>
          )}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive && isPlaying ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground'}`}>
            <Icon name={isActive && isPlaying ? 'Pause' : 'Play'} size={14} />
          </div>
        </div>
        {isActive && isPlaying && (
          <div className="flex gap-0.5 ml-1 opacity-100">
            {[1,2,3].map(i => (
              <div key={i} className="wave-bar w-0.5 bg-primary rounded-full" style={{ height: '12px', animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`group relative gradient-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
        isActive ? 'neon-border' : 'hover:border-primary/30'
      }`}
      onClick={handlePlay}
    >
      {/* Cover */}
      <div className={`relative h-36 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        {station.cover_url ? (
          <img src={station.cover_url} alt={station.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-70">
            <Icon name="Radio" size={36} className="text-white" />
          </div>
        )}

        {/* Overlay play button */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-primary neon-glow' : 'bg-white/20 backdrop-blur-sm'}`}>
            {isActive && isPlaying ? (
              <div className="flex gap-1 items-end h-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="wave-bar w-1 bg-white rounded-full" style={{ height: '20px', animationDelay: `${i * 0.12}s` }} />
                ))}
              </div>
            ) : (
              <Icon name="Play" size={22} className="text-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Featured badge */}
        {station.is_featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-semibold">
            <Icon name="Star" size={10} />
            Топ
          </div>
        )}

        {/* Category badge */}
        {station.category_name && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium text-white"
               style={{ backgroundColor: `${station.category_color || '#8b5cf6'}66` }}>
            {station.category_name}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-primary' : ''}`}>{station.name}</h3>
            {station.city && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {station.city}{station.frequency ? ` · ${station.frequency}` : ''}
              </p>
            )}
          </div>
          {user && (
            <button
              onClick={handleFav}
              className={`flex-shrink-0 p-1.5 rounded-lg transition-all hover:bg-secondary ${isFav ? 'text-pink-400' : 'text-muted-foreground hover:text-pink-400'}`}
            >
              <Icon name="Heart" size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2">
          {station.genre_name && (
            <span className="text-xs text-muted-foreground">
              {station.genre_name}
            </span>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <Icon name="Headphones" size={12} />
            <span>{station.listen_count?.toLocaleString('ru')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
