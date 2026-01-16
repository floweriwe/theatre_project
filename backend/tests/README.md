# Backend Testing Infrastructure

This directory contains the test suite for the Theatre Management System backend.

## Structure

```
tests/
├── conftest.py              # Shared fixtures for all tests
├── pytest.ini               # Pytest configuration (in backend root)
├── unit/                    # Unit tests (repositories, models)
│   └── __init__.py
├── integration/             # Integration tests (API endpoints)
│   └── __init__.py
├── services/                # Service layer tests
│   └── __init__.py
├── test_auth.py            # Authentication tests
└── test_inventory.py       # Inventory module tests
```

## Running Tests

### All Tests
```bash
docker-compose -f docker-compose.dev.yml exec backend pytest
```

### With Coverage
```bash
docker-compose -f docker-compose.dev.yml exec backend pytest --cov=app --cov-report=html
```

### Specific Test File
```bash
docker-compose -f docker-compose.dev.yml exec backend pytest tests/unit/test_example.py
```

### By Marker
```bash
docker-compose -f docker-compose.dev.yml exec backend pytest -m unit
docker-compose -f docker-compose.dev.yml exec backend pytest -m integration
docker-compose -f docker-compose.dev.yml exec backend pytest -m service
```

### Verbose Output
```bash
docker-compose -f docker-compose.dev.yml exec backend pytest -v --tb=short
```

## Test Fixtures

### Database Fixtures

- `test_engine` - Session-scoped test database engine
- `db_session` - Function-scoped database session with transaction rollback
- `test_db` - Alias for db_session

### HTTP Client Fixtures

- `client` - FastAPI test client with mocked dependencies
- `async_client` - Alias for client
- `authorized_client` - Authenticated client with test user
- `admin_client` - Authenticated client with admin user

### Redis Fixtures

- `mock_redis` - Redis service with automatic cleanup

### Test Data Fixtures

- `test_user_data` - Test user credentials
- `another_user_data` - Second test user
- `admin_user_data` - Admin user credentials
- `sample_inventory_item` - Sample inventory item data
- `sample_performance` - Sample performance data

### Utility Fixtures

- `make_headers` - Factory for creating auth headers

## Test Markers

Available markers for organizing tests:

- `@pytest.mark.unit` - Unit tests (isolated components)
- `@pytest.mark.integration` - Integration tests (API endpoints)
- `@pytest.mark.service` - Service layer tests
- `@pytest.mark.slow` - Slow-running tests
- `@pytest.mark.auth` - Authentication tests
- `@pytest.mark.inventory` - Inventory module tests
- `@pytest.mark.performances` - Performances module tests
- `@pytest.mark.schedule` - Schedule module tests
- `@pytest.mark.documents` - Documents module tests
- `@pytest.mark.tasks` - Tasks module tests

## Writing Tests

### Unit Test Example

```python
import pytest
from app.models.inventory import InventoryItem

@pytest.mark.unit
async def test_create_inventory_item(db_session):
    """Test creating an inventory item."""
    item = InventoryItem(
        name="Test Item",
        category="props",
        status="in_stock"
    )
    db_session.add(item)
    await db_session.commit()
    
    assert item.id is not None
    assert item.name == "Test Item"
```

### Integration Test Example

```python
import pytest

@pytest.mark.integration
async def test_get_items_endpoint(authorized_client):
    """Test GET /api/v1/inventory/items endpoint."""
    response = await authorized_client.get("/api/v1/inventory/items")
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
```

### Service Test Example

```python
import pytest
from app.services.inventory_service import InventoryService

@pytest.mark.service
async def test_inventory_service_create_item(db_session):
    """Test inventory service create item method."""
    service = InventoryService(db_session)
    
    item_data = {
        "name": "Test Item",
        "category": "props",
        "status": "in_stock"
    }
    
    item = await service.create_item(item_data)
    
    assert item.id is not None
    assert item.name == "Test Item"
```

## Database Isolation

Each test runs in its own transaction that is rolled back after the test completes. This ensures:

1. Tests don't interfere with each other
2. Database state is clean for each test
3. Fast test execution (no need to recreate tables)

## Dependencies

Testing dependencies are defined in `pyproject.toml`:

- `pytest>=8.0.0` - Test framework
- `pytest-asyncio>=0.23.0` - Async test support
- `pytest-cov>=4.1.0` - Coverage reporting
- `pytest-mock>=3.12.0` - Mocking utilities
- `httpx>=0.27.0` - Async HTTP client

## Configuration

Pytest configuration is in `pytest.ini`:

- `asyncio_mode = auto` - Automatic async mode
- `testpaths = tests` - Test discovery path
- Test file patterns, markers, and warnings configuration

## Best Practices

1. Use appropriate markers for test organization
2. Keep tests isolated and independent
3. Use fixtures for shared setup/teardown
4. Mock external dependencies (MinIO, external APIs)
5. Test both success and failure cases
6. Use descriptive test names
7. Add docstrings to explain test purpose
8. Aim for high test coverage (>80%)

## Troubleshooting

### MissingGreenlet Error

If you see `sqlalchemy.exc.MissingGreenlet`, ensure you're using async fixtures properly:

```python
@pytest.mark.asyncio
async def test_example(db_session):  # Use async def
    result = await db_session.execute(...)  # Use await
```

### Test Database Connection

The test database is automatically created: `theatre_main_test`

Ensure PostgreSQL is running and accessible:
```bash
docker-compose -f docker-compose.dev.yml ps db
```

### Redis Connection

Ensure Redis is running for tests that use caching:
```bash
docker-compose -f docker-compose.dev.yml ps redis
```
