"""011_checklists

Добавляет таблицы чеклистов готовности к спектаклям:
- performance_checklists — чеклисты
- checklist_items — элементы чеклистов

Revision ID: 011_checklists
Revises: 010_documents_department
Create Date: 2025-01-16 06:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '011_checklists'
down_revision: Union[str, None] = '010_documents_department'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Создание таблиц чеклистов."""

    # =========================================================================
    # performance_checklists — чеклисты готовности
    # =========================================================================

    op.create_table(
        'performance_checklists',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('performance_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        # Audit fields
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('updated_by_id', sa.Integer(), nullable=True),
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(
            ['performance_id'],
            ['performances.id'],
            name='fk_checklists_performance_id',
            ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['created_by_id'],
            ['users.id'],
            name='fk_checklists_created_by_id',
            ondelete='SET NULL'
        ),
        sa.ForeignKeyConstraint(
            ['updated_by_id'],
            ['users.id'],
            name='fk_checklists_updated_by_id',
            ondelete='SET NULL'
        ),
    )

    op.create_index(
        'ix_performance_checklists_performance_id',
        'performance_checklists',
        ['performance_id']
    )

    # =========================================================================
    # checklist_items — элементы чеклистов
    # =========================================================================

    op.create_table(
        'checklist_items',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('checklist_id', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=False),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('assigned_to_id', sa.Integer(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(
            ['checklist_id'],
            ['performance_checklists.id'],
            name='fk_checklist_items_checklist_id',
            ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['assigned_to_id'],
            ['users.id'],
            name='fk_checklist_items_assigned_to_id',
            ondelete='SET NULL'
        ),
    )

    op.create_index(
        'ix_checklist_items_checklist_id',
        'checklist_items',
        ['checklist_id']
    )


def downgrade() -> None:
    """Удаление таблиц чеклистов."""

    op.drop_table('checklist_items')
    op.drop_table('performance_checklists')
