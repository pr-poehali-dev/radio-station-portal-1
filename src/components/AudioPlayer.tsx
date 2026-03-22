import { useEffect, useRef, useState } from 'react';
import { usePlayer, useAuth } from '@/lib/store';
import { userApi } from '@/lib/api';
import Icon from '@/components/ui/icon';

export default function AudioPlayer() {
  const { currentStation, isPlaying, volume, togglePlay, setVolume, setStation } = usePlayer();
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [loading, setLoading] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [listenTimer, setListenTimer] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentStation) return;

    setLoading(true);
    audio.src = currentStation.stream_url;
    if (isPlaying) {
      audio.play().then(() => setLoading(false)).catch(() => setLoading(false));
    } else {
      audio.pause();
    }
  }, [currentStation]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => {});
      timerRef.current = setInterval(() => setListenTimer(t => t + 1), 1000);
    } else {
      audio.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      if (listenTimer > 10 && user && currentStation) {
        userApi.addHistory(currentStation.id, listenTimer);
        setListenTimer(0);
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying]);

  useEffect(() => {
    if (!user || !currentStation) return;
    userApi.getFavorites().then(res => {
      if (res.ok) {
        const favIds = res.data.favorites?.map((f: { id: number }) => f.id) || [];
        setIsFav(favIds.includes(currentStation.id));
      }
    });
  }, [currentStation, user]);

  const toggleFav = async () => {
    if (!user || !currentStation) return;
    if (isFav) {
      await userApi.removeFavorite(currentStation.id);
      setIsFav(false);
    } else {
      await userApi.addFavorite(currentStation.id);
      setIsFav(true);
    }
  };

  if (!currentStation) return null;

  const colors = ['from-purple-600 to-cyan-500', 'from-pink-600 to-purple-600', 'from-blue-600 to-cyan-500', 'from-orange-500 to-pink-500'];
  const colorClass = colors[currentStation.id % colors.length];

  return (
    <div className="player-bar fixed bottom-0 left-0 right-0 z-50 px-4 py-3">
      <audio ref={audioRef} onCanPlay={() => setLoading(false)} />

      <div className="max-w-7xl mx-auto flex items-center gap-3 md:gap-6">
        {/* Cover */}
        <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
          {currentStation.cover_url ? (
            <img src={currentStation.cover_url} alt={currentStation.name} className="w-full h-full object-cover" />
          ) : (
            <Icon name="Radio" size={20} className="text-white" />
          )}
          {isPlaying && !loading && (
            <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="wave-bar w-0.5 bg-white/80 rounded-full"
                  style={{ height: '12px', animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm md:text-base truncate">{currentStation.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {currentStation.city}{currentStation.frequency ? ` · ${currentStation.frequency}` : ''}
            {currentStation.genre_name ? ` · ${currentStation.genre_name}` : ''}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          {user && (
            <button
              onClick={toggleFav}
              className={`p-2 rounded-lg transition-all ${isFav ? 'text-pink-400' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon name={isFav ? 'HeartFill' : 'Heart'} fallback="Heart" size={18} />
            </button>
          )}

          <button
            onClick={togglePlay}
            disabled={loading}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 flex items-center justify-center hover:opacity-90 transition-all neon-glow disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Icon name={isPlaying ? 'Pause' : 'Play'} size={18} className="text-white" />
            )}
          </button>

          {/* Volume */}
          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => setVolume(volume === 0 ? 0.8 : 0)} className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name={volume === 0 ? 'VolumeX' : 'Volume2'} size={18} />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Listens */}
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
            <Icon name="Headphones" size={14} />
            <span>{currentStation.listen_count?.toLocaleString('ru')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
