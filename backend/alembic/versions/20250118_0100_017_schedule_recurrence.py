"""Phase 14: Schedule recurrence and calendar pro support.

Revision ID: 017_schedule_recurrence
Revises: 016_inventory_enhancement
Create Date: 2026-01-18

Adds:
- recurrence_rule field for RFC 5545 RRule format
- parent_event_id for recurring instances
- original_date for tracking modifications
- is_exception flag for recurring exceptions
- event_resources table for resource tracking
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '017_schedule_recurrence'
down_revision = '016_inventory_enhancement'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add recurrence fields to schedule_events
    op.add_column(
        'schedule_events',
        sa.Column('recurrence_rule', sa.String(500), nullable=True)
    )
    op.add_column(
        'schedule_events',
        sa.Column(
            'parent_event_id',
            sa.Integer,
            sa.ForeignKey('schedule_events.id', ondelete='CASCADE'),
            nullable=True
        )
    )
    op.add_column(
        'schedule_events',
        sa.Column('original_date', sa.Date, nullable=True)
    )
    op.add_column(
        'schedule_events',
        sa.Column('is_exception', sa.Boolean, server_default='false', nullable=False)
    )

    # Create index for parent_event_id
    op.create_index(
        'ix_schedule_events_parent_event_id',
        'schedule_events',
        ['parent_event_id']
    )

    # Create event_resources table for tracking resources used in events
    op.create_table(
        'event_resources',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column(
            'event_id',
            sa.Integer,
            sa.ForeignKey('schedule_events.id', ondelete='CASCADE'),
            nullable=False,
            index=True
        ),
        sa.Column('resource_type', sa.String(50), nullable=False),  # 'equipment', 'staff', 'space'
        sa.Column('resource_id', sa.Integer, nullable=False),  # ID of the resource
        sa.Column('quantity', sa.Integer, server_default='1', nullable=False),
        sa.Column('notes', sa.String(500), nullable=True),
        sa.Column('is_confirmed', sa.Boolean, server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # Create unique constraint for resource booking
    op.create_unique_constraint(
        'uq_event_resources_event_resource',
        'event_resources',
        ['event_id', 'resource_type', 'resource_id']
    )

    # Create index for resource lookups
    op.create_index(
        'ix_event_resources_resource',
        'event_resources',
        ['resource_type', 'resource_id']
    )


def downgrade() -> None:
    # Drop event_resources table
    op.drop_index('ix_event_resources_resource', 'event_resources')
    op.drop_constraint('uq_event_resources_event_resource', 'event_resources')
    op.drop_table('event_resources')

    # Remove recurrence fields from schedule_events
    op.drop_index('ix_schedule_events_parent_event_id', 'schedule_events')
    op.drop_column('schedule_events', 'is_exception')
    op.drop_column('schedule_events', 'original_date')
    op.drop_column('schedule_events', 'parent_event_id')
    op.drop_column('schedule_events', 'recurrence_rule')
