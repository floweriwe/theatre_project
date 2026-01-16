"""006_add_fk_references

Добавляет FK ссылки:
- users.department_id -> departments
- schedule_events.venue_id -> venues

Revision ID: 006_add_fk_references
Revises: 005_departments_venues
Create Date: 2025-01-16 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '006_add_fk_references'
down_revision: Union[str, None] = '005_departments_venues'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Добавление FK ссылок."""

    # =========================================================================
    # users.department_id
    # =========================================================================

    op.add_column(
        'users',
        sa.Column('department_id', sa.Integer(), nullable=True)
    )
    op.create_index('ix_users_department_id', 'users', ['department_id'])
    op.create_foreign_key(
        'fk_users_department_id',
        'users', 'departments',
        ['department_id'], ['id'],
        ondelete='SET NULL'
    )

    # =========================================================================
    # schedule_events.venue_id
    # =========================================================================

    op.add_column(
        'schedule_events',
        sa.Column('venue_id', sa.Integer(), nullable=True)
    )
    op.create_index('ix_schedule_events_venue_id', 'schedule_events', ['venue_id'])
    op.create_foreign_key(
        'fk_schedule_events_venue_id',
        'schedule_events', 'venues',
        ['venue_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    """Удаление FK ссылок."""

    # schedule_events.venue_id
    op.drop_constraint('fk_schedule_events_venue_id', 'schedule_events', type_='foreignkey')
    op.drop_index('ix_schedule_events_venue_id', table_name='schedule_events')
    op.drop_column('schedule_events', 'venue_id')

    # users.department_id
    op.drop_constraint('fk_users_department_id', 'users', type_='foreignkey')
    op.drop_index('ix_users_department_id', table_name='users')
    op.drop_column('users', 'department_id')
