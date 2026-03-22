import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { radioApi } from '@/lib/api';
import StationCard from '@/components/StationCard';
import Icon from '@/components/ui/icon';
import type { Station } from '@/lib/store';

interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  image_url?: string;
  link_url?: string;
}

interface Category {
  id: number;
  name: string;
  color: string;
}

export default function Home() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [popular, setPopular] = useState<Station[]>([]);
  const [featured, setFeatured] = useState<Station[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    radioApi.getSlider().then(r => { if (r.ok) setBanners(r.data.banners || []); });
    radioApi.getPopular(8).then(r => { if (r.ok) setPopular(r.data.stations || []); });
    radioApi.getStations({ sort: 'listen_count', limit: '8' }).then(r => { if (r.ok) setFeatured(r.data.stations?.filter((s: Station) => s.is_featured) || []); });
    radioApi.getCategories().then(r => { if (r.ok) setCategories(r.data.categories || []); });
  }, []);

  useEffect(() => {
    if (!banners.length) return;
    const t = setInterval(() => setSlideIdx(i => (i + 1) % banners.length), 4000);
    return () => clearInterval(t);
  }, [banners.length]);

  const SLIDE_GRADIENTS = [
    'from-purple-900/80 via-blue-900/60 to-cyan-900/40',
    'from-pink-900/80 via-purple-900/60 to-blue-900/40',
    'from-orange-900/80 via-red-900/60 to-purple-900/40',
  ];

  const CAT_ICONS: Record<string, string> = {
    'Новости': 'Newspaper',
    'Музыка': 'Music',
    'Разговорное': 'MessageSquare',
    'Спорт': 'Trophy',
    'Детское': 'Star',
  };

  return (
    <div className="container py-6 space-y-10 animate-fade-in">

      {/* Hero Slider */}
      {banners.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden h-48 md:h-72 neon-border">
          {banners.map((banner, idx) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ${idx === slideIdx ? 'opacity-100' : 'opacity-0'}`}
            >
              {banner.image_url ? (
                <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-r ${SLIDE_GRADIENTS[idx % SLIDE_GRADIENTS.length]}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-10">
                <h1 className="font-oswald text-2xl md:text-4xl font-bold text-white leading-tight">{banner.title}</h1>
                {banner.subtitle && (
                  <p className="text-white/80 mt-1 text-sm md:text-base">{banner.subtitle}</p>
                )}
                <Link to="/stations" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 backdrop-blur-sm text-white text-sm font-semibold hover:bg-white/25 transition-colors w-fit">
                  <Icon name="Radio" size={16} />
                  Слушать сейчас
                </Link>
              </div>
            </div>
          ))}

          {/* Dots */}
          <div className="absolute bottom-4 right-4 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === slideIdx ? 'bg-white w-6' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <section>
        <h2 className="font-oswald text-xl font-bold mb-4 flex items-center gap-2">
          <Icon name="Grid" size={20} className="text-primary" />
          Категории
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/stations?category_id=${cat.id}`}
              className={`group flex items-center gap-3 p-3 rounded-xl gradient-card hover:scale-105 transition-all duration-200 animate-fade-in stagger-${Math.min(i+1, 5)}`}
              style={{ borderColor: `${cat.color}40` }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                   style={{ backgroundColor: `${cat.color}33`, border: `1px solid ${cat.color}60` }}>
                <Icon name={CAT_ICONS[cat.name] || 'Radio'} size={18} style={{ color: cat.color }} />
              </div>
              <span className="font-semibold text-sm">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-oswald text-xl font-bold flex items-center gap-2">
            <Icon name="TrendingUp" size={20} className="text-primary" />
            Популярные
          </h2>
          <Link to="/stations?sort=listen_count" className="text-sm text-primary hover:underline flex items-center gap-1">
            Все <Icon name="ChevronRight" size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {popular.map((station, i) => (
            <div key={station.id} className={`animate-fade-in stagger-${Math.min(i+1, 5)}`}>
              <StationCard
                station={station}
                isFav={favorites.includes(station.id)}
                onFavChange={() => setFavorites(f => f.includes(station.id) ? f.filter(id => id !== station.id) : [...f, station.id])}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section>
          <h2 className="font-oswald text-xl font-bold mb-4 flex items-center gap-2">
            <Icon name="Star" size={20} className="text-yellow-400" />
            Рекомендуем
          </h2>
          <div className="space-y-1">
            {featured.slice(0, 6).map(station => (
              <StationCard key={station.id} station={station} compact isFav={favorites.includes(station.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Donate CTA */}
      <section>
        <Link to="/donate" className="block rounded-2xl overflow-hidden neon-border group hover:scale-[1.01] transition-all">
          <div className="relative p-6 md:p-8 bg-gradient-to-r from-yellow-600/20 via-orange-600/20 to-red-600/20">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/5 to-red-600/5" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Icon name="Heart" size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-oswald text-xl font-bold">Поддержите проект</h3>
                <p className="text-sm text-muted-foreground mt-1">Помогите нам развивать лучший радиосервис России</p>
              </div>
              <div className="ml-auto hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold text-sm">
                Поддержать <Icon name="ArrowRight" size={16} />
              </div>
            </div>
          </div>
        </Link>
      </section>

    </div>
  );
}
