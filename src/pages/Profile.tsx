import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/store';
import Icon from '@/components/ui/icon';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user) {
      authApi.me().then(r => {
        if (r.ok) setUser(r.data.user);
        else navigate('/auth');
      });
    }
  }, []);

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    navigate('/');
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await authApi.updateProfile({ username });
    if (res.ok) {
      setUser({ ...user!, username });
      setEditing(false);
      setMsg('Имя обновлено!');
      setTimeout(() => setMsg(''), 3000);
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="container py-20 text-center animate-fade-in">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const avatarLetter = user.username[0].toUpperCase();

  return (
    <div className="container py-6 max-w-2xl animate-fade-in">
      <h1 className="font-oswald text-3xl font-bold gradient-text mb-6">Профиль</h1>

      {/* Avatar + name */}
      <div className="gradient-card rounded-2xl p-6 mb-4 neon-border">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white neon-glow flex-shrink-0">
            {avatarLetter}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex gap-2">
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  autoFocus
                />
                <button onClick={handleSave} disabled={loading} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                  {loading ? '...' : 'OK'}
                </button>
                <button onClick={() => { setEditing(false); setUsername(user.username); }} className="px-3 py-2 rounded-lg bg-secondary text-sm">
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-oswald text-2xl font-bold truncate">{user.username}</h2>
                <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name="Pencil" size={14} />
                </button>
              </div>
            )}
            <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
            {user.role === 'admin' && (
              <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold">
                <Icon name="Shield" size={12} />
                Администратор
              </span>
            )}
          </div>
        </div>
        {msg && <p className="mt-3 text-green-400 text-sm flex items-center gap-1"><Icon name="Check" size={14} />{msg}</p>}
      </div>

      {/* Links */}
      <div className="gradient-card rounded-2xl overflow-hidden mb-4">
        {[
          { to: '/favorites', icon: 'Heart', label: 'Избранное', color: 'text-pink-400' },
          { to: '/history', icon: 'History', label: 'История прослушивания', color: 'text-cyan-400' },
          { to: '/donate', icon: 'Gift', label: 'Поддержать проект', color: 'text-yellow-400' },
          { to: '/terms', icon: 'FileText', label: 'Пользовательское соглашение', color: 'text-muted-foreground' },
        ].map((item, i) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 px-5 py-4 hover:bg-secondary/50 transition-colors ${i > 0 ? 'border-t border-border/50' : ''}`}
          >
            <Icon name={item.icon} size={18} className={item.color} />
            <span className="text-sm font-medium">{item.label}</span>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground ml-auto" />
          </Link>
        ))}
        {user.role === 'admin' && (
          <Link to="/admin" className="flex items-center gap-3 px-5 py-4 hover:bg-secondary/50 transition-colors border-t border-border/50">
            <Icon name="Shield" size={18} className="text-red-400" />
            <span className="text-sm font-medium">Панель администратора</span>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground ml-auto" />
          </Link>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors text-sm font-semibold"
      >
        <Icon name="LogOut" size={16} />
        Выйти из аккаунта
      </button>
    </div>
  );
}
