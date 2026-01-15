"""002b_performances_module

Добавляет таблицы модуля спектаклей:
- performances — дополняет существующую таблицу (заглушку из inventory)
- performance_sections — разделы паспорта

Revision ID: 002b_performances
Revises: 002_inventory
Create Date: 2025-01-01 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002b_performances'
down_revision: Union[str, None] = '002_inventory'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Дополнение таблицы performances и создание performance_sections."""
    
    # =========================================================================
    # Enum типы - создаём через SQL с обработкой исключения
    # =========================================================================
    
    op.execute("DO $$ BEGIN CREATE TYPE performancestatus AS ENUM ('preparation', 'in_repertoire', 'paused', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE sectiontype AS ENUM ('lighting', 'sound', 'scenery', 'props', 'costumes', 'makeup', 'video', 'effects', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    # =========================================================================
    # performances — дополняем существующую таблицу
    # =========================================================================
    
    # Добавляем недостающие колонки к таблице-заглушке из миграции inventory
    op.add_column('performances', sa.Column('subtitle', sa.String(length=255), nullable=True))
    op.add_column('performances', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('performances', sa.Column('author', sa.String(length=255), nullable=True))
    op.add_column('performances', sa.Column('director', sa.String(length=255), nullable=True))
    op.add_column('performances', sa.Column('composer', sa.String(length=255), nullable=True))
    op.add_column('performances', sa.Column('choreographer', sa.String(length=255), nullable=True))
    op.add_column('performances', sa.Column('genre', sa.String(length=100), nullable=True))
    op.add_column('performances', sa.Column('age_rating', sa.String(length=10), nullable=True))
    op.add_column('performances', sa.Column('duration_minutes', sa.Integer(), nullable=True))
    op.add_column('performances', sa.Column('intermissions', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('performances', sa.Column('premiere_date', sa.Date(), nullable=True))
    op.add_column('performances', sa.Column('status', postgresql.ENUM('preparation', 'in_repertoire', 'paused', 'archived', name='performancestatus', create_type=False), nullable=False, server_default='preparation'))
    op.add_column('performances', sa.Column('poster_path', sa.String(length=500), nullable=True))
    op.add_column('performances', sa.Column('extra_data', postgresql.JSONB(), nullable=True))
    op.add_column('performances', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('performances', sa.Column('created_by_id', sa.Integer(), nullable=True))
    op.add_column('performances', sa.Column('updated_by_id', sa.Integer(), nullable=True))
    
    # Добавляем FK для audit полей
    op.create_foreign_key(
        'fk_performances_created_by_id', 'performances', 'users',
        ['created_by_id'], ['id'], ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_performances_updated_by_id', 'performances', 'users',
        ['updated_by_id'], ['id'], ondelete='SET NULL'
    )
    
    # Создаём индексы
    op.create_index('ix_performances_title', 'performances', ['title'])
    op.create_index('ix_performances_status', 'performances', ['status'])
    op.create_index('ix_performances_theater_id', 'performances', ['theater_id'])
    
    # =========================================================================
    # performance_sections
    # =========================================================================
    
    op.create_table(
        'performance_sections',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('performance_id', sa.Integer(), nullable=False),
        sa.Column('section_type', postgresql.ENUM('lighting', 'sound', 'scenery', 'props', 'costumes', 'makeup', 'video', 'effects', 'other', name='sectiontype', create_type=False), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('responsible_id', sa.Integer(), nullable=True),
        sa.Column('data', postgresql.JSONB(), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        # Audit fields
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('updated_by_id', sa.Integer(), nullable=True),
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['performance_id'], ['performances.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['responsible_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_performance_sections_performance_id', 'performance_sections', ['performance_id'])


def downgrade() -> None:
    """Удаление дополнительных полей и таблиц модуля спектаклей."""
    
    # Удаляем таблицу sections
    op.drop_table('performance_sections')
    
    # Удаляем индексы
    op.drop_index('ix_performances_theater_id', table_name='performances')
    op.drop_index('ix_performances_status', table_name='performances')
    op.drop_index('ix_performances_title', table_name='performances')
    
    # Удаляем FK
    op.drop_constraint('fk_performances_updated_by_id', 'performances', type_='foreignkey')
    op.drop_constraint('fk_performances_created_by_id', 'performances', type_='foreignkey')
    
    # Удаляем добавленные колонки (оставляем только заглушку)
    op.drop_column('performances', 'updated_by_id')
    op.drop_column('performances', 'created_by_id')
    op.drop_column('performances', 'is_active')
    op.drop_column('performances', 'extra_data')
    op.drop_column('performances', 'poster_path')
    op.drop_column('performances', 'status')
    op.drop_column('performances', 'premiere_date')
    op.drop_column('performances', 'intermissions')
    op.drop_column('performances', 'duration_minutes')
    op.drop_column('performances', 'age_rating')
    op.drop_column('performances', 'genre')
    op.drop_column('performances', 'choreographer')
    op.drop_column('performances', 'composer')
    op.drop_column('performances', 'director')
    op.drop_column('performances', 'author')
    op.drop_column('performances', 'description')
    op.drop_column('performances', 'subtitle')
    
    # Удаляем enum типы
    op.execute('DROP TYPE IF EXISTS sectiontype')
    op.execute('DROP TYPE IF EXISTS performancestatus')
