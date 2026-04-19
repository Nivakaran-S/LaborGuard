import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: !!accessToken,
      }),

      setTokens: (accessToken, refreshToken) => set({
        accessToken,
        refreshToken,
        isAuthenticated: !!accessToken,
      }),

      updateUser: (user) => set({ user }),

      logout: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'auth-storage', // unique name
      storage: createJSONStorage(() => localStorage),
    }
  )
);
