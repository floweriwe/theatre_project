"""008_performance_inventory

Создаёт таблицу performance_inventory для связи спектаклей с реквизитом (M2M).

Revision ID: 008_performance_inventory
Revises: 007_inventory_photos
Create Date: 2025-01-16 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '008_performance_inventory'
down_revision: Union[str, None] = '007_inventory_photos'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Создание таблицы performance_inventory."""

    op.create_table(
        'performance_inventory',
        sa.Column('performance_id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('quantity_required', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        # Составной первичный ключ
        sa.PrimaryKeyConstraint('performance_id', 'item_id', name='pk_performance_inventory'),
        # Foreign keys
        sa.ForeignKeyConstraint(
            ['performance_id'],
            ['performances.id'],
            name='fk_performance_inventory_performance_id',
            ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['item_id'],
            ['inventory_items.id'],
            name='fk_performance_inventory_item_id',
            ondelete='CASCADE'
        ),
    )

    # Индексы для быстрого поиска
    op.create_index('ix_performance_inventory_performance_id', 'performance_inventory', ['performance_id'])
    op.create_index('ix_performance_inventory_item_id', 'performance_inventory', ['item_id'])


def downgrade() -> None:
    """Удаление таблицы performance_inventory."""

    op.drop_index('ix_performance_inventory_item_id', table_name='performance_inventory')
    op.drop_index('ix_performance_inventory_performance_id', table_name='performance_inventory')
    op.drop_table('performance_inventory')
