/**
 * Хук аутентификации для Theatre Management System
 * 
 * Предоставляет доступ к состоянию аутентификации,
 * данным текущего пользователя и функциям входа/выхода.
 */

import { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

/** Роли пользователей */
export type UserRole =
  | 'admin'
  | 'sysadmin'
  | 'director'
  | 'tech_director'
  | 'producer'
  | 'department_head'
  | 'accountant'
  | 'performer';

/** Возвращаемое значение хука */
interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  /** Проверка разрешения */
  hasPermission: (permission: string) => boolean;
  /** Проверка роли */
  hasRole: (role: UserRole | UserRole[]) => boolean;
  /** Проверка, является ли пользователь администратором */
  isAdmin: boolean;
  /** Выход из системы */
  logout: () => void;
}

/**
 * Хук для работы с аутентификацией.
 * 
 * @example
 * const { isAuthenticated, user, hasPermission } = useAuth();
 * 
 * if (hasPermission('inventory:edit')) {
 *   // Показать кнопку редактирования
 * }
 */
export function useAuth(): UseAuthReturn {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();

  // Проверка разрешения
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;

      // Админ имеет все права
      if (user.roles?.includes('admin')) return true;

      // Проверяем наличие конкретного разрешения в permissions
      return user.permissions?.includes(permission) || false;
    },
    [user]
  );

  // Проверка роли
  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!user) return false;

      const roles = Array.isArray(role) ? role : [role];
      return roles.some(r => user.roles?.includes(r));
    },
    [user]
  );

  // Является ли пользователь администратором
  const isAdmin = useMemo(() => {
    return user?.roles?.some(r => r === 'admin' || r === 'sysadmin') || false;
  }, [user]);

  return {
    isAuthenticated,
    isLoading,
    user,
    hasPermission,
    hasRole,
    isAdmin,
    logout,
  };
}

export default useAuth;
