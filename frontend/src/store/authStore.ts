/**
 * Zustand store для управления аутентификацией.
 * 
 * Хранит состояние пользователя и токенов, предоставляет
 * методы для входа, выхода и обновления токенов.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState, AuthActions, LoginRequest, RegisterRequest } from '@/types';
import { authService } from '@/services/auth_service';
import { STORAGE_KEYS } from '@/utils/constants';

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      /**
       * Авторизация пользователя.
       */
      login: async (data: LoginRequest) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(data);
          set({
            user: response.user,
            accessToken: response.tokens.accessToken,
            refreshToken: response.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      /**
       * Регистрация нового пользователя.
       */
      register: async (data: RegisterRequest) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(data);
          set({
            user: response.user,
            accessToken: response.tokens.accessToken,
            refreshToken: response.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      /**
       * Выход из системы.
       */
      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await authService.logout(refreshToken);
          }
        } finally {
          // Очищаем состояние в любом случае
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },

      /**
       * Обновление токенов.
       */
      refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const tokens = await authService.refresh(refreshToken);
          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
        } catch (error) {
          // При ошибке обновления — разлогиниваем
          get().clearAuth();
          throw error;
        }
      },

      /**
       * Установить данные пользователя.
       */
      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      /**
       * Установить токены.
       */
      setTokens: (accessToken: string | null, refreshToken: string | null) => {
        set({ accessToken, refreshToken });
      },

      /**
       * Полная очистка состояния авторизации.
       */
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: STORAGE_KEYS.ACCESS_TOKEN.replace('_access_token', ''), // theatre
      partialize: (state) => ({
        // Сохраняем только эти поля
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
