"""Initial migration: users, roles, theaters

Revision ID: 001_initial
Revises: 
Create Date: 2025-01-01 00:00:00.000000

Создаёт начальные таблицы:
- theaters: Театры (tenants)
- users: Пользователи
- roles: Роли с разрешениями
- user_roles: Связь пользователь-роль
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Применить миграцию."""
    
    # =========================================================================
    # Таблица theaters (театры / tenants)
    # =========================================================================
    op.create_table(
        'theaters',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('database_name', sa.String(length=100), nullable=False),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('website', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
        sa.UniqueConstraint('database_name'),
    )
    op.create_index('ix_theaters_code', 'theaters', ['code'], unique=True)
    
    # =========================================================================
    # Таблица users (пользователи)
    # =========================================================================
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('patronymic', sa.String(length=100), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_theater_id', 'users', ['theater_id'], unique=False)
    
    # =========================================================================
    # Таблица roles (роли)
    # =========================================================================
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('permissions', postgresql.ARRAY(sa.String(length=100)), nullable=False, server_default='{}'),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
    )
    op.create_index('ix_roles_code', 'roles', ['code'], unique=True)
    op.create_index('ix_roles_theater_id', 'roles', ['theater_id'], unique=False)
    
    # =========================================================================
    # Таблица user_roles (связь пользователь-роль)
    # =========================================================================
    op.create_table(
        'user_roles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('assigned_by_id', sa.Integer(), nullable=True),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['assigned_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_user_roles_user_id', 'user_roles', ['user_id'], unique=False)
    op.create_index('ix_user_roles_role_id', 'user_roles', ['role_id'], unique=False)
    
    # Уникальный индекс: один пользователь не может иметь одну роль дважды
    op.create_index(
        'ix_user_roles_user_role_unique',
        'user_roles',
        ['user_id', 'role_id'],
        unique=True,
    )
    
    # =========================================================================
    # Начальные данные: системные роли
    # =========================================================================
    op.execute("""
        INSERT INTO roles (name, code, description, permissions, is_system) VALUES
        ('Администратор', 'admin', 'Полный доступ ко всем функциям системы', 
         ARRAY['admin:full'], true),
        ('Системный администратор', 'sysadmin', 'Управление пользователями и настройками', 
         ARRAY['users:view', 'users:create', 'users:edit', 'users:delete', 'system:settings', 
               'inventory:view', 'documents:view', 'performance:view', 'schedule:view'], true),
        ('Руководитель', 'director', 'Просмотр всех данных, включая финансовые', 
         ARRAY['inventory:view', 'documents:view', 'documents:view_financial', 
               'performance:view', 'schedule:view', 'users:view'], true),
        ('Технический директор', 'tech_director', 'Управление инвентарём и спектаклями', 
         ARRAY['inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete',
               'inventory:write_off', 'inventory:reserve', 'documents:view', 'documents:create',
               'documents:edit', 'performance:view', 'performance:create', 'performance:edit',
               'schedule:view', 'schedule:edit'], true),
        ('Продюсер', 'producer', 'Управление спектаклями и расписанием', 
         ARRAY['inventory:view', 'documents:view', 'performance:view', 'performance:create',
               'performance:edit', 'schedule:view', 'schedule:edit'], true),
        ('Заведующий цехом', 'department_head', 'Работа с инвентарём подразделения', 
         ARRAY['inventory:view', 'inventory:create', 'inventory:edit', 'inventory:reserve',
               'documents:view', 'documents:create', 'performance:view', 'schedule:view'], true),
        ('Бухгалтер', 'accountant', 'Работа с документами и финансовой информацией', 
         ARRAY['documents:view', 'documents:view_financial', 'documents:create', 'inventory:view'], true),
        ('Артист', 'performer', 'Просмотр расписания и спектаклей', 
         ARRAY['performance:view', 'schedule:view'], true),
        ('Наблюдатель', 'viewer', 'Только просмотр информации', 
         ARRAY['inventory:view', 'documents:view', 'performance:view', 'schedule:view'], true)
    """)


def downgrade() -> None:
    """Откатить миграцию."""
    op.drop_index('ix_user_roles_user_role_unique', table_name='user_roles')
    op.drop_index('ix_user_roles_role_id', table_name='user_roles')
    op.drop_index('ix_user_roles_user_id', table_name='user_roles')
    op.drop_table('user_roles')
    
    op.drop_index('ix_roles_theater_id', table_name='roles')
    op.drop_index('ix_roles_code', table_name='roles')
    op.drop_table('roles')
    
    op.drop_index('ix_users_theater_id', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
    
    op.drop_index('ix_theaters_code', table_name='theaters')
    op.drop_table('theaters')
