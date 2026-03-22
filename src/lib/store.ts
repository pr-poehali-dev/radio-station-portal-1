import { create } from 'zustand';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  avatar_url?: string;
}

export interface Station {
  id: number;
  name: string;
  description?: string;
  stream_url: string;
  cover_url?: string;
  city?: string;
  frequency?: string;
  listen_count: number;
  is_featured?: boolean;
  is_active?: boolean;
  category_id?: number;
  genre_id?: number;
  category_name?: string;
  category_color?: string;
  genre_name?: string;
}

interface PlayerState {
  currentStation: Station | null;
  isPlaying: boolean;
  volume: number;
  setStation: (station: Station) => void;
  togglePlay: () => void;
  setVolume: (v: number) => void;
  stop: () => void;
}

interface AuthState {
  user: User | null;
  sessionId: string;
  setUser: (user: User | null) => void;
  setSession: (id: string) => void;
  logout: () => void;
}

export const usePlayer = create<PlayerState>((set) => ({
  currentStation: null,
  isPlaying: false,
  volume: 0.8,
  setStation: (station) => set({ currentStation: station, isPlaying: true }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setVolume: (volume) => set({ volume }),
  stop: () => set({ isPlaying: false }),
}));

export const useAuth = create<AuthState>((set) => ({
  user: null,
  sessionId: localStorage.getItem('session_id') || '',
  setUser: (user) => set({ user }),
  setSession: (sessionId) => {
    localStorage.setItem('session_id', sessionId);
    set({ sessionId });
  },
  logout: () => {
    localStorage.removeItem('session_id');
    set({ user: null, sessionId: '' });
  },
}));
