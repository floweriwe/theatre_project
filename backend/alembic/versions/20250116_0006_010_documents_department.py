"""010_documents_department

Добавляет поле department_id в таблицу documents
для фильтрации документов по цехам.

Revision ID: 010_documents_department
Revises: 009_inventory_physical_props
Create Date: 2025-01-16 06:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '010_documents_department'
down_revision: Union[str, None] = '009_inventory_physical_props'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Добавление поля department_id в documents."""

    # Добавляем колонку department_id
    op.add_column(
        'documents',
        sa.Column('department_id', sa.Integer(), nullable=True)
    )

    # Добавляем внешний ключ
    op.create_foreign_key(
        'fk_documents_department_id',
        'documents',
        'departments',
        ['department_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # Добавляем индекс для быстрой фильтрации
    op.create_index(
        'ix_documents_department_id',
        'documents',
        ['department_id']
    )


def downgrade() -> None:
    """Удаление поля department_id из documents."""

    op.drop_index('ix_documents_department_id', table_name='documents')
    op.drop_constraint('fk_documents_department_id', 'documents', type_='foreignkey')
    op.drop_column('documents', 'department_id')
