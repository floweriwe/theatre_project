# Venues API Specification

## Overview
Complete CRUD API for managing theatre venues (Main Stage, Rehearsal Rooms, Warehouses, Workshops).

**Base URL**: `/api/v1/venues`

**Authentication**: Bearer token required (all endpoints)

**Tenant Isolation**: All operations are scoped to the user's theater_id

---

## Data Models

### VenueType Enum
```python
MAIN_STAGE = "main_stage"      # Основная сцена
REHEARSAL = "rehearsal"        # Репетиционный зал
WAREHOUSE = "warehouse"        # Склад
WORKSHOP = "workshop"          # Мастерская
```

### VenueResponse Schema
```json
{
  "id": 1,
  "name": "Основная сцена",
  "code": "MAIN-STAGE",
  "description": "Большой зал на 500 мест",
  "venue_type": "main_stage",
  "capacity": 500,
  "address": null,
  "is_active": true,
  "theater_id": 1,
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z"
}
```

---

## Endpoints

### 1. List Venues
**GET** `/api/v1/venues`

Get paginated list of venues for the current theater.

**Query Parameters:**
- `page` (integer, default: 1) - Page number (min: 1)
- `limit` (integer, default: 20) - Items per page (min: 1, max: 100)
- `include_inactive` (boolean, default: false) - Include inactive venues

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": 1,
      "name": "Основная сцена",
      "code": "MAIN-STAGE",
      "venue_type": "main_stage",
      "capacity": 500,
      "is_active": true,
      "created_at": "2026-01-15T10:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/v1/venues?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. Create Venue
**POST** `/api/v1/venues`

Create a new venue for the current theater.

**Request Body:**
```json
{
  "name": "Репетиционный зал №1",
  "code": "REH-01",
  "description": "Малый зал для репетиций",
  "venue_type": "rehearsal",
  "capacity": 50,
  "address": null,
  "is_active": true
}
```

**Validation Rules:**
- `name`: required, 1-100 characters
- `code`: required, 1-50 characters, **auto-converted to UPPERCASE**, must be unique per theater
- `venue_type`: required, must be valid VenueType enum
- `capacity`: optional, must be positive integer if provided
- `address`: optional, max 500 characters

**Response:** `201 Created`
```json
{
  "id": 2,
  "name": "Репетиционный зал №1",
  "code": "REH-01",
  "description": "Малый зал для репетиций",
  "venue_type": "rehearsal",
  "capacity": 50,
  "address": null,
  "is_active": true,
  "theater_id": 1,
  "created_at": "2026-01-17T10:00:00Z",
  "updated_at": "2026-01-17T10:00:00Z"
}
```

**Error Responses:**
- `409 Conflict` - Venue with this code already exists
- `422 Unprocessable Entity` - Validation error (e.g., capacity <= 0)

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/venues" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Репетиционный зал №1",
    "code": "REH-01",
    "venue_type": "rehearsal",
    "capacity": 50,
    "is_active": true
  }'
```

---

### 3. Get Venue by ID
**GET** `/api/v1/venues/{venue_id}`

Get detailed information about a specific venue.

**Path Parameters:**
- `venue_id` (integer, required) - Venue ID

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Основная сцена",
  "code": "MAIN-STAGE",
  "description": "Большой зал на 500 мест",
  "venue_type": "main_stage",
  "capacity": 500,
  "address": null,
  "is_active": true,
  "theater_id": 1,
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Venue not found or doesn't belong to user's theater

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/v1/venues/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Update Venue
**PUT** `/api/v1/venues/{venue_id}`

Update venue information. All fields are optional - only provided fields will be updated.

**Path Parameters:**
- `venue_id` (integer, required) - Venue ID

**Request Body:**
```json
{
  "name": "Основная сцена (обновлено)",
  "capacity": 550
}
```

**Validation Rules:**
- Same as create, but all fields optional
- If `code` is updated, it must be unique within the theater
- Code is auto-converted to UPPERCASE

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Основная сцена (обновлено)",
  "code": "MAIN-STAGE",
  "description": "Большой зал на 500 мест",
  "venue_type": "main_stage",
  "capacity": 550,
  "address": null,
  "is_active": true,
  "theater_id": 1,
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-17T11:30:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Venue not found
- `409 Conflict` - New code already exists
- `422 Unprocessable Entity` - Validation error

**cURL Example:**
```bash
curl -X PUT "http://localhost:8000/api/v1/venues/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Основная сцена (обновлено)",
    "capacity": 550
  }'
```

---

### 5. Delete Venue
**DELETE** `/api/v1/venues/{venue_id}`

Soft delete a venue (marks as inactive).

**Path Parameters:**
- `venue_id` (integer, required) - Venue ID

**Response:** `200 OK`
```json
{
  "message": "Площадка успешно удалена",
  "success": true
}
```

**Error Responses:**
- `404 Not Found` - Venue not found

**Notes:**
- This is a **soft delete** - the venue is marked as `is_active = false`
- Physical deletion is not supported to maintain referential integrity
- Soft-deleted venues can be re-activated by updating `is_active` to `true`

**cURL Example:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/venues/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Implementation Details

### Architecture Layers

```
API Router (venues.py)
    ↓
Service Layer (venue_service.py)
    ↓
SQLAlchemy Model (venue.py)
    ↓
PostgreSQL Database
```

### Key Features

1. **Tenant Isolation**: All queries automatically filtered by `theater_id` from current user
2. **Code Uniqueness**: Enforced at service layer, scoped to theater
3. **Code Normalization**: Automatically converted to uppercase
4. **Soft Delete**: Preserves referential integrity
5. **Pagination**: Standard paginated responses for list endpoint
6. **Validation**: Pydantic schemas with field validators

### Files Created

1. **`backend/app/schemas/venue.py`** - Pydantic schemas
   - VenueCreate, VenueUpdate, VenueResponse, VenueListResponse
   - Field validation for capacity and code

2. **`backend/app/services/venue_service.py`** - Business logic
   - `get_all()` - List with pagination and filtering
   - `get_by_id()` - Fetch single venue with theater check
   - `create()` - Create with code uniqueness validation
   - `update()` - Update with code uniqueness validation
   - `delete()` - Soft delete (set is_active = false)

3. **`backend/app/api/v1/venues.py`** - FastAPI router
   - 5 endpoints following RESTful conventions
   - Exception handling (404, 409, 422)
   - OpenAPI documentation

4. **Modified `backend/app/api/v1/router.py`** - Registered venues router

### Database Schema

Model already exists at `backend/app/models/venue.py`:

```python
class Venue(Base, AuditMixin):
    id: int (PK)
    name: str(100) - not null
    code: str(50) - not null, indexed
    description: str | None
    venue_type: VenueType - enum, not null
    capacity: int | None
    address: str(500) | None
    theater_id: int - FK to theaters, indexed
    is_active: bool - default True
    created_at: datetime
    updated_at: datetime
```

---

## Testing

### Manual Test Flow

1. **Start backend:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Login to get token:**
   ```bash
   curl -X POST "http://localhost:8000/api/v1/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@theatre.test", "password": "Theatre2024!"}'
   ```

3. **Test endpoints:**
   ```bash
   # List venues
   curl -X GET "http://localhost:8000/api/v1/venues" \
     -H "Authorization: Bearer $TOKEN"

   # Create venue
   curl -X POST "http://localhost:8000/api/v1/venues" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Venue", "code": "TEST-01", "venue_type": "rehearsal"}'

   # Get venue
   curl -X GET "http://localhost:8000/api/v1/venues/1" \
     -H "Authorization: Bearer $TOKEN"

   # Update venue
   curl -X PUT "http://localhost:8000/api/v1/venues/1" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"capacity": 100}'

   # Delete venue
   curl -X DELETE "http://localhost:8000/api/v1/venues/1" \
     -H "Authorization: Bearer $TOKEN"
   ```

### Swagger UI

Access interactive API documentation:
- URL: `http://localhost:8000/docs`
- Navigate to "Площадки" section
- Test all endpoints with built-in UI

---

## Error Handling

### Standard Error Response Format

```json
{
  "detail": "Error message in Russian"
}
```

### HTTP Status Codes

- `200 OK` - Successful GET, PUT, DELETE
- `201 Created` - Successful POST
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User account deactivated
- `404 Not Found` - Venue not found or doesn't belong to user's theater
- `409 Conflict` - Code already exists (duplicate)
- `422 Unprocessable Entity` - Validation error (Pydantic)

### Validation Errors (422)

Example response for invalid capacity:
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "capacity"],
      "msg": "Вместимость должна быть положительным числом",
      "input": -10
    }
  ]
}
```

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT Bearer token
2. **Authorization**: Theater-level isolation via `theater_id`
3. **Validation**: Pydantic schemas prevent injection and invalid data
4. **Soft Delete**: Prevents accidental data loss

---

## Performance Considerations

1. **Database Indexes**:
   - `code` field is indexed for fast uniqueness checks
   - `theater_id` is indexed for tenant filtering

2. **Query Optimization**:
   - Count queries use subqueries
   - Pagination applied at database level
   - Only active venues returned by default

3. **Scalability**:
   - Stateless service layer
   - Horizontal scaling ready
   - No N+1 query issues

---

## Future Enhancements

Potential improvements not in current scope:

1. **Search & Filtering**: Add search by name, filter by venue_type
2. **Sorting**: Support custom sort orders (by name, capacity, date)
3. **Bulk Operations**: Create/update multiple venues
4. **Venue Photos**: Attach images (like inventory items)
5. **Availability**: Track venue booking/usage schedule
6. **Relationships**: Link to schedule events, performances
