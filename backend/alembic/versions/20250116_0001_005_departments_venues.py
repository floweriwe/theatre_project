"""005_departments_venues

Добавляет таблицы:
- departments — цеха театра
- venues — площадки театра

Revision ID: 005_departments_venues
Revises: 004_schedule
Create Date: 2025-01-16 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '005_departments_venues'
down_revision: Union[str, None] = '004_schedule'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Создание таблиц departments и venues."""

    # =========================================================================
    # Enum типы - создаём через SQL с IF NOT EXISTS
    # =========================================================================

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE departmenttype AS ENUM (
                'sound', 'light', 'stage', 'costume', 'props', 'makeup', 'video'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE venuetype AS ENUM (
                'main_stage', 'rehearsal', 'warehouse', 'workshop'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # =========================================================================
    # departments — цеха театра
    # =========================================================================

    op.create_table(
        'departments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column(
            'department_type',
            postgresql.ENUM(
                'sound', 'light', 'stage', 'costume', 'props', 'makeup', 'video',
                name='departmenttype',
                create_type=False
            ),
            nullable=False
        ),
        sa.Column('head_id', sa.Integer(), nullable=True),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        # Audit fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('updated_by_id', sa.Integer(), nullable=True),
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['head_id'], ['users.id'], name='fk_departments_head_id', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], name='fk_departments_theater_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], name='fk_departments_created_by_id', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by_id'], ['users.id'], name='fk_departments_updated_by_id', ondelete='SET NULL'),
    )

    op.create_index('ix_departments_code', 'departments', ['code'])
    op.create_index('ix_departments_head_id', 'departments', ['head_id'])
    op.create_index('ix_departments_theater_id', 'departments', ['theater_id'])

    # =========================================================================
    # venues — площадки театра
    # =========================================================================

    op.create_table(
        'venues',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column(
            'venue_type',
            postgresql.ENUM(
                'main_stage', 'rehearsal', 'warehouse', 'workshop',
                name='venuetype',
                create_type=False
            ),
            nullable=False
        ),
        sa.Column('capacity', sa.Integer(), nullable=True),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        # Audit fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('updated_by_id', sa.Integer(), nullable=True),
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by_id'], ['users.id'], ondelete='SET NULL'),
    )

    op.create_index('ix_venues_code', 'venues', ['code'])
    op.create_index('ix_venues_theater_id', 'venues', ['theater_id'])

    # =========================================================================
    # Seed data — Цеха театра
    # =========================================================================

    op.execute("""
        INSERT INTO departments (name, code, department_type, description) VALUES
        ('Звукотехнический цех', 'sound', 'sound', 'Звуковое оформление спектаклей, работа с микрофонами и аппаратурой'),
        ('Световой цех', 'light', 'light', 'Световое оформление спектаклей, работа с осветительным оборудованием'),
        ('Монтажно-декорационный цех', 'stage', 'stage', 'Монтаж и демонтаж декораций, работа с механикой сцены'),
        ('Костюмерно-реквизиторский цех', 'costume', 'costume', 'Хранение и подготовка костюмов и реквизита'),
        ('Гримёрный цех', 'makeup', 'makeup', 'Грим и причёски для артистов'),
        ('Видеоотдел', 'video', 'video', 'Видеопроекции, трансляции и запись спектаклей')
    """)

    # =========================================================================
    # Seed data — Площадки театра
    # =========================================================================

    op.execute("""
        INSERT INTO venues (name, code, venue_type, capacity, description) VALUES
        ('Основная сцена', 'main-stage', 'main_stage', 500, 'Главная сцена театра для проведения спектаклей'),
        ('Репетиционный зал', 'rehearsal-hall', 'rehearsal', 50, 'Зал для репетиций'),
        ('Складское помещение', 'warehouse', 'warehouse', NULL, 'Склад для хранения декораций и оборудования'),
        ('Мастерская', 'workshop', 'workshop', NULL, 'Производственная мастерская')
    """)


def downgrade() -> None:
    """Удаление таблиц departments и venues."""

    op.drop_table('venues')
    op.drop_table('departments')

    # Удаляем enum типы
    op.execute('DROP TYPE IF EXISTS venuetype')
    op.execute('DROP TYPE IF EXISTS departmenttype')
