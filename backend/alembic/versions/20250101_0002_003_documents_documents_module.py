"""003_documents_module

Добавляет таблицы модуля документооборота:
- document_categories — категории документов
- tags — теги
- documents — документы
- document_versions — версии документов
- document_tags — связь документов и тегов

Revision ID: 003_documents
Revises: 002b_performances
Create Date: 2025-01-01 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '003_documents'
down_revision: Union[str, None] = '002b_performances'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Создание таблиц модуля документооборота."""
    
    # =========================================================================
    # Enum типы - создаём через SQL с IF NOT EXISTS
    # =========================================================================
    
    op.execute("DO $$ BEGIN CREATE TYPE documentstatus AS ENUM ('draft', 'active', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE filetype AS ENUM ('pdf', 'document', 'spreadsheet', 'image', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    # =========================================================================
    # document_categories
    # =========================================================================
    
    op.create_table(
        'document_categories',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('required_permissions', postgresql.JSONB(), nullable=True),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        # Audit fields
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('updated_by_id', sa.Integer(), nullable=True),
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['parent_id'], ['document_categories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_document_categories_code', 'document_categories', ['code'])
    op.create_index('ix_document_categories_theater_id', 'document_categories', ['theater_id'])
    
    # =========================================================================
    # tags
    # =========================================================================
    
    op.create_table(
        'tags',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False, unique=True),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
    )
    
    op.create_index('ix_tags_name', 'tags', ['name'])
    
    # =========================================================================
    # documents
    # =========================================================================
    
    op.create_table(
        'documents',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('file_type', postgresql.ENUM('pdf', 'document', 'spreadsheet', 'image', 'other', name='filetype', create_type=False), nullable=False, server_default='other'),
        sa.Column('current_version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', postgresql.ENUM('draft', 'active', 'archived', name='documentstatus', create_type=False), nullable=False, server_default='active'),
        sa.Column('performance_id', sa.Integer(), nullable=True),
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
        sa.ForeignKeyConstraint(['category_id'], ['document_categories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['performance_id'], ['performances.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_documents_name', 'documents', ['name'])
    op.create_index('ix_documents_category_id', 'documents', ['category_id'])
    op.create_index('ix_documents_status', 'documents', ['status'])
    op.create_index('ix_documents_theater_id', 'documents', ['theater_id'])
    
    # =========================================================================
    # document_versions
    # =========================================================================
    
    op.create_table(
        'document_versions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_document_versions_document_id', 'document_versions', ['document_id'])
    
    # =========================================================================
    # document_tags (many-to-many)
    # =========================================================================
    
    op.create_table(
        'document_tags',
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('document_id', 'tag_id'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
    )
    
    # =========================================================================
    # Начальные данные — Категории по умолчанию
    # =========================================================================
    
    op.execute("""
        INSERT INTO document_categories (name, code, description, color, icon, sort_order) VALUES
        ('Приказы', 'orders', 'Приказы и распоряжения', '#EF4444', 'file-text', 1),
        ('Договоры', 'contracts', 'Договоры и соглашения', '#3B82F6', 'file-signature', 2),
        ('Финансовые документы', 'finance', 'Счета, акты, сметы', '#10B981', 'wallet', 3),
        ('Кадровые документы', 'hr', 'Документы по персоналу', '#8B5CF6', 'users', 4),
        ('Технические документы', 'technical', 'Технические паспорта, схемы', '#F59E0B', 'settings', 5),
        ('Творческие материалы', 'creative', 'Сценарии, либретто, партитуры', '#EC4899', 'music', 6),
        ('Афиши и программки', 'promo', 'Рекламные материалы', '#06B6D4', 'image', 7),
        ('Прочее', 'other', 'Прочие документы', '#6B7280', 'folder', 100)
    """)


def downgrade() -> None:
    """Удаление таблиц модуля документооборота."""
    
    op.drop_table('document_tags')
    op.drop_table('document_versions')
    op.drop_table('documents')
    op.drop_table('tags')
    op.drop_table('document_categories')
    
    # Удаляем enum типы
    op.execute('DROP TYPE IF EXISTS filetype')
    op.execute('DROP TYPE IF EXISTS documentstatus')
