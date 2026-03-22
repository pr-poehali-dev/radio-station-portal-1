import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/lib/store';
import AudioPlayer from './AudioPlayer';

const navItems = [
  { path: '/', icon: 'Home', label: 'Главная' },
  { path: '/stations', icon: 'Radio', label: 'Станции' },
  { path: '/favorites', icon: 'Heart', label: 'Избранное' },
  { path: '/history', icon: 'History', label: 'История' },
  { path: '/profile', icon: 'User', label: 'Профиль' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex items-center h-16 gap-4">
          <Link to="/" className="flex items-center gap-2 mr-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
              <Icon name="Radio" size={16} className="text-white" />
            </div>
            <span className="font-oswald text-xl font-bold gradient-text hidden sm:block">РАДИО РФ</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-primary/20 text-primary neon-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon name={item.icon} size={16} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            <Link
              to="/donate"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:opacity-90 transition-opacity"
            >
              <Icon name="Heart" size={14} />
              Поддержать
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
              >
                <Icon name="Shield" size={14} />
                Админ
              </Link>
            )}

            {user ? (
              <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium">{user.username}</span>
              </Link>
            ) : (
              <Link to="/auth" className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                Войти
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <Icon name={mobileOpen ? 'X' : 'Menu'} size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 py-2 px-4 animate-fade-in">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === item.path
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </Link>
            ))}
            <Link
              to="/donate"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-yellow-400"
            >
              <Icon name="Heart" size={18} />
              Поддержать проект
            </Link>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 pb-32">
        {children}
      </main>

      {/* Bottom Mobile Nav */}
      <nav className="md:hidden fixed bottom-20 left-0 right-0 z-40 px-4">
        <div className="glass rounded-2xl flex items-center justify-around py-2 neon-border">
          {navItems.slice(0, 5).map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                location.pathname === item.path
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Audio Player */}
      <AudioPlayer />
    </div>
  );
}
