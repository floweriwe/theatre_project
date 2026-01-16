"""009_inventory_physical_props

Добавляет физические характеристики к предметам инвентаря:
- dimensions (габариты)
- weight (вес)
- condition (состояние)

Revision ID: 009_inventory_physical_props
Revises: 008_performance_inventory
Create Date: 2025-01-16 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '009_inventory_physical_props'
down_revision: Union[str, None] = '008_performance_inventory'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Добавление физических характеристик в inventory_items."""

    # Создаём enum тип для condition с проверкой существования
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE inventorycondition AS ENUM (
                'new', 'good', 'fair', 'poor', 'broken'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Добавляем колонки
    op.add_column(
        'inventory_items',
        sa.Column(
            'dimensions',
            sa.String(length=100),
            nullable=True,
            comment="Габариты (например, '2x3x1м')"
        )
    )

    op.add_column(
        'inventory_items',
        sa.Column(
            'weight',
            sa.Float(),
            nullable=True,
            comment="Вес в кг"
        )
    )

    op.add_column(
        'inventory_items',
        sa.Column(
            'condition',
            postgresql.ENUM(
                'new', 'good', 'fair', 'poor', 'broken',
                name='inventorycondition',
                create_type=False
            ),
            nullable=True,
            comment="Физическое состояние"
        )
    )


def downgrade() -> None:
    """Удаление физических характеристик из inventory_items."""

    op.drop_column('inventory_items', 'condition')
    op.drop_column('inventory_items', 'weight')
    op.drop_column('inventory_items', 'dimensions')

    # Удаляем enum тип
    op.execute('DROP TYPE IF EXISTS inventorycondition')
