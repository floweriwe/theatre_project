"""Performance Hub schema extensions.

Revision ID: 014_performance_hub_schema
Revises: 20250117_0002_013_performance_documents
Create Date: 2025-01-18

Phase 10: Performance Management Hub
- Add configuration_version and is_template to performances
- Extend performance_inventory with UUID id, scene_id
- Add checklist_templates and checklist_instances tables
- Add performance_cast table
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '014_performance_hub_schema'
down_revision: Union[str, None] = '013_performance_documents'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ENUM types with existence check
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE checklisttype AS ENUM ('pre_show', 'day_of', 'post_show', 'montage', 'rehearsal');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE checkliststatus AS ENUM ('pending', 'in_progress', 'completed');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE castroletype AS ENUM ('cast', 'crew');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Add new columns to performances
    op.add_column('performances', sa.Column('is_template', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('performances', sa.Column('configuration_version', sa.Integer(), nullable=False, server_default='1'))

    # Recreate performance_inventory with new structure
    # First, drop existing table
    op.drop_table('performance_inventory')

    # Create new performance_inventory table
    op.create_table(
        'performance_inventory',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('performance_id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('scene_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['performance_id'], ['performances.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['scene_id'], ['performance_sections.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('performance_id', 'item_id', 'scene_id', name='uq_performance_inventory_item_scene'),
    )
    op.create_index('ix_performance_inventory_performance_id', 'performance_inventory', ['performance_id'])
    op.create_index('ix_performance_inventory_item_id', 'performance_inventory', ['item_id'])
    op.create_index('ix_performance_inventory_scene_id', 'performance_inventory', ['scene_id'])

    # Create checklist_templates table
    op.create_table(
        'checklist_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type', postgresql.ENUM('pre_show', 'day_of', 'post_show', 'montage', 'rehearsal', name='checklisttype', create_type=False), nullable=False),
        sa.Column('items', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('theater_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['theater_id'], ['theaters.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_checklist_templates_type', 'checklist_templates', ['type'])
    op.create_index('ix_checklist_templates_theater_id', 'checklist_templates', ['theater_id'])

    # Create checklist_instances table
    op.create_table(
        'checklist_instances',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('performance_id', sa.Integer(), nullable=False),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('status', postgresql.ENUM('pending', 'in_progress', 'completed', name='checkliststatus', create_type=False), nullable=False, server_default='pending'),
        sa.Column('completion_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['performance_id'], ['performances.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['template_id'], ['checklist_templates.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_checklist_instances_performance_id', 'checklist_instances', ['performance_id'])
    op.create_index('ix_checklist_instances_template_id', 'checklist_instances', ['template_id'])
    op.create_index('ix_checklist_instances_status', 'checklist_instances', ['status'])

    # Create performance_cast table
    op.create_table(
        'performance_cast',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('performance_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role_type', postgresql.ENUM('cast', 'crew', name='castroletype', create_type=False), nullable=False),
        sa.Column('character_name', sa.String(255), nullable=True),
        sa.Column('functional_role', sa.String(255), nullable=True),
        sa.Column('is_understudy', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['performance_id'], ['performances.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('performance_id', 'user_id', 'character_name', name='uq_performance_cast_user_character'),
    )
    op.create_index('ix_performance_cast_performance_id', 'performance_cast', ['performance_id'])
    op.create_index('ix_performance_cast_user_id', 'performance_cast', ['user_id'])
    op.create_index('ix_performance_cast_role_type', 'performance_cast', ['role_type'])


def downgrade() -> None:
    # Drop performance_cast
    op.drop_index('ix_performance_cast_role_type', 'performance_cast')
    op.drop_index('ix_performance_cast_user_id', 'performance_cast')
    op.drop_index('ix_performance_cast_performance_id', 'performance_cast')
    op.drop_table('performance_cast')

    # Drop checklist_instances
    op.drop_index('ix_checklist_instances_status', 'checklist_instances')
    op.drop_index('ix_checklist_instances_template_id', 'checklist_instances')
    op.drop_index('ix_checklist_instances_performance_id', 'checklist_instances')
    op.drop_table('checklist_instances')

    # Drop checklist_templates
    op.drop_index('ix_checklist_templates_theater_id', 'checklist_templates')
    op.drop_index('ix_checklist_templates_type', 'checklist_templates')
    op.drop_table('checklist_templates')

    # Recreate original performance_inventory table
    op.drop_index('ix_performance_inventory_scene_id', 'performance_inventory')
    op.drop_index('ix_performance_inventory_item_id', 'performance_inventory')
    op.drop_index('ix_performance_inventory_performance_id', 'performance_inventory')
    op.drop_table('performance_inventory')

    op.create_table(
        'performance_inventory',
        sa.Column('performance_id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('quantity_required', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('performance_id', 'item_id'),
        sa.ForeignKeyConstraint(['performance_id'], ['performances.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
    )

    # Remove columns from performances
    op.drop_column('performances', 'configuration_version')
    op.drop_column('performances', 'is_template')

    # Drop ENUM types
    op.execute("DROP TYPE IF EXISTS castroletype;")
    op.execute("DROP TYPE IF EXISTS checkliststatus;")
    op.execute("DROP TYPE IF EXISTS checklisttype;")
