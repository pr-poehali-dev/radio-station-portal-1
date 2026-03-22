import Icon from '@/components/ui/icon';

interface Analytics {
  total_stations: number;
  total_users: number;
  total_listens: number;
  week_listens: number;
  top_stations: { name: string; listen_count: number; cover_url?: string }[];
  recent_users: { username: string; email: string; created_at: string; role: string }[];
}

interface Props {
  analytics: Analytics;
}

export default function AdminAnalytics({ analytics }: Props) {
  return (
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
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Icon name="TrendingUp" size={16} className="text-primary" />Топ-5 станций
          </h3>
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
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Icon name="UserPlus" size={16} className="text-cyan-400" />Новые пользователи
          </h3>
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
                {u.role === 'admin' && (
                  <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">admin</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
