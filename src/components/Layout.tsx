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
];

const secondaryItems = [
  { path: '/donate', icon: 'HeartHandshake', label: 'Поддержать' },
  { path: '/terms', icon: 'FileText', label: 'Соглашение' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const NavLink = ({ path, icon, label, accent }: { path: string; icon: string; label: string; accent?: boolean }) => {
    const active = isActive(path);
    return (
      <Link
        to={path}
        onClick={() => setSidebarOpen(false)}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative ${
          active
            ? accent ? 'bg-red-500/10 text-red-400' : 'bg-white/8 text-white'
            : accent ? 'text-muted-foreground hover:text-red-400 hover:bg-red-500/8' : 'text-muted-foreground hover:text-white hover:bg-white/5'
        }`}
      >
        {active && !accent && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
        )}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
          active
            ? accent ? 'bg-red-500/15 text-red-400' : 'bg-primary/20 text-primary'
            : accent ? 'bg-transparent text-muted-foreground group-hover:text-red-400' : 'bg-transparent text-muted-foreground group-hover:bg-white/8 group-hover:text-white'
        }`}>
          <Icon name={icon} size={16} />
        </div>
        <span className="flex-1 truncate">{label}</span>
        {active && !accent && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
      </Link>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
          <Icon name="Radio" size={18} className="text-white" />
        </div>
        <div>
          <span className="font-oswald text-lg font-bold gradient-text tracking-wide">РАДИО РФ</span>
          <p className="text-[10px] text-muted-foreground/70 -mt-0.5">Радиостанции России</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/5 flex-shrink-0" />

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">Меню</p>
        {navItems.map(item => <NavLink key={item.path} {...item} />)}

        {/* Profile */}
        <div className="pt-2">
          <NavLink path="/profile" icon="User" label="Профиль" />
        </div>

        {user?.role === 'admin' && (
          <div className="pt-4">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">Управление</p>
            <NavLink path="/admin" icon="Shield" label="Панель Admin" accent />
          </div>
        )}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/5 flex-shrink-0" />

      {/* Secondary links */}
      <div className="px-3 py-3 space-y-0.5 flex-shrink-0">
        {secondaryItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            <Icon name={item.icon} size={14} className="flex-shrink-0" />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/5 flex-shrink-0" />

      {/* User block */}
      <div className="p-3 flex-shrink-0">
        {user ? (
          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-md">
              {user.username[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-foreground">{user.username}</p>
              <p className="text-[10px] text-muted-foreground/70 truncate">{user.email}</p>
            </div>
            <Icon name="ChevronRight" size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
          </Link>
        ) : (
          <Link
            to="/auth"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Icon name="LogIn" size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Войти</p>
              <p className="text-[10px] text-muted-foreground/70">или зарегистрироваться</p>
            </div>
          </Link>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out
          w-64 bg-[hsl(222,25%,7%)] border-r border-white/[0.06]
          md:translate-x-0 md:static md:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 md:hidden" style={{ background: 'rgba(10,11,20,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center h-14 px-4 gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <Icon name="Menu" size={18} />
            </button>
            <Link to="/" className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                <Icon name="Radio" size={13} className="text-white" />
              </div>
              <span className="font-oswald text-base font-bold gradient-text tracking-wide">РАДИО РФ</span>
            </Link>
            {!user ? (
              <Link to="/auth" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground">
                Войти
              </Link>
            ) : (
              <Link to="/profile" className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                {user.username[0].toUpperCase()}
              </Link>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-24 overflow-x-hidden">
          {children}
        </main>
      </div>

      <AudioPlayer />
    </div>
  );
}
