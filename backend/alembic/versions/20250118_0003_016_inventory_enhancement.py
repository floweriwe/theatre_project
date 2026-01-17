"""Phase 13: Inventory Enhancement - Tags and Photo improvements.

Revision ID: 016_inventory_enhancement
Revises: 015_analytics_tables
Create Date: 2026-01-18

Changes:
- Add inventory_item_tags junction table for tagging inventory items
- Enhance inventory_photos table with sort_order, thumbnail, metadata
- Add icon and description fields to tags table
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '016_inventory_enhancement'
down_revision: Union[str, None] = '015_analytics_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add new columns to tags table
    op.add_column('tags', sa.Column('icon', sa.String(50), nullable=True))
    op.add_column('tags', sa.Column('description', sa.Text(), nullable=True))

    # 2. Create inventory_item_tags junction table
    op.create_table(
        'inventory_item_tags',
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ['item_id'],
            ['inventory_items.id'],
            name='fk_inventory_item_tags_item_id',
            ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['tag_id'],
            ['tags.id'],
            name='fk_inventory_item_tags_tag_id',
            ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('item_id', 'tag_id', name='pk_inventory_item_tags')
    )

    # Create indexes for better query performance
    op.create_index(
        'ix_inventory_item_tags_item_id',
        'inventory_item_tags',
        ['item_id']
    )
    op.create_index(
        'ix_inventory_item_tags_tag_id',
        'inventory_item_tags',
        ['tag_id']
    )

    # 3. Enhance inventory_photos table
    op.add_column(
        'inventory_photos',
        sa.Column('thumbnail_path', sa.String(500), nullable=True)
    )
    op.add_column(
        'inventory_photos',
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0')
    )
    op.add_column(
        'inventory_photos',
        sa.Column('width', sa.Integer(), nullable=True)
    )
    op.add_column(
        'inventory_photos',
        sa.Column('height', sa.Integer(), nullable=True)
    )
    op.add_column(
        'inventory_photos',
        sa.Column('file_size', sa.Integer(), nullable=True)
    )

    # Create index for photo sorting
    op.create_index(
        'ix_inventory_photos_sort_order',
        'inventory_photos',
        ['item_id', 'sort_order']
    )


def downgrade() -> None:
    # Remove photo enhancements
    op.drop_index('ix_inventory_photos_sort_order', table_name='inventory_photos')
    op.drop_column('inventory_photos', 'file_size')
    op.drop_column('inventory_photos', 'height')
    op.drop_column('inventory_photos', 'width')
    op.drop_column('inventory_photos', 'sort_order')
    op.drop_column('inventory_photos', 'thumbnail_path')

    # Remove inventory_item_tags table
    op.drop_index('ix_inventory_item_tags_tag_id', table_name='inventory_item_tags')
    op.drop_index('ix_inventory_item_tags_item_id', table_name='inventory_item_tags')
    op.drop_table('inventory_item_tags')

    # Remove tag enhancements
    op.drop_column('tags', 'description')
    op.drop_column('tags', 'icon')
