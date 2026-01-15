"""004_schedule_module

Добавляет таблицы модуля расписания:
- schedule_events — события
- event_participants — участники событий

Revision ID: 004_schedule
Revises: 003_documents
Create Date: 2025-01-01 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '004_schedule'
down_revision: Union[str, None] = '003_documents'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Создание таблиц модуля расписания."""
    
    # =========================================================================
    # Enum типы - создаём через SQL с IF NOT EXISTS
    # =========================================================================
    
    op.execute("DO $$ BEGIN CREATE TYPE eventtype AS ENUM ('performance', 'rehearsal', 'tech_rehearsal', 'dress_rehearsal', 'meeting', 'maintenance', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE eventstatus AS ENUM ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE participantrole AS ENUM ('performer', 'technician', 'manager', 'guest', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE participantstatus AS ENUM ('invited', 'confirmed', 'declined', 'tentative'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    # =========================================================================
    # schedule_events
    # =========================================================================
    
    op.create_table(
        'schedule_events',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('event_type', postgresql.ENUM('performance', 'rehearsal', 'tech_rehearsal', 'dress_rehearsal', 'meeting', 'maintenance', 'other', name='eventtype', create_type=False), nullable=False, server_default='other'),
        sa.Column('status', postgresql.ENUM('planned', 'confirmed', 'in_progress', 'completed', 'cancelled', name='eventstatus', create_type=False), nullable=False, server_default='planned'),
        sa.Column('event_date', sa.Date(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=True),
        sa.Column('venue', sa.String(length=255), nullable=True),
        sa.Column('performance_id', sa.Integer(), nullable=True),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('extra_data', postgresql.JSONB(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        # Audit fields
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('updated_by_id', sa.Integer(), nullable=True),
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['performance_id'], ['performances.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_schedule_events_event_date', 'schedule_events', ['event_date'])
    op.create_index('ix_schedule_events_event_type', 'schedule_events', ['event_type'])
    op.create_index('ix_schedule_events_status', 'schedule_events', ['status'])
    op.create_index('ix_schedule_events_performance_id', 'schedule_events', ['performance_id'])
    op.create_index('ix_schedule_events_theater_id', 'schedule_events', ['theater_id'])
    
    # =========================================================================
    # event_participants
    # =========================================================================
    
    op.create_table(
        'event_participants',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', postgresql.ENUM('performer', 'technician', 'manager', 'guest', 'other', name='participantrole', create_type=False), nullable=False, server_default='other'),
        sa.Column('status', postgresql.ENUM('invited', 'confirmed', 'declined', 'tentative', name='participantstatus', create_type=False), nullable=False, server_default='invited'),
        sa.Column('note', sa.String(length=500), nullable=True),
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['event_id'], ['schedule_events.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('event_id', 'user_id', name='uq_event_participant'),
    )
    
    op.create_index('ix_event_participants_event_id', 'event_participants', ['event_id'])
    op.create_index('ix_event_participants_user_id', 'event_participants', ['user_id'])


def downgrade() -> None:
    """Удаление таблиц модуля расписания."""
    
    op.drop_table('event_participants')
    op.drop_table('schedule_events')
    
    # Удаляем enum типы
    op.execute('DROP TYPE IF EXISTS participantstatus')
    op.execute('DROP TYPE IF EXISTS participantrole')
    op.execute('DROP TYPE IF EXISTS eventstatus')
    op.execute('DROP TYPE IF EXISTS eventtype')
