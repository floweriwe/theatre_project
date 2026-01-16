"""007_inventory_photos

Создаёт таблицу inventory_photos для хранения фотографий инвентаря.

Revision ID: 007_inventory_photos
Revises: 006_add_fk_references
Create Date: 2025-01-16 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '007_inventory_photos'
down_revision: Union[str, None] = '006_add_fk_references'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Создание таблицы inventory_photos."""

    op.create_table(
        'inventory_photos',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('caption', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(
            ['item_id'],
            ['inventory_items.id'],
            name='fk_inventory_photos_item_id',
            ondelete='CASCADE'
        ),
    )

    # Индекс для быстрого поиска фото по item_id
    op.create_index('ix_inventory_photos_item_id', 'inventory_photos', ['item_id'])


def downgrade() -> None:
    """Удаление таблицы inventory_photos."""

    op.drop_index('ix_inventory_photos_item_id', table_name='inventory_photos')
    op.drop_table('inventory_photos')
