/**
 * Типы для модуля аутентификации.
 */

/** Данные пользователя */
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  isVerified: boolean;
  roles: string[];
  permissions: string[];
  theaterId: number | null;
  createdAt: string;
}

/** Запрос на вход */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Запрос на регистрацию */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/** Ответ с токенами */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

/** Полный ответ при логине */
export interface LoginResponse {
  user: User;
  tokens: TokenResponse;
}

/** Запрос на обновление токенов */
export interface RefreshRequest {
  refreshToken: string;
}

/** Состояние авторизации */
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/** Действия авторизации */
export interface AuthActions {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (access: string | null, refresh: string | null) => void;
  clearAuth: () => void;
}
