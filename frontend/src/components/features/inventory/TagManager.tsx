/**
 * TagManager - компонент управления тегами.
 *
 * Позволяет:
 * - Отображать и редактировать теги предмета
 * - Создавать новые теги
 * - Удалять теги
 * - Выбирать цвет тега
 */
import { useState, useRef, useEffect } from 'react';
import { Plus, X, Tag as TagIcon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tag {
  id: number;
  name: string;
  color?: string | null;
}

interface TagManagerProps {
  /** Все доступные теги */
  availableTags: Tag[];
  /** Выбранные теги (ID) */
  selectedTagIds: number[];
  /** Callback при изменении выбора */
  onSelectionChange: (tagIds: number[]) => void;
  /** Callback для создания нового тега */
  onCreateTag?: (name: string, color: string) => Promise<Tag>;
  /** Callback для удаления тега */
  onDeleteTag?: (tagId: number) => Promise<void>;
  className?: string;
  /** Режим только для чтения */
  readOnly?: boolean;
  /** Компактный режим (inline chips) */
  compact?: boolean;
}

const TAG_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#84CC16', // lime
  '#22C55E', // green
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#EC4899', // pink
  '#64748B', // slate
];

function TagChip({
  tag,
  selected,
  onClick,
  onRemove,
  size = 'md',
}: {
  tag: Tag;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        selected
          ? 'bg-[#D4A574]/20 border-[#D4A574] text-[#D4A574]'
          : 'bg-[#243044] border-[#334155] text-[#F1F5F9]',
        onClick && 'cursor-pointer hover:bg-[#334155]'
      )}
      onClick={onClick}
    >
      <span
        className={cn('rounded-full', size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5')}
        style={{ backgroundColor: tag.color || '#64748B' }}
      />
      <span>{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:text-red-400 transition-colors"
        >
          <X className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        </button>
      )}
    </span>
  );
}

export function TagManager({
  availableTags,
  selectedTagIds,
  onSelectionChange,
  onCreateTag,
  onDeleteTag,
  className,
  readOnly = false,
  compact = false,
}: TagManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter tags by search
  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Selected tags objects
  const selectedTags = availableTags.filter((tag) =>
    selectedTagIds.includes(tag.id)
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opening create mode
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const toggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onSelectionChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onSelectionChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !onCreateTag) return;

    try {
      const newTag = await onCreateTag(newTagName.trim(), newTagColor);
      onSelectionChange([...selectedTagIds, newTag.id]);
      setNewTagName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  // Compact read-only mode
  if (compact && readOnly) {
    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        {selectedTags.length === 0 ? (
          <span className="text-xs text-[#64748B]">Нет тегов</span>
        ) : (
          selectedTags.map((tag) => (
            <TagChip key={tag.id} tag={tag} size="sm" />
          ))
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Selected tags display */}
      <div
        className={cn(
          'flex flex-wrap gap-2 p-2 min-h-[42px]',
          'bg-[#243044] border border-[#334155] rounded-lg',
          !readOnly && 'cursor-pointer hover:border-[#475569]'
        )}
        onClick={() => !readOnly && setIsOpen(!isOpen)}
      >
        {selectedTags.map((tag) => (
          <TagChip
            key={tag.id}
            tag={tag}
            selected
            onRemove={readOnly ? undefined : () => toggleTag(tag.id)}
          />
        ))}

        {selectedTags.length === 0 && (
          <span className="text-sm text-[#64748B] flex items-center gap-1">
            <TagIcon className="w-4 h-4" />
            {readOnly ? 'Нет тегов' : 'Выберите теги...'}
          </span>
        )}

        {!readOnly && (
          <button
            type="button"
            className="ml-auto p-1 text-[#64748B] hover:text-[#F1F5F9] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !readOnly && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#1A2332] border border-[#334155] rounded-lg shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-[#334155]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск тегов..."
              className="w-full px-3 py-1.5 bg-[#243044] border border-[#334155] rounded text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:border-[#D4A574]"
            />
          </div>

          {/* Tags list */}
          <div className="max-h-48 overflow-y-auto p-2">
            {filteredTags.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-[#64748B]">
                {searchQuery ? 'Теги не найдены' : 'Нет доступных тегов'}
              </div>
            ) : (
              filteredTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors',
                      isSelected
                        ? 'bg-[#D4A574]/10'
                        : 'hover:bg-[#243044]'
                    )}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color || '#64748B' }}
                    />
                    <span
                      className={cn(
                        'flex-1 text-sm',
                        isSelected ? 'text-[#D4A574]' : 'text-[#F1F5F9]'
                      )}
                    >
                      {tag.name}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#D4A574]" />
                    )}
                    {onDeleteTag && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTag(tag.id);
                        }}
                        className="p-1 text-[#64748B] hover:text-red-400 transition-colors"
                        title="Удалить тег"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Create new tag */}
          {onCreateTag && (
            <div className="p-2 border-t border-[#334155]">
              {isCreating ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Название тега"
                      className="flex-1 px-3 py-1.5 bg-[#243044] border border-[#334155] rounded text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:border-[#D4A574]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateTag();
                        if (e.key === 'Escape') setIsCreating(false);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="p-2 border border-[#334155] rounded hover:bg-[#243044] transition-colors"
                      title="Выбрать цвет"
                    >
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: newTagColor }}
                      />
                    </button>
                  </div>

                  {/* Color picker */}
                  {showColorPicker && (
                    <div className="flex flex-wrap gap-1 p-2 bg-[#243044] rounded">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setNewTagColor(color);
                            setShowColorPicker(false);
                          }}
                          className={cn(
                            'w-6 h-6 rounded transition-transform hover:scale-110',
                            newTagColor === color && 'ring-2 ring-white ring-offset-1 ring-offset-[#243044]'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="flex-1 px-3 py-1.5 bg-[#243044] text-[#F1F5F9] text-sm rounded hover:bg-[#334155] transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim()}
                      className="flex-1 px-3 py-1.5 bg-[#D4A574] text-[#0F1419] text-sm font-medium rounded hover:bg-[#E8C297] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Создать
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-[#D4A574] hover:bg-[#D4A574]/10 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Создать новый тег
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TagManager;
