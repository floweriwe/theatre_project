"""
Тесты модуля аутентификации.

Проверяет:
- Регистрацию пользователей
- Вход в систему
- Обновление токенов
- Выход из системы
- Получение текущего пользователя
"""
import pytest
from httpx import AsyncClient


# =============================================================================
# Тесты регистрации
# =============================================================================

class TestRegister:
    """Тесты регистрации пользователей."""
    
    @pytest.mark.asyncio
    async def test_register_success(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Успешная регистрация нового пользователя."""
        response = await client.post("/api/v1/auth/register", json=test_user_data)
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["email"] == test_user_data["email"]
        assert data["first_name"] == test_user_data["first_name"]
        assert data["last_name"] == test_user_data["last_name"]
        assert data["is_active"] is True
        assert data["is_verified"] is False
        assert "id" in data
        assert "hashed_password" not in data  # Пароль не должен возвращаться
    
    @pytest.mark.asyncio
    async def test_register_duplicate_email(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Регистрация с уже занятым email."""
        # Первая регистрация
        await client.post("/api/v1/auth/register", json=test_user_data)
        
        # Повторная регистрация с тем же email
        response = await client.post("/api/v1/auth/register", json=test_user_data)
        
        assert response.status_code == 409
        assert "уже существует" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client: AsyncClient):
        """Регистрация с невалидным email."""
        data = {
            "email": "invalid-email",
            "password": "TestPassword123!",
            "first_name": "Тест",
            "last_name": "Тестов",
        }
        
        response = await client.post("/api/v1/auth/register", json=data)
        
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_register_short_password(self, client: AsyncClient):
        """Регистрация с коротким паролем."""
        data = {
            "email": "test@example.com",
            "password": "short",
            "first_name": "Тест",
            "last_name": "Тестов",
        }
        
        response = await client.post("/api/v1/auth/register", json=data)
        
        assert response.status_code == 422


# =============================================================================
# Тесты входа
# =============================================================================

class TestLogin:
    """Тесты входа в систему."""
    
    @pytest.mark.asyncio
    async def test_login_success(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Успешный вход в систему."""
        # Сначала регистрируем пользователя
        await client.post("/api/v1/auth/register", json=test_user_data)
        
        # Входим
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"],
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    @pytest.mark.asyncio
    async def test_login_wrong_password(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Вход с неверным паролем."""
        # Регистрируем
        await client.post("/api/v1/auth/register", json=test_user_data)
        
        # Пытаемся войти с неверным паролем
        login_data = {
            "email": test_user_data["email"],
            "password": "WrongPassword123!",
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        assert "неверный" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Вход несуществующего пользователя."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "AnyPassword123!",
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401


# =============================================================================
# Тесты получения текущего пользователя
# =============================================================================

class TestGetMe:
    """Тесты получения текущего пользователя."""
    
    @pytest.mark.asyncio
    async def test_get_me_success(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Успешное получение данных текущего пользователя."""
        # Регистрация и вход
        await client.post("/api/v1/auth/register", json=test_user_data)
        login_response = await client.post("/api/v1/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
        })
        tokens = login_response.json()
        
        # Получаем данные пользователя
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["email"] == test_user_data["email"]
        assert data["first_name"] == test_user_data["first_name"]
        assert data["last_name"] == test_user_data["last_name"]
        assert "roles" in data
        assert "permissions" in data
    
    @pytest.mark.asyncio
    async def test_get_me_unauthorized(self, client: AsyncClient):
        """Получение данных без авторизации."""
        response = await client.get("/api/v1/auth/me")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_me_invalid_token(self, client: AsyncClient):
        """Получение данных с невалидным токеном."""
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"},
        )
        
        assert response.status_code == 401


# =============================================================================
# Тесты обновления токенов
# =============================================================================

class TestRefreshTokens:
    """Тесты обновления токенов."""
    
    @pytest.mark.asyncio
    async def test_refresh_tokens_success(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Успешное обновление токенов."""
        # Регистрация и вход
        await client.post("/api/v1/auth/register", json=test_user_data)
        login_response = await client.post("/api/v1/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
        })
        tokens = login_response.json()
        
        # Обновляем токены
        response = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": tokens["refresh_token"],
        })
        
        assert response.status_code == 200
        new_tokens = response.json()
        
        assert "access_token" in new_tokens
        assert "refresh_token" in new_tokens
        # Новые токены должны отличаться от старых
        assert new_tokens["access_token"] != tokens["access_token"]
    
    @pytest.mark.asyncio
    async def test_refresh_tokens_invalid_token(self, client: AsyncClient):
        """Обновление с невалидным refresh token."""
        response = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": "invalid_refresh_token",
        })
        
        assert response.status_code == 401


# =============================================================================
# Тесты выхода
# =============================================================================

class TestLogout:
    """Тесты выхода из системы."""
    
    @pytest.mark.asyncio
    async def test_logout_success(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Успешный выход из системы."""
        # Регистрация и вход
        await client.post("/api/v1/auth/register", json=test_user_data)
        login_response = await client.post("/api/v1/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
        })
        tokens = login_response.json()
        
        # Выходим
        response = await client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
    
    @pytest.mark.asyncio
    async def test_token_blacklisted_after_logout(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Access token недействителен после выхода."""
        # Регистрация и вход
        await client.post("/api/v1/auth/register", json=test_user_data)
        login_response = await client.post("/api/v1/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
        })
        tokens = login_response.json()
        
        # Выходим
        await client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        
        # Пытаемся использовать старый токен
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        
        assert response.status_code == 401


# =============================================================================
# Тесты Health Check
# =============================================================================

class TestHealthCheck:
    """Тесты health check endpoint."""
    
    @pytest.mark.asyncio
    async def test_health_check(self, client: AsyncClient):
        """Health check должен возвращать статус healthy."""
        response = await client.get("/health")
        
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
