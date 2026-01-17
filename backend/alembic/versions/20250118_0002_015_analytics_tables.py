"""Add analytics and reporting tables.

Revision ID: 015_analytics_tables
Revises: 014_performance_hub_schema
Create Date: 2026-01-18

Tables:
- report_templates: шаблоны отчётов
- scheduled_reports: запланированные отчёты
- analytics_snapshots: снапшоты аналитических данных
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '015_analytics_tables'
down_revision: Union[str, None] = '014_performance_hub_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ENUM types
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE reportcategory AS ENUM (
                'performance', 'inventory', 'schedule', 'hr', 'financial', 'custom'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE reportformat AS ENUM (
                'pdf', 'excel', 'html', 'json'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE schedulefrequency AS ENUM (
                'daily', 'weekly', 'monthly', 'on_demand'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE analyticsmetrictype AS ENUM (
                'count', 'sum', 'average', 'percentage', 'trend'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create report_templates table
    op.create_table(
        'report_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column(
            'category',
            postgresql.ENUM('performance', 'inventory', 'schedule', 'hr', 'financial', 'custom',
                          name='reportcategory', create_type=False),
            nullable=False
        ),
        sa.Column('structure', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column(
            'default_format',
            postgresql.ENUM('pdf', 'excel', 'html', 'json',
                          name='reportformat', create_type=False),
            nullable=False,
            server_default='pdf'
        ),
        sa.Column('default_filters', postgresql.JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_report_templates_theater_id', 'report_templates', ['theater_id'])
    op.create_index('ix_report_templates_category', 'report_templates', ['category'])

    # Create scheduled_reports table
    op.create_table(
        'scheduled_reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column(
            'frequency',
            postgresql.ENUM('daily', 'weekly', 'monthly', 'on_demand',
                          name='schedulefrequency', create_type=False),
            nullable=False,
            server_default='weekly'
        ),
        sa.Column('cron_expression', sa.String(100), nullable=True),
        sa.Column('recipients', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column(
            'format',
            postgresql.ENUM('pdf', 'excel', 'html', 'json',
                          name='reportformat', create_type=False),
            nullable=False,
            server_default='pdf'
        ),
        sa.Column('filters', postgresql.JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_run_status', sa.String(50), nullable=True),
        sa.Column('next_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['template_id'], ['report_templates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_scheduled_reports_template_id', 'scheduled_reports', ['template_id'])
    op.create_index('ix_scheduled_reports_theater_id', 'scheduled_reports', ['theater_id'])
    op.create_index('ix_scheduled_reports_next_run_at', 'scheduled_reports', ['next_run_at'])

    # Create analytics_snapshots table
    op.create_table(
        'analytics_snapshots',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            'metric_type',
            postgresql.ENUM('count', 'sum', 'average', 'percentage', 'trend',
                          name='analyticsmetrictype', create_type=False),
            nullable=False
        ),
        sa.Column('metric_name', sa.String(100), nullable=False),
        sa.Column('period_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('period_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('value', postgresql.JSONB(), nullable=False),
        sa.Column('context', postgresql.JSONB(), nullable=True),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_analytics_snapshots_theater_id', 'analytics_snapshots', ['theater_id'])
    op.create_index('ix_analytics_snapshots_metric_name', 'analytics_snapshots', ['metric_name'])
    op.create_index('ix_analytics_snapshots_period', 'analytics_snapshots', ['period_start', 'period_end'])


def downgrade() -> None:
    # Drop tables
    op.drop_table('analytics_snapshots')
    op.drop_table('scheduled_reports')
    op.drop_table('report_templates')

    # Drop ENUM types
    op.execute("DROP TYPE IF EXISTS analyticsmetrictype")
    op.execute("DROP TYPE IF EXISTS schedulefrequency")
    op.execute("DROP TYPE IF EXISTS reportformat")
    op.execute("DROP TYPE IF EXISTS reportcategory")
