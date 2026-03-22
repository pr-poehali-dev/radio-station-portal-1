INSERT INTO t_p56117371_radio_station_portal.categories (name, slug, color) VALUES ('Новости', 'news', '#ef4444'), ('Музыка', 'music', '#8b5cf6'), ('Разговорное', 'talk', '#3b82f6'), ('Спорт', 'sport', '#f59e0b'), ('Детское', 'kids', '#10b981') ON CONFLICT DO NOTHING;

INSERT INTO t_p56117371_radio_station_portal.genres (name, slug) VALUES ('Поп', 'pop'), ('Рок', 'rock'), ('Джаз', 'jazz'), ('Классика', 'classical'), ('Электронная', 'electronic'), ('Хип-хоп', 'hiphop'), ('Шансон', 'chanson'), ('Народная', 'folk') ON CONFLICT DO NOTHING;

INSERT INTO t_p56117371_radio_station_portal.users (username, email, password_hash, role) VALUES ('admin', 'admin@radiorussia.ru', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMlJbpg6/k9F3YzWTEHYLlsQxu', 'admin') ON CONFLICT DO NOTHING;