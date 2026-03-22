const URLS: Record<string, string> = {
  auth: 'https://functions.poehali.dev/170a245f-0cc7-4b10-8c9e-285f70156ada',
  radio: 'https://functions.poehali.dev/a0e8b282-ca0f-4422-87ae-f7537bb1a301',
  user: 'https://functions.poehali.dev/807f84ae-33a0-4832-ad5e-b0b2580dbec1',
  admin: 'https://functions.poehali.dev/eebc36f7-c7ef-44f4-9fb7-b97e5fa9b428',
};

function getSession() {
  return localStorage.getItem('session_id') || '';
}

async function request(fn: string, path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${URLS[fn]}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': getSession(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export const authApi = {
  register: (body: { username: string; email: string; password: string }) =>
    request('auth', '/register', 'POST', body),
  login: (body: { email: string; password: string }) =>
    request('auth', '/login', 'POST', body),
  logout: () => request('auth', '/logout', 'POST'),
  me: () => request('auth', '/me', 'GET'),
  updateProfile: (body: { username: string }) =>
    request('auth', '/profile', 'PUT', body),
};

export const radioApi = {
  getStations: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request('radio', `/${q}`);
  },
  getPopular: (limit = 8) => request('radio', `/popular?limit=${limit}`),
  getStation: (id: number) => request('radio', `/station/${id}`),
  getCategories: () => request('radio', '/categories'),
  getGenres: () => request('radio', '/genres'),
  getSlider: () => request('radio', '/slider'),
  incrementListen: (station_id: number, user_id?: number) =>
    request('radio', '/listen', 'POST', { station_id, user_id }),
};

export const userApi = {
  getHistory: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request('user', `/history${q}`);
  },
  addHistory: (station_id: number, duration_seconds = 0) =>
    request('user', '/history', 'POST', { station_id, duration_seconds }),
  getFavorites: () => request('user', '/favorites'),
  addFavorite: (station_id: number) =>
    request('user', '/favorites', 'POST', { station_id }),
  removeFavorite: (station_id: number) =>
    request('user', '/favorites', 'DELETE', { station_id }),
};

export const adminApi = {
  getAnalytics: () => request('admin', '/analytics'),
  getStations: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request('admin', `/stations${q}`);
  },
  createStation: (body: unknown) => request('admin', '/stations', 'POST', body),
  updateStation: (id: number, body: unknown) =>
    request('admin', `/station/${id}`, 'PUT', body),
  deleteStation: (id: number) => request('admin', `/station/${id}`, 'DELETE'),
  getUsers: () => request('admin', '/users'),
  getBanners: () => request('admin', '/banners'),
  createBanner: (body: unknown) => request('admin', '/banners', 'POST', body),
  updateBanner: (id: number, body: unknown) =>
    request('admin', `/banner/${id}`, 'PUT', body),
  getCategories: () => request('admin', '/categories'),
  createCategory: (body: unknown) => request('admin', '/categories', 'POST', body),
  getGenres: () => request('admin', '/genres'),
  createGenre: (body: unknown) => request('admin', '/genres', 'POST', body),
  uploadImage: (file_data: string, file_name: string, content_type: string) =>
    request('admin', '/upload', 'POST', { file_data, file_name, content_type }),
};
