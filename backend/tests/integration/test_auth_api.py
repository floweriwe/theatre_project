"""
Integration tests for Auth API endpoints.

Tests:
- POST /auth/register - registration
- POST /auth/login - login
- POST /auth/refresh - token refresh
- POST /auth/logout - logout
- GET /auth/me - get current user
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
@pytest.mark.integration
class TestAuthAPI:
    """Test auth API endpoints."""

    async def test_register_success(self, async_client: AsyncClient):
        """Test successful user registration."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@test.com",
                "password": "TestPass123!",
                "first_name": "Test",
                "last_name": "User",
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@test.com"
        assert data["first_name"] == "Test"
        assert data["last_name"] == "User"
        assert "id" in data

    async def test_register_validation_error(self, async_client: AsyncClient):
        """Test registration with invalid data."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={}  # missing required fields
        )
        assert response.status_code == 422

    async def test_register_duplicate_email(self, async_client: AsyncClient):
        """Test registration with duplicate email."""
        user_data = {
            "email": "duplicate@test.com",
            "password": "TestPass123!",
            "first_name": "Test",
            "last_name": "User",
        }
        # First registration
        await async_client.post("/api/v1/auth/register", json=user_data)
        
        # Duplicate registration
        response = await async_client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 409

    async def test_login_success(self, async_client: AsyncClient):
        """Test successful login."""
        # Register user first
        await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "login@test.com",
                "password": "TestPass123!",
                "first_name": "Test",
                "last_name": "User",
            }
        )
        
        # Login
        response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": "login@test.com",
                "password": "TestPass123!",
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_invalid_credentials(self, async_client: AsyncClient):
        """Test login with invalid credentials."""
        response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@test.com",
                "password": "WrongPassword!",
            }
        )
        assert response.status_code == 401

    async def test_login_validation_error(self, async_client: AsyncClient):
        """Test login with missing fields."""
        response = await async_client.post(
            "/api/v1/auth/login",
            json={}
        )
        assert response.status_code == 422

    async def test_get_me_success(self, authorized_client: AsyncClient):
        """Test getting current user info."""
        response = await authorized_client.get("/api/v1/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "first_name" in data
        assert "last_name" in data

    async def test_get_me_unauthorized(self, async_client: AsyncClient):
        """Test getting user info without authentication."""
        response = await async_client.get("/api/v1/auth/me")
        assert response.status_code == 401

    async def test_refresh_token_success(self, async_client: AsyncClient):
        """Test token refresh."""
        # Register and login
        await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "refresh@test.com",
                "password": "TestPass123!",
                "first_name": "Test",
                "last_name": "User",
            }
        )
        login_response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": "refresh@test.com",
                "password": "TestPass123!",
            }
        )
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh tokens
        response = await async_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_refresh_token_invalid(self, async_client: AsyncClient):
        """Test refresh with invalid token."""
        response = await async_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid_token"}
        )
        assert response.status_code == 401

    async def test_logout_success(self, authorized_client: AsyncClient):
        """Test logout."""
        response = await authorized_client.post("/api/v1/auth/logout")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    async def test_logout_unauthorized(self, async_client: AsyncClient):
        """Test logout without authentication."""
        response = await async_client.post("/api/v1/auth/logout")
        assert response.status_code == 401
