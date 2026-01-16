# Testing Quick Reference

## Common Commands

```bash
# Run all tests
docker-compose -f docker-compose.dev.yml exec backend pytest

# Run with verbose output
docker-compose -f docker-compose.dev.yml exec backend pytest -v

# Run specific file
docker-compose -f docker-compose.dev.yml exec backend pytest tests/unit/test_example.py

# Run by marker
docker-compose -f docker-compose.dev.yml exec backend pytest -m unit
docker-compose -f docker-compose.dev.yml exec backend pytest -m integration
docker-compose -f docker-compose.dev.yml exec backend pytest -m service

# Run with coverage
docker-compose -f docker-compose.dev.yml exec backend pytest --cov=app --cov-report=html

# Run and stop on first failure
docker-compose -f docker-compose.dev.yml exec backend pytest -x

# Run last failed tests
docker-compose -f docker-compose.dev.yml exec backend pytest --lf

# Show available fixtures
docker-compose -f docker-compose.dev.yml exec backend pytest --fixtures

# Collect tests without running
docker-compose -f docker-compose.dev.yml exec backend pytest --collect-only
```

## Available Fixtures

### Database
- `test_engine` - Test database engine
- `db_session` - Session with transaction rollback
- `test_db` - Alias for db_session

### HTTP Clients
- `client` - FastAPI test client
- `async_client` - Alias for client
- `authorized_client` - Authenticated client
- `admin_client` - Admin authenticated client

### Test Data
- `test_user_data` - Test user
- `another_user_data` - Second test user
- `admin_user_data` - Admin user
- `sample_inventory_item` - Inventory item data
- `sample_performance` - Performance data

### Utilities
- `mock_redis` - Redis mock
- `make_headers` - Auth headers factory

## Test Markers

```python
@pytest.mark.unit          # Unit tests
@pytest.mark.integration   # Integration tests
@pytest.mark.service       # Service tests
@pytest.mark.slow          # Slow tests
@pytest.mark.auth          # Auth module
@pytest.mark.inventory     # Inventory module
```

## Writing Tests

### Unit Test Template
```python
import pytest

@pytest.mark.unit
async def test_something(db_session):
    # Arrange
    item = MyModel(name="test")
    db_session.add(item)
    await db_session.commit()
    
    # Act
    result = await item.some_method()
    
    # Assert
    assert result == expected
```

### Integration Test Template
```python
import pytest

@pytest.mark.integration
async def test_api_endpoint(authorized_client):
    # Act
    response = await authorized_client.get("/api/v1/resource")
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "key" in data
```

### Service Test Template
```python
import pytest
from app.services.my_service import MyService

@pytest.mark.service
async def test_service_method(db_session):
    # Arrange
    service = MyService(db_session)
    
    # Act
    result = await service.do_something()
    
    # Assert
    assert result is not None
```

## Tips

1. Use descriptive test names: `test_create_user_success`
2. Follow AAA pattern: Arrange, Act, Assert
3. One assertion per test (when possible)
4. Use fixtures to avoid duplication
5. Mark tests appropriately
6. Add docstrings to explain complex tests
7. Mock external dependencies
8. Clean up resources in fixtures
