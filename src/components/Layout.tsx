import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/lib/store';
import AudioPlayer from './AudioPlayer';

const navItems = [
  { path: '/', icon: 'Home', label: 'Главная' },
  { path: '/stations', icon: 'Radio', label: 'Радиостанции' },
  { path: '/favorites', icon: 'Heart', label: 'Избранное' },
  { path: '/history', icon: 'History', label: 'История' },
  { path: '/profile', icon: 'User', label: 'Профиль' },
];

const bottomItems = [
  { path: '/donate', icon: 'HeartHandshake', label: 'Поддержать', accent: true },
  { path: '/terms', icon: 'FileText', label: 'Соглашение', accent: false },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300
          w-64 bg-[hsl(222,25%,7%)] border-r border-border/50
          md:translate-x-0 md:static md:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border/50 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center neon-glow flex-shrink-0">
            <Icon name="Radio" size={18} className="text-white" />
          </div>
          <div>
            <span className="font-oswald text-lg font-bold gradient-text">РАДИО РФ</span>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Радиостанции России</p>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                ${isActive(item.path)
                  ? 'bg-primary/15 text-primary border border-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0
                ${isActive(item.path) ? 'bg-primary/20' : 'bg-secondary/50 group-hover:bg-secondary'}`}>
                <Icon name={item.icon} size={16} />
              </div>
              <span className="flex-1">{item.label}</span>
              {isActive(item.path) && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              )}
            </Link>
          ))}

          {user?.role === 'admin' && (
            <>
              <div className="px-3 pt-4 pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Управление</p>
              </div>
              <Link
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                  ${isActive('/admin')
                    ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                    : 'text-muted-foreground hover:text-red-400 hover:bg-red-500/10'
                  }`}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 group-hover:bg-red-500/20 transition-all flex-shrink-0">
                  <Icon name="Shield" size={16} className="text-red-400" />
                </div>
                Панель Admin
              </Link>
            </>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-3 space-y-0.5 border-t border-border/50 pt-3 flex-shrink-0">
          {bottomItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${item.accent
                  ? 'text-yellow-400 hover:bg-yellow-500/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.accent ? 'bg-yellow-500/10' : 'bg-secondary/50'}`}>
                <Icon name={item.icon} size={16} />
              </div>
              {item.label}
            </Link>
          ))}

          {/* User */}
          <div className="pt-2 mt-1 border-t border-border/30">
            {user ? (
              <Link to="/profile" onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/70 transition-all">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {user.username[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user.username}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </Link>
            ) : (
              <Link to="/auth" onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/15 border border-primary/25 hover:bg-primary/20 transition-all">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="LogIn" size={16} className="text-primary" />
                </div>
                <span className="text-sm font-semibold text-primary">Войти</span>
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top header (mobile only) */}
        <header className="sticky top-0 z-30 glass border-b border-border/50 md:hidden">
          <div className="flex items-center h-14 px-4 gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <Icon name="Menu" size={20} />
            </button>
            <Link to="/" className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                <Icon name="Radio" size={14} className="text-white" />
              </div>
              <span className="font-oswald text-lg font-bold gradient-text">РАДИО РФ</span>
            </Link>
            {!user ? (
              <Link to="/auth" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground">
                Войти
              </Link>
            ) : (
              <Link to="/profile" className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                {user.username[0].toUpperCase()}
              </Link>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-28 md:pb-24 overflow-x-hidden">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-20 left-0 right-0 z-30 px-3">
          <div className="glass rounded-2xl flex items-center justify-around py-1.5 neon-border">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-0
                  ${isActive(item.path) ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon name={item.icon} size={20} />
                <span className="text-[9px] font-medium">{item.label.split(' ')[0]}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Audio Player */}
      <AudioPlayer />
    </div>
  );
}
