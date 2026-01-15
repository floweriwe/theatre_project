"""002_inventory_module

Добавляет таблицы модуля инвентаризации:
- inventory_categories — категории инвентаря
- storage_locations — места хранения
- inventory_items — предметы инвентаря
- inventory_movements — история перемещений

Revision ID: 002_inventory
Revises: 001_initial
Create Date: 2025-01-01 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002_inventory'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Создание таблиц модуля инвентаризации."""
    
    # =========================================================================
    # Enum типы - создаём через SQL с IF NOT EXISTS
    # =========================================================================
    
    op.execute("DO $$ BEGIN CREATE TYPE itemstatus AS ENUM ('in_stock', 'reserved', 'in_use', 'repair', 'written_off'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE movementtype AS ENUM ('receipt', 'transfer', 'reserve', 'release', 'issue', 'return', 'write_off', 'repair_start', 'repair_end'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    # =========================================================================
    # inventory_categories
    # =========================================================================
    
    op.create_table(
        'inventory_categories',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        # Audit fields
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('updated_by_id', sa.Integer(), nullable=True),
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['parent_id'], ['inventory_categories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_inventory_categories_code', 'inventory_categories', ['code'])
    op.create_index('ix_inventory_categories_theater_id', 'inventory_categories', ['theater_id'])
    op.create_index('ix_inventory_categories_parent_id', 'inventory_categories', ['parent_id'])
    
    # =========================================================================
    # storage_locations
    # =========================================================================
    
    op.create_table(
        'storage_locations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('address', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        # Audit fields
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('updated_by_id', sa.Integer(), nullable=True),
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['parent_id'], ['storage_locations.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_storage_locations_code', 'storage_locations', ['code'])
    op.create_index('ix_storage_locations_theater_id', 'storage_locations', ['theater_id'])
    op.create_index('ix_storage_locations_parent_id', 'storage_locations', ['parent_id'])
    
    # =========================================================================
    # performances (заглушка для FK)
    # =========================================================================
    
    op.create_table(
        'performances',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
    )
    
    # =========================================================================
    # inventory_items
    # =========================================================================
    
    op.create_table(
        'inventory_items',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('inventory_number', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('location_id', sa.Integer(), nullable=True),
        sa.Column('status', postgresql.ENUM('in_stock', 'reserved', 'in_use', 'repair', 'written_off', name='itemstatus', create_type=False), nullable=False, server_default='in_stock'),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('purchase_price', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('current_value', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('purchase_date', sa.DateTime(), nullable=True),
        sa.Column('warranty_until', sa.DateTime(), nullable=True),
        sa.Column('custom_fields', postgresql.JSONB(), nullable=True),
        sa.Column('images', postgresql.JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        # Audit fields
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('updated_by_id', sa.Integer(), nullable=True),
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('inventory_number'),
        sa.ForeignKeyConstraint(['category_id'], ['inventory_categories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['location_id'], ['storage_locations.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_inventory_items_name', 'inventory_items', ['name'])
    op.create_index('ix_inventory_items_inventory_number', 'inventory_items', ['inventory_number'])
    op.create_index('ix_inventory_items_category_id', 'inventory_items', ['category_id'])
    op.create_index('ix_inventory_items_location_id', 'inventory_items', ['location_id'])
    op.create_index('ix_inventory_items_status', 'inventory_items', ['status'])
    op.create_index('ix_inventory_items_theater_id', 'inventory_items', ['theater_id'])
    
    # =========================================================================
    # inventory_movements
    # =========================================================================
    
    op.create_table(
        'inventory_movements',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('movement_type', postgresql.ENUM('receipt', 'transfer', 'reserve', 'release', 'issue', 'return', 'write_off', 'repair_start', 'repair_end', name='movementtype', create_type=False), nullable=False),
        sa.Column('from_location_id', sa.Integer(), nullable=True),
        sa.Column('to_location_id', sa.Integer(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('performance_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['from_location_id'], ['storage_locations.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['to_location_id'], ['storage_locations.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['performance_id'], ['performances.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_inventory_movements_item_id', 'inventory_movements', ['item_id'])
    op.create_index('ix_inventory_movements_created_at', 'inventory_movements', ['created_at'])
    
    # =========================================================================
    # Начальные данные — Категории по умолчанию
    # =========================================================================
    
    op.execute("""
        INSERT INTO inventory_categories (name, code, description, color, icon, sort_order) VALUES
        ('Реквизит', 'props', 'Предметы реквизита для спектаклей', '#3B82F6', 'package', 1),
        ('Костюмы', 'costumes', 'Театральные костюмы', '#8B5CF6', 'shirt', 2),
        ('Декорации', 'scenery', 'Декорации и сценическое оформление', '#10B981', 'layout', 3),
        ('Мебель', 'furniture', 'Сценическая мебель', '#F59E0B', 'armchair', 4),
        ('Оборудование', 'equipment', 'Техническое оборудование', '#EF4444', 'settings', 5),
        ('Свет', 'lighting', 'Световое оборудование', '#F97316', 'lightbulb', 6),
        ('Звук', 'sound', 'Звуковое оборудование', '#06B6D4', 'volume-2', 7),
        ('Прочее', 'other', 'Прочие предметы', '#6B7280', 'more-horizontal', 100)
    """)
    
    # =========================================================================
    # Начальные данные — Места хранения по умолчанию
    # =========================================================================
    
    op.execute("""
        INSERT INTO storage_locations (name, code, description, sort_order) VALUES
        ('Основной склад', 'main-warehouse', 'Основное складское помещение', 1),
        ('Костюмерная', 'costume-room', 'Помещение для хранения костюмов', 2),
        ('Реквизиторская', 'props-room', 'Помещение для хранения реквизита', 3),
        ('Сцена', 'stage', 'Основная сцена театра', 4),
        ('Закулисье', 'backstage', 'Закулисное пространство', 5)
    """)


def downgrade() -> None:
    """Удаление таблиц модуля инвентаризации."""
    
    op.drop_table('inventory_movements')
    op.drop_table('inventory_items')
    op.drop_table('performances')
    op.drop_table('storage_locations')
    op.drop_table('inventory_categories')
    
    # Удаляем enum типы
    op.execute('DROP TYPE IF EXISTS movementtype')
    op.execute('DROP TYPE IF EXISTS itemstatus')
