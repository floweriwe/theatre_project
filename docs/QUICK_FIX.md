# Quick Fix Guide - Backend Critical Bugs

## Critical Bug #1: BaseRepository.update() signature mismatch

### Problem
```python
# BaseRepository expects:
async def update(self, instance: ModelType, data: dict) -> ModelType

# Services call it as:
await repo.update(entity_id, data)  # ❌ TypeError!
```

### Fix
Add new method to `backend/app/repositories/base.py`:

```python
async def update(self, id: int, data: dict[str, Any]) -> ModelType:
    """Update entity by ID."""
    instance = await self.get_by_id(id)
    if not instance:
        raise NotFoundError(f"Entity with id {id} not found")
    
    for key, value in data.items():
        if hasattr(instance, key):
            setattr(instance, key, value)
    
    await self._session.flush()
    await self._session.refresh(instance)
    return instance
```

**Affected files:**
- `backend/app/services/inventory_service.py` (lines 133, 141, 223, 369)
- `backend/app/services/performance_service.py`
- `backend/app/services/document_service.py`
- `backend/app/services/schedule_service.py`

---

## Critical Bug #2: Wrong unique() order in search()

### Problem
```python
# inventory_repository.py:215
items = result.scalars().unique().all()  # ❌ Wrong order with joinedload
```

### Fix
Change order in `backend/app/repositories/inventory_repository.py:215`:

```python
items = result.unique().scalars().all()  # ✅ Correct order
```

**Why:** With `joinedload`, SQLAlchemy returns duplicate rows for each joined relationship. 
Must call `unique()` BEFORE `scalars()` to deduplicate rows correctly.

---

## Testing Fix

```bash
# Restart backend
docker-compose -f docker-compose.dev.yml restart backend

# Test detail endpoint
curl http://localhost:8000/api/v1/inventory/items/1

# Expected: 200 OK with full item data including category and location
```

---

## Estimated Time
- Fix #1: 30 minutes
- Fix #2: 5 minutes
- Testing: 15 minutes
**Total: ~1 hour**
