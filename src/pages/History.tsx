import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '@/lib/api';
import { useAuth, usePlayer } from '@/lib/store';
import Icon from '@/components/ui/icon';
import type { Station } from '@/lib/store';

interface HistoryEntry {
  id: number;
  listened_at: string;
  duration_seconds: number;
  station: Station & { stream_url: string };
}

const GRADIENTS = ['from-purple-600 to-blue-600', 'from-pink-600 to-purple-600', 'from-blue-600 to-cyan-500', 'from-orange-500 to-red-500'];

export default function History() {
  const { user } = useAuth();
  const { setStation } = usePlayer();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user) return;
    userApi.getHistory().then(r => {
      if (r.ok) {
        setHistory(r.data.history || []);
        setTotal(r.data.total || 0);
      }
      setLoading(false);
    });
  }, [user]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const formatDuration = (secs: number) => {
    if (!secs) return '';
    if (secs < 60) return `${secs} с`;
    return `${Math.floor(secs / 60)} мин`;
  };

  if (!user) {
    return (
      <div className="container py-20 text-center animate-fade-in">
        <Icon name="History" size={56} className="text-muted-foreground mx-auto mb-4 opacity-30" />
        <h2 className="font-oswald text-2xl font-bold mb-2">Войдите в аккаунт</h2>
        <p className="text-muted-foreground mb-6">История сохраняется только для авторизованных пользователей</p>
        <Link to="/auth" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90">
          Войти
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-6 animate-fade-in">
      <h1 className="font-oswald text-3xl font-bold gradient-text mb-1 flex items-center gap-2">
        <Icon name="History" size={28} className="text-cyan-400" />
        История
      </h1>
      <p className="text-muted-foreground text-sm mb-6">{total} прослушиваний</p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 gradient-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-1">
          {history.map((entry, i) => {
            const s = entry.station;
            const grad = GRADIENTS[s.id % GRADIENTS.length];
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-all group animate-fade-in cursor-pointer"
                style={{ animationDelay: `${i * 0.04}s` }}
                onClick={() => setStation(s)}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                  {s.cover_url ? (
                    <img src={s.cover_url} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="Radio" size={16} className="text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.city}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">{formatDate(entry.listened_at)}</p>
                  {entry.duration_seconds > 0 && (
                    <p className="text-xs text-primary">{formatDuration(entry.duration_seconds)}</p>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  <Icon name="Play" size={14} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="History" size={40} className="text-cyan-400 opacity-50" />
          </div>
          <h3 className="font-oswald text-xl font-bold mb-2">История пуста</h3>
          <p className="text-muted-foreground mb-6">Начните слушать радио, история появится здесь</p>
          <Link to="/stations" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90">
            Выбрать станцию
          </Link>
        </div>
      )}
    </div>
  );
}
