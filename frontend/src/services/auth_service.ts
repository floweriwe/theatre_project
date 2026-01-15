/**
 * Сервис аутентификации.
 * 
 * Методы для работы с API аутентификации:
 * login, register, logout, refresh.
 */

import api from './api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  TokenResponse,
  User,
} from '@/types';

/**
 * Преобразование snake_case в camelCase для ответов API.
 */
function transformUserResponse(data: Record<string, unknown>): User {
  const firstName = data.first_name as string;
  const lastName = data.last_name as string;
  return {
    id: data.id as number,
    email: data.email as string,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    isActive: data.is_active as boolean,
    isVerified: data.is_verified as boolean,
    roles: ((data.roles as Array<{code: string}>) || []).map(r => r.code),
    permissions: (data.permissions as string[]) || [],
    theaterId: data.theater_id as number | null,
    createdAt: data.created_at as string,
  };
}

function transformTokenResponse(data: Record<string, unknown>): TokenResponse {
  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    tokenType: data.token_type as string,
  };
}

class AuthService {
  private readonly basePath = '/auth';

  /**
   * Авторизация пользователя.
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    // Сначала получаем токены
    const tokenResponse = await api.post(`${this.basePath}/login`, data);
    const tokens = transformTokenResponse(tokenResponse.data);
    
    // Затем получаем данные пользователя
    const userResponse = await api.get(`${this.basePath}/me`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    const user = transformUserResponse(userResponse.data);
    
    return { user, tokens };
  }

  /**
   * Регистрация нового пользователя.
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    // Регистрируем пользователя (API возвращает User)
    await api.post(`${this.basePath}/register`, {
      email: data.email,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
    });
    
    // Сразу логинимся
    return this.login({
      email: data.email,
      password: data.password,
    });
  }

  /**
   * Выход из системы.
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await api.post(`${this.basePath}/logout`, { refresh_token: refreshToken });
    } catch {
      // Игнорируем ошибки при logout
    }
  }

  /**
   * Обновление токенов.
   */
  async refresh(refreshToken: string): Promise<TokenResponse> {
    const response = await api.post(`${this.basePath}/refresh`, {
      refresh_token: refreshToken,
    });
    return transformTokenResponse(response.data);
  }
}

export const authService = new AuthService();
