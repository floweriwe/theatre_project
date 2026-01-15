"""
Система разрешений и ролей.

Определяет все разрешения системы, роли и их связи.
Предоставляет декоратор для проверки прав в endpoint'ах.
"""
from enum import Enum
from functools import wraps
from typing import Any, Callable

from fastapi import HTTPException


class Permission(str, Enum):
    """
    Разрешения системы.
    
    Формат: МОДУЛЬ_ДЕЙСТВИЕ
    """
    
    # -------------------------------------------------------------------------
    # Инвентарь
    # -------------------------------------------------------------------------
    INVENTORY_VIEW = "inventory:view"
    INVENTORY_CREATE = "inventory:create"
    INVENTORY_EDIT = "inventory:edit"
    INVENTORY_DELETE = "inventory:delete"
    INVENTORY_WRITE_OFF = "inventory:write_off"
    INVENTORY_RESERVE = "inventory:reserve"
    
    # -------------------------------------------------------------------------
    # Документы
    # -------------------------------------------------------------------------
    DOCUMENTS_VIEW = "documents:view"
    DOCUMENTS_VIEW_FINANCIAL = "documents:view_financial"
    DOCUMENTS_CREATE = "documents:create"
    DOCUMENTS_EDIT = "documents:edit"
    DOCUMENTS_DELETE = "documents:delete"
    
    # -------------------------------------------------------------------------
    # Спектакли
    # -------------------------------------------------------------------------
    PERFORMANCE_VIEW = "performance:view"
    PERFORMANCE_CREATE = "performance:create"
    PERFORMANCE_EDIT = "performance:edit"
    PERFORMANCE_DELETE = "performance:delete"
    
    # -------------------------------------------------------------------------
    # Расписание
    # -------------------------------------------------------------------------
    SCHEDULE_VIEW = "schedule:view"
    SCHEDULE_EDIT = "schedule:edit"
    
    # -------------------------------------------------------------------------
    # Пользователи
    # -------------------------------------------------------------------------
    USERS_VIEW = "users:view"
    USERS_CREATE = "users:create"
    USERS_EDIT = "users:edit"
    USERS_DELETE = "users:delete"
    
    # -------------------------------------------------------------------------
    # Администрирование
    # -------------------------------------------------------------------------
    ADMIN_FULL = "admin:full"
    SYSTEM_SETTINGS = "system:settings"


class Role(str, Enum):
    """
    Роли пользователей.
    
    Каждая роль имеет предопределённый набор разрешений.
    """
    
    ADMIN = "admin"               # Разработчик, полный доступ
    SYSADMIN = "sysadmin"         # Системный администратор
    DIRECTOR = "director"          # Руководитель театра
    TECH_DIRECTOR = "tech_director"   # Технический директор
    PRODUCER = "producer"          # Продюсер
    DEPARTMENT_HEAD = "department_head"  # Заведующий цехом
    ACCOUNTANT = "accountant"      # Бухгалтер
    PERFORMER = "performer"        # Исполнитель (артист)
    VIEWER = "viewer"             # Только просмотр


# Маппинг ролей на разрешения
ROLE_PERMISSIONS: dict[Role, set[Permission]] = {
    # Админ - все разрешения
    Role.ADMIN: set(Permission),
    
    # Системный администратор - управление пользователями и системой
    Role.SYSADMIN: {
        Permission.USERS_VIEW,
        Permission.USERS_CREATE,
        Permission.USERS_EDIT,
        Permission.USERS_DELETE,
        Permission.SYSTEM_SETTINGS,
        Permission.INVENTORY_VIEW,
        Permission.DOCUMENTS_VIEW,
        Permission.PERFORMANCE_VIEW,
        Permission.SCHEDULE_VIEW,
    },
    
    # Руководитель театра - просмотр всего, включая финансы
    Role.DIRECTOR: {
        Permission.INVENTORY_VIEW,
        Permission.DOCUMENTS_VIEW,
        Permission.DOCUMENTS_VIEW_FINANCIAL,
        Permission.PERFORMANCE_VIEW,
        Permission.SCHEDULE_VIEW,
        Permission.USERS_VIEW,
    },
    
    # Технический директор - управление инвентарём и спектаклями
    Role.TECH_DIRECTOR: {
        Permission.INVENTORY_VIEW,
        Permission.INVENTORY_CREATE,
        Permission.INVENTORY_EDIT,
        Permission.INVENTORY_DELETE,
        Permission.INVENTORY_WRITE_OFF,
        Permission.INVENTORY_RESERVE,
        Permission.DOCUMENTS_VIEW,
        Permission.DOCUMENTS_CREATE,
        Permission.DOCUMENTS_EDIT,
        Permission.PERFORMANCE_VIEW,
        Permission.PERFORMANCE_CREATE,
        Permission.PERFORMANCE_EDIT,
        Permission.SCHEDULE_VIEW,
        Permission.SCHEDULE_EDIT,
    },
    
    # Продюсер - управление спектаклями и расписанием
    Role.PRODUCER: {
        Permission.INVENTORY_VIEW,
        Permission.DOCUMENTS_VIEW,
        Permission.PERFORMANCE_VIEW,
        Permission.PERFORMANCE_CREATE,
        Permission.PERFORMANCE_EDIT,
        Permission.SCHEDULE_VIEW,
        Permission.SCHEDULE_EDIT,
    },
    
    # Заведующий цехом - работа с инвентарём своего подразделения
    Role.DEPARTMENT_HEAD: {
        Permission.INVENTORY_VIEW,
        Permission.INVENTORY_CREATE,
        Permission.INVENTORY_EDIT,
        Permission.INVENTORY_RESERVE,
        Permission.DOCUMENTS_VIEW,
        Permission.DOCUMENTS_CREATE,
        Permission.PERFORMANCE_VIEW,
        Permission.SCHEDULE_VIEW,
    },
    
    # Бухгалтер - документы и финансовая информация
    Role.ACCOUNTANT: {
        Permission.DOCUMENTS_VIEW,
        Permission.DOCUMENTS_VIEW_FINANCIAL,
        Permission.DOCUMENTS_CREATE,
        Permission.INVENTORY_VIEW,
    },
    
    # Артист - просмотр расписания и спектаклей
    Role.PERFORMER: {
        Permission.PERFORMANCE_VIEW,
        Permission.SCHEDULE_VIEW,
    },
    
    # Только просмотр
    Role.VIEWER: {
        Permission.INVENTORY_VIEW,
        Permission.DOCUMENTS_VIEW,
        Permission.PERFORMANCE_VIEW,
        Permission.SCHEDULE_VIEW,
    },
}


def get_permissions_for_roles(roles: list[str]) -> set[str]:
    """
    Получить объединённый набор разрешений для списка ролей.
    
    Args:
        roles: Список кодов ролей
        
    Returns:
        Множество строковых кодов разрешений
    """
    permissions: set[str] = set()
    
    for role_code in roles:
        try:
            role = Role(role_code)
            role_perms = ROLE_PERMISSIONS.get(role, set())
            permissions.update(p.value for p in role_perms)
        except ValueError:
            # Неизвестная роль - пропускаем
            continue
    
    return permissions


def has_permission(user_permissions: set[str], required: Permission) -> bool:
    """
    Проверить наличие разрешения.
    
    Учитывает ADMIN_FULL как суперправо.
    
    Args:
        user_permissions: Множество разрешений пользователя
        required: Требуемое разрешение
        
    Returns:
        True если разрешение есть
    """
    # Админ имеет все права
    if Permission.ADMIN_FULL.value in user_permissions:
        return True
    
    return required.value in user_permissions


def has_any_permission(user_permissions: set[str], required: list[Permission]) -> bool:
    """Проверить наличие хотя бы одного из разрешений."""
    return any(has_permission(user_permissions, perm) for perm in required)


def has_all_permissions(user_permissions: set[str], required: list[Permission]) -> bool:
    """Проверить наличие всех разрешений."""
    return all(has_permission(user_permissions, perm) for perm in required)


def require_permission(*permissions: Permission) -> Callable[..., Any]:
    """
    Декоратор для проверки разрешений в endpoint.
    
    Проверяет наличие ВСЕХ указанных разрешений.
    Ожидает, что current_user будет передан как keyword argument.
    
    Example:
        @router.get("/items")
        @require_permission(Permission.INVENTORY_VIEW)
        async def get_items(current_user: User = Depends(get_current_user)):
            ...
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            current_user = kwargs.get("current_user")
            
            if not current_user:
                raise HTTPException(
                    status_code=401,
                    detail="Требуется авторизация",
                )
            
            user_permissions = set(current_user.permissions)
            
            if not has_all_permissions(user_permissions, list(permissions)):
                missing = [
                    p.value for p in permissions 
                    if not has_permission(user_permissions, p)
                ]
                raise HTTPException(
                    status_code=403,
                    detail=f"Недостаточно прав. Требуются: {', '.join(missing)}",
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    
    return decorator
