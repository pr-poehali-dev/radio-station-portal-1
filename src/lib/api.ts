const BASE = 'https://functions.poehali.dev';
const FN: Record<string, string> = {
  auth:  `${BASE}/170a245f-0cc7-4b10-8c9e-285f70156ada`,
  radio: `${BASE}/a0e8b282-ca0f-4422-87ae-f7537bb1a301`,
  user:  `${BASE}/807f84ae-33a0-4832-ad5e-b0b2580dbec1`,
  admin: `${BASE}/eebc36f7-c7ef-44f4-9fb7-b97e5fa9b428`,
};

function getSession() {
  return localStorage.getItem('session_id') || '';
}

async function call(
  fn: string,
  action: string,
  method = 'GET',
  body?: unknown,
  extra?: Record<string, string>
) {
  try {
    const q = new URLSearchParams({ action, ...extra });
    const headers: Record<string, string> = { 'X-Session-Id': getSession() };
    if (body) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${FN[fn]}/?${q}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    try {
      const raw = await res.text();
      // Функции иногда возвращают double-encoded JSON — разворачиваем
      let data = JSON.parse(raw);
      if (typeof data === 'string') data = JSON.parse(data);
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: res.ok, status: res.status, data: {} };
    }
  } catch (e) {
    console.error('API error', fn, action, e);
    return { ok: false, status: 0, data: { error: 'Нет соединения с сервером' } };
  }
}

export const authApi = {
  register: (body: { username: string; email: string; password: string }) =>
    call('auth', 'register', 'POST', body),
  login: (body: { email: string; password: string }) =>
    call('auth', 'login', 'POST', body),
  logout: () => call('auth', 'logout', 'POST'),
  me: () => call('auth', 'me', 'GET'),
  updateProfile: (body: { username: string }) =>
    call('auth', 'profile', 'PUT', body),
  resetAdmin: () => call('auth', 'reset_admin', 'POST'),
};

export const radioApi = {
  getStations: (params?: Record<string, string>) =>
    call('radio', 'list', 'GET', undefined, params),
  getPopular: (limit = 8) =>
    call('radio', 'popular', 'GET', undefined, { limit: String(limit) }),
  getStation: (id: number) =>
    call('radio', 'station', 'GET', undefined, { id: String(id) }),
  getCategories: () => call('radio', 'categories'),
  getGenres: () => call('radio', 'genres'),
  getSlider: () => call('radio', 'slider'),
  incrementListen: (station_id: number, user_id?: number) =>
    call('radio', 'listen', 'POST', { station_id, user_id }),
};

export const userApi = {
  getHistory: (params?: Record<string, string>) =>
    call('user', 'history', 'GET', undefined, params),
  addHistory: (station_id: number, duration_seconds = 0) =>
    call('user', 'add_history', 'POST', { station_id, duration_seconds }),
  getFavorites: () => call('user', 'favorites'),
  addFavorite: (station_id: number) =>
    call('user', 'add_favorite', 'POST', { station_id }),
  removeFavorite: (station_id: number) =>
    call('user', 'remove_favorite', 'POST', { station_id }),
};

export const adminApi = {
  getAnalytics: () => call('admin', 'analytics'),
  getStations: (params?: Record<string, string>) =>
    call('admin', 'stations', 'GET', undefined, params),
  createStation: (body: unknown) => call('admin', 'create_station', 'POST', body),
  updateStation: (id: number, body: unknown) =>
    call('admin', 'update_station', 'POST', body, { id: String(id) }),
  deleteStation: (id: number) =>
    call('admin', 'delete_station', 'POST', undefined, { id: String(id) }),
  getUsers: (params?: Record<string, string>) => call('admin', 'users', 'GET', undefined, params),
  blockUser: (id: number, is_blocked: boolean) =>
    call('admin', 'block_user', 'POST', { is_blocked }, { id: String(id) }),
  deleteUser: (id: number) =>
    call('admin', 'delete_user', 'POST', undefined, { id: String(id) }),
  getBanners: () => call('admin', 'banners'),
  createBanner: (body: unknown) => call('admin', 'create_banner', 'POST', body),
  updateBanner: (id: number, body: unknown) =>
    call('admin', 'update_banner', 'POST', body, { id: String(id) }),
  getCategories: () => call('admin', 'categories'),
  createCategory: (body: unknown) => call('admin', 'create_category', 'POST', body),
  updateCategory: (id: number, body: unknown) =>
    call('admin', 'update_category', 'POST', body, { id: String(id) }),
  deleteCategory: (id: number) =>
    call('admin', 'delete_category', 'POST', undefined, { id: String(id) }),
  getGenres: () => call('admin', 'genres'),
  createGenre: (body: unknown) => call('admin', 'create_genre', 'POST', body),
  updateGenre: (id: number, body: unknown) =>
    call('admin', 'update_genre', 'POST', body, { id: String(id) }),
  deleteGenre: (id: number) =>
    call('admin', 'delete_genre', 'POST', undefined, { id: String(id) }),
  uploadImage: (file_data: string, file_name: string, content_type: string) =>
    call('admin', 'upload', 'POST', { file_data, file_name, content_type }),
};