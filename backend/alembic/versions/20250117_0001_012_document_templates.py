"""012_document_templates

Добавляет таблицы шаблонов документов:
- document_templates — шаблоны документов
- document_template_variables — переменные шаблонов

Также добавляет поля в documents для связи с шаблоном:
- generated_from_template_id
- generation_data

Revision ID: 012_document_templates
Revises: 011_checklists
Create Date: 2025-01-17 10:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '012_document_templates'
down_revision: Union[str, None] = '011_checklists'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Создание таблиц шаблонов документов."""

    # =========================================================================
    # Создание ENUM типов
    # =========================================================================

    # TemplateType enum
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE templatetype AS ENUM (
                'passport', 'contract', 'schedule', 'report', 'checklist', 'custom'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # VariableType enum
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE variabletype AS ENUM (
                'text', 'number', 'date', 'choice',
                'performance_field', 'user_field', 'actor_list', 'staff_list'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # =========================================================================
    # document_templates — шаблоны документов
    # =========================================================================

    op.create_table(
        'document_templates',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column(
            'template_type',
            postgresql.ENUM('passport', 'contract', 'schedule', 'report', 'checklist', 'custom',
                            name='templatetype', create_type=False),
            nullable=False,
            server_default='custom'
        ),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('default_output_format', sa.String(length=10), nullable=False, server_default='docx'),
        sa.Column('settings', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        # Audit fields
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('updated_by_id', sa.Integer(), nullable=True),
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code', name='uq_document_templates_code'),
        sa.ForeignKeyConstraint(
            ['theater_id'],
            ['theaters.id'],
            name='fk_document_templates_theater_id',
            ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['created_by_id'],
            ['users.id'],
            name='fk_document_templates_created_by_id',
            ondelete='SET NULL'
        ),
        sa.ForeignKeyConstraint(
            ['updated_by_id'],
            ['users.id'],
            name='fk_document_templates_updated_by_id',
            ondelete='SET NULL'
        ),
    )

    op.create_index(
        'ix_document_templates_code',
        'document_templates',
        ['code']
    )

    op.create_index(
        'ix_document_templates_template_type',
        'document_templates',
        ['template_type']
    )

    op.create_index(
        'ix_document_templates_theater_id',
        'document_templates',
        ['theater_id']
    )

    # =========================================================================
    # document_template_variables — переменные шаблонов
    # =========================================================================

    op.create_table(
        'document_template_variables',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('label', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column(
            'variable_type',
            postgresql.ENUM('text', 'number', 'date', 'choice',
                            'performance_field', 'user_field', 'actor_list', 'staff_list',
                            name='variabletype', create_type=False),
            nullable=False,
            server_default='text'
        ),
        sa.Column('default_value', sa.Text(), nullable=True),
        sa.Column('is_required', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('source_field', sa.String(length=255), nullable=True),
        sa.Column('choices', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('group_name', sa.String(length=100), nullable=True),
        sa.Column('validation_rules', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(
            ['template_id'],
            ['document_templates.id'],
            name='fk_template_variables_template_id',
            ondelete='CASCADE'
        ),
    )

    op.create_index(
        'ix_document_template_variables_template_id',
        'document_template_variables',
        ['template_id']
    )

    # =========================================================================
    # Добавление полей в documents
    # =========================================================================

    op.add_column(
        'documents',
        sa.Column('generated_from_template_id', sa.Integer(), nullable=True)
    )

    op.add_column(
        'documents',
        sa.Column('generation_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True)
    )

    op.create_foreign_key(
        'fk_documents_generated_from_template_id',
        'documents',
        'document_templates',
        ['generated_from_template_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # =========================================================================
    # Seed Data — базовые шаблоны
    # =========================================================================

    # Вставка шаблона "Паспорт спектакля"
    op.execute("""
        INSERT INTO document_templates (name, code, description, file_path, file_name, template_type, is_system, default_output_format)
        VALUES (
            'Паспорт спектакля',
            'PASSPORT',
            'Стандартный паспорт спектакля с основной информацией: название, режиссёр, актёрский состав, технические требования',
            'templates/passport_template.docx',
            'passport_template.docx',
            'passport',
            true,
            'pdf'
        );
    """)

    # Получаем ID только что вставленного шаблона и добавляем переменные
    op.execute("""
        INSERT INTO document_template_variables (template_id, name, label, description, variable_type, is_required, source_field, sort_order, group_name)
        SELECT id, 'performance_title', 'Название спектакля', 'Официальное название спектакля', 'performance_field', true, 'performance.title', 1, 'Основная информация'
        FROM document_templates WHERE code = 'PASSPORT';
    """)

    op.execute("""
        INSERT INTO document_template_variables (template_id, name, label, description, variable_type, is_required, source_field, sort_order, group_name)
        SELECT id, 'author', 'Автор пьесы', 'Автор оригинального произведения', 'performance_field', false, 'performance.author', 2, 'Основная информация'
        FROM document_templates WHERE code = 'PASSPORT';
    """)

    op.execute("""
        INSERT INTO document_template_variables (template_id, name, label, description, variable_type, is_required, source_field, sort_order, group_name)
        SELECT id, 'director', 'Режиссёр-постановщик', 'Режиссёр спектакля', 'text', true, NULL, 3, 'Основная информация'
        FROM document_templates WHERE code = 'PASSPORT';
    """)

    op.execute("""
        INSERT INTO document_template_variables (template_id, name, label, description, variable_type, is_required, source_field, sort_order, group_name)
        SELECT id, 'premiere_date', 'Дата премьеры', 'Дата премьерного показа', 'date', false, 'performance.premiere_date', 4, 'Основная информация'
        FROM document_templates WHERE code = 'PASSPORT';
    """)

    op.execute("""
        INSERT INTO document_template_variables (template_id, name, label, description, variable_type, is_required, source_field, sort_order, group_name)
        SELECT id, 'duration', 'Продолжительность', 'Продолжительность спектакля (мин)', 'number', false, 'performance.duration_minutes', 5, 'Основная информация'
        FROM document_templates WHERE code = 'PASSPORT';
    """)

    op.execute("""
        INSERT INTO document_template_variables (template_id, name, label, description, variable_type, is_required, source_field, sort_order, group_name)
        SELECT id, 'cast_list', 'Актёрский состав', 'Список актёров и их ролей', 'actor_list', true, NULL, 6, 'Творческий состав'
        FROM document_templates WHERE code = 'PASSPORT';
    """)

    op.execute("""
        INSERT INTO document_template_variables (template_id, name, label, description, variable_type, is_required, source_field, sort_order, group_name)
        SELECT id, 'technical_requirements', 'Технические требования', 'Описание технических требований к площадке', 'text', false, NULL, 7, 'Технические данные'
        FROM document_templates WHERE code = 'PASSPORT';
    """)

    # Вставка шаблона "Договор с артистом"
    op.execute("""
        INSERT INTO document_templates (name, code, description, file_path, file_name, template_type, is_system, default_output_format)
        VALUES (
            'Договор с артистом',
            'ACTOR_CONTRACT',
            'Типовой договор на участие артиста в спектакле',
            'templates/actor_contract_template.docx',
            'actor_contract_template.docx',
            'contract',
            true,
            'pdf'
        );
    """)

    op.execute("""
        INSERT INTO document_template_variables (template_id, name, label, description, variable_type, is_required, source_field, sort_order, group_name)
        SELECT id, 'contract_number', 'Номер договора', 'Регистрационный номер договора', 'text', true, NULL, 1, 'Реквизиты договора'
        FROM document_templates WHERE code = 'ACTOR_CONTRACT';
    """)

    op.execute("""
        INSERT INTO document_template_variables (template_id, name, label, description, variable_type, is_required, source_field, sort_order, group_name)
        SELECT id, 'contract_date', 'Дата договора', 'Дата заключения договора', 'date', true, NULL, 2, 'Реквизиты договора'
        FROM document_templates WHERE code = 'ACTOR_CONTRACT';
    """)

    op.execute("""
        INSERT INTO document_template_variables (template_id, name, label, description, variable_type, is_required, source_field, sort_order, group_name)
        SELECT id, 'actor_name', 'ФИО артиста', 'Полное имя артиста', 'user_field', true, NULL, 3, 'Данные артиста'
        FROM document_templates WHERE code = 'ACTOR_CONTRACT';
    """)

    op.execute("""
        INSERT INTO document_template_variables (template_id, name, label, description, variable_type, is_required, source_field, sort_order, group_name)
        SELECT id, 'role_name', 'Роль', 'Название роли в спектакле', 'text', true, NULL, 4, 'Данные артиста'
        FROM document_templates WHERE code = 'ACTOR_CONTRACT';
    """)

    op.execute("""
        INSERT INTO document_template_variables (template_id, name, label, description, variable_type, is_required, source_field, sort_order, group_name)
        SELECT id, 'performance_title', 'Название спектакля', 'Спектакль для участия', 'performance_field', true, 'performance.title', 5, 'О спектакле'
        FROM document_templates WHERE code = 'ACTOR_CONTRACT';
    """)

    op.execute("""
        INSERT INTO document_template_variables (template_id, name, label, description, variable_type, is_required, source_field, sort_order, group_name)
        SELECT id, 'fee_amount', 'Сумма гонорара', 'Размер вознаграждения', 'number', true, NULL, 6, 'Финансовые условия'
        FROM document_templates WHERE code = 'ACTOR_CONTRACT';
    """)

    op.execute("""
        INSERT INTO document_template_variables (template_id, name, label, description, variable_type, is_required, source_field, sort_order, group_name, choices)
        SELECT id, 'payment_terms', 'Условия оплаты', 'Порядок выплаты гонорара', 'choice', true, NULL, 7, 'Финансовые условия',
               '["Единовременно после премьеры", "Ежемесячно", "После каждого показа", "Другое"]'::jsonb
        FROM document_templates WHERE code = 'ACTOR_CONTRACT';
    """)


def downgrade() -> None:
    """Удаление таблиц шаблонов документов."""

    # Удаление FK из documents
    op.drop_constraint('fk_documents_generated_from_template_id', 'documents', type_='foreignkey')
    op.drop_column('documents', 'generation_data')
    op.drop_column('documents', 'generated_from_template_id')

    # Удаление таблиц
    op.drop_table('document_template_variables')
    op.drop_table('document_templates')

    # Удаление ENUM типов
    op.execute("DROP TYPE IF EXISTS variabletype;")
    op.execute("DROP TYPE IF EXISTS templatetype;")
