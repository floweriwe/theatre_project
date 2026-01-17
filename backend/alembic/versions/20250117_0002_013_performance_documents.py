"""013_performance_documents

Добавляет таблицу документов спектакля:
- performance_documents — документы спектакля с категоризацией

Revision ID: 013_performance_documents
Revises: 012_document_templates
Create Date: 2025-01-17 12:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '013_performance_documents'
down_revision: Union[str, None] = '012_document_templates'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Создание таблицы документов спектакля."""

    # =========================================================================
    # Создание ENUM типов
    # =========================================================================

    # DocumentSection enum (разделы паспорта)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE documentsection AS ENUM (
                '1.0', '2.0', '3.0', '4.0'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # PerformanceDocumentCategory enum (категории документов)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE performancedocumentcategory AS ENUM (
                'passport', 'reception_act', 'fire_protection', 'welding_acts',
                'material_certs', 'calculations',
                'sketches', 'tech_spec_decor', 'tech_spec_light', 'tech_spec_costume',
                'tech_spec_props', 'tech_spec_sound',
                'decor_photos', 'layouts', 'mount_list', 'hanging_list',
                'mount_instruction', 'light_partition', 'sound_partition',
                'video_partition', 'costume_list', 'makeup_card',
                'rider', 'estimates', 'drawings',
                'other'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # ReportInclusion enum
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE reportinclusion AS ENUM (
                'full', 'partial', 'excluded'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # =========================================================================
    # performance_documents — документы спектакля
    # =========================================================================

    op.create_table(
        'performance_documents',
        # Primary key
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),

        # Связь со спектаклем
        sa.Column('performance_id', sa.Integer(), nullable=False),

        # Файл
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),

        # Категоризация
        sa.Column(
            'section',
            postgresql.ENUM('1.0', '2.0', '3.0', '4.0',
                            name='documentsection', create_type=False),
            nullable=False
        ),
        sa.Column(
            'category',
            postgresql.ENUM(
                'passport', 'reception_act', 'fire_protection', 'welding_acts',
                'material_certs', 'calculations',
                'sketches', 'tech_spec_decor', 'tech_spec_light', 'tech_spec_costume',
                'tech_spec_props', 'tech_spec_sound',
                'decor_photos', 'layouts', 'mount_list', 'hanging_list',
                'mount_instruction', 'light_partition', 'sound_partition',
                'video_partition', 'costume_list', 'makeup_card',
                'rider', 'estimates', 'drawings',
                'other',
                name='performancedocumentcategory', create_type=False),
            nullable=False
        ),
        sa.Column('subcategory', sa.String(length=100), nullable=True),

        # Отображение
        sa.Column('display_name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),

        # Связь с отчётом
        sa.Column(
            'report_inclusion',
            postgresql.ENUM('full', 'partial', 'excluded',
                            name='reportinclusion', create_type=False),
            nullable=False,
            server_default='full'
        ),
        sa.Column('report_page', sa.Integer(), nullable=True),

        # Версионирование
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('is_current', sa.Boolean(), nullable=False, server_default='true'),

        # Аудит
        sa.Column('uploaded_by_id', sa.Integer(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),

        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('file_path', name='uq_performance_documents_file_path'),
        sa.ForeignKeyConstraint(
            ['performance_id'],
            ['performances.id'],
            name='fk_performance_documents_performance_id',
            ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['uploaded_by_id'],
            ['users.id'],
            name='fk_performance_documents_uploaded_by_id',
            ondelete='SET NULL'
        ),
        sa.ForeignKeyConstraint(
            ['parent_id'],
            ['performance_documents.id'],
            name='fk_performance_documents_parent_id',
            ondelete='SET NULL'
        ),
    )

    # =========================================================================
    # Индексы
    # =========================================================================

    op.create_index(
        'ix_performance_documents_performance_id',
        'performance_documents',
        ['performance_id']
    )
    op.create_index(
        'ix_performance_documents_section',
        'performance_documents',
        ['section']
    )
    op.create_index(
        'ix_performance_documents_category',
        'performance_documents',
        ['category']
    )
    op.create_index(
        'ix_performance_documents_uploaded_by_id',
        'performance_documents',
        ['uploaded_by_id']
    )
    op.create_index(
        'ix_performance_documents_is_current',
        'performance_documents',
        ['is_current']
    )
    # Композитные индексы для частых запросов
    op.create_index(
        'ix_performance_documents_perf_section',
        'performance_documents',
        ['performance_id', 'section']
    )
    op.create_index(
        'ix_performance_documents_perf_category',
        'performance_documents',
        ['performance_id', 'category']
    )


def downgrade() -> None:
    """Удаление таблицы документов спектакля."""

    # Удаление индексов
    op.drop_index('ix_performance_documents_perf_category', table_name='performance_documents')
    op.drop_index('ix_performance_documents_perf_section', table_name='performance_documents')
    op.drop_index('ix_performance_documents_is_current', table_name='performance_documents')
    op.drop_index('ix_performance_documents_uploaded_by_id', table_name='performance_documents')
    op.drop_index('ix_performance_documents_category', table_name='performance_documents')
    op.drop_index('ix_performance_documents_section', table_name='performance_documents')
    op.drop_index('ix_performance_documents_performance_id', table_name='performance_documents')

    # Удаление таблицы
    op.drop_table('performance_documents')

    # Удаление ENUM типов
    op.execute("DROP TYPE IF EXISTS reportinclusion;")
    op.execute("DROP TYPE IF EXISTS performancedocumentcategory;")
    op.execute("DROP TYPE IF EXISTS documentsection;")
