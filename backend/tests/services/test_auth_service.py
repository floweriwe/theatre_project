"""
Unit-тесты для AuthService.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.auth_service import AuthService
from app.models.user import User
from app.core.exceptions import (
    AlreadyExistsError,
    InvalidCredentialsError,
    UserNotActiveError,
)
from app.schemas.auth import RegisterRequest, LoginRequest


@pytest.mark.asyncio
@pytest.mark.service
class TestAuthServiceLogin:
    """Тесты для входа в систему."""

    @patch('app.services.auth_service.verify_password')
    @patch('app.services.auth_service.create_access_token')
    @patch('app.services.auth_service.create_refresh_token')
    async def test_login_success(self, mock_refresh, mock_access, mock_verify):
        """Успешный вход."""
        mock_session = AsyncMock()
        mock_redis = AsyncMock()
        service = AuthService(mock_session, mock_redis)
        
        user = User(
            id=1,
            email="user@example.com",
            hashed_password="hashed",
            is_active=True,
            role_codes=["user"],
            is_superuser=False,
        )
        
        mock_verify.return_value = True
        mock_access.return_value = "access_xyz"
        mock_refresh.return_value = "refresh_abc"
        
        service._user_repo.get_by_email = AsyncMock(return_value=user)
        service._user_repo.update = AsyncMock()
        mock_redis.store_refresh_token = AsyncMock()
        
        data = LoginRequest(email="user@example.com", password="correct")
        result = await service.login(data)
        
        assert result.access_token == "access_xyz"
        assert result.refresh_token == "refresh_abc"

    @patch('app.services.auth_service.verify_password')
    async def test_login_wrong_password_fails(self, mock_verify):
        """Неверный пароль."""
        mock_session = AsyncMock()
        mock_redis = AsyncMock()
        service = AuthService(mock_session, mock_redis)
        
        user = User(id=1, email="user@example.com", hashed_password="hashed", is_active=True)
        mock_verify.return_value = False
        service._user_repo.get_by_email = AsyncMock(return_value=user)
        
        data = LoginRequest(email="user@example.com", password="wrong")
        
        with pytest.raises(InvalidCredentialsError):
            await service.login(data)
