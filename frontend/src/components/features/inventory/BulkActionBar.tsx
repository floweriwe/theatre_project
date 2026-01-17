/**
 * BulkActionBar - панель массовых операций для инвентаря.
 *
 * Отображается когда выбраны элементы. Позволяет:
 * - Изменить статус
 * - Переместить
 * - Назначить теги
 * - Удалить
 */
import { useState } from 'react';
import {
  X,
  CheckSquare,
  Truck,
  Tag,
  Trash2,
  ChevronDown,
  Loader2,
  FolderTree,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ItemStatus } from '@/types/inventory_types';

interface BulkActionBarProps {
  selectedCount: number;
  selectedIds: number[];
  onClearSelection: () => void;
  onStatusChange?: (status: ItemStatus) => Promise<void>;
  onTransfer?: (locationId: number) => Promise<void>;
  onAssignTags?: (tagIds: number[]) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCategoryChange?: (categoryId: number | null) => Promise<void>;
  className?: string;
  /** Локации для перемещения */
  locations?: Array<{ id: number; name: string }>;
  /** Теги для назначения */
  tags?: Array<{ id: number; name: string; color?: string }>;
  /** Категории для изменения */
  categories?: Array<{ id: number; name: string }>;
}

type ActionType = 'status' | 'transfer' | 'tags' | 'category' | 'delete';

const statusOptions: Array<{ value: ItemStatus; label: string; color: string }> = [
  { value: 'in_stock', label: 'На складе', color: 'text-emerald-400' },
  { value: 'reserved', label: 'Зарезервирован', color: 'text-amber-400' },
  { value: 'in_use', label: 'В использовании', color: 'text-blue-400' },
  { value: 'repair', label: 'На ремонте', color: 'text-orange-400' },
];

export function BulkActionBar({
  selectedCount,
  // selectedIds passed for parent's use via callbacks
  onClearSelection,
  onStatusChange,
  onTransfer,
  onAssignTags,
  onDelete,
  onCategoryChange,
  className,
  locations = [],
  tags = [],
  categories = [],
}: BulkActionBarProps) {
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  if (selectedCount === 0) return null;

  const handleAction = async (action: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
      setActiveAction(null);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const renderDropdown = () => {
    switch (activeAction) {
      case 'status':
        return (
          <div className="absolute top-full left-0 mt-1 w-48 bg-[#1A2332] border border-[#334155] rounded-lg shadow-xl z-50">
            {statusOptions.map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => onStatusChange && handleAction(() => onStatusChange(value))}
                className="w-full px-4 py-2 text-left text-sm hover:bg-[#243044] transition-colors"
              >
                <span className={color}>{label}</span>
              </button>
            ))}
          </div>
        );

      case 'transfer':
        return (
          <div className="absolute top-full left-0 mt-1 w-64 max-h-64 overflow-y-auto bg-[#1A2332] border border-[#334155] rounded-lg shadow-xl z-50">
            {locations.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[#64748B]">
                Нет доступных локаций
              </div>
            ) : (
              locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => onTransfer && handleAction(() => onTransfer(loc.id))}
                  className="w-full px-4 py-2 text-left text-sm text-[#F1F5F9] hover:bg-[#243044] transition-colors"
                >
                  {loc.name}
                </button>
              ))
            )}
          </div>
        );

      case 'tags':
        return (
          <div className="absolute top-full left-0 mt-1 w-64 bg-[#1A2332] border border-[#334155] rounded-lg shadow-xl z-50">
            <div className="max-h-48 overflow-y-auto p-2">
              {tags.length === 0 ? (
                <div className="px-2 py-3 text-sm text-[#64748B]">
                  Нет доступных тегов
                </div>
              ) : (
                tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#243044] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="rounded border-[#334155] bg-[#243044] text-[#D4A574] focus:ring-[#D4A574]"
                    />
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color || '#64748B' }}
                    />
                    <span className="text-sm text-[#F1F5F9]">{tag.name}</span>
                  </label>
                ))
              )}
            </div>
            {tags.length > 0 && (
              <div className="border-t border-[#334155] p-2">
                <button
                  onClick={() =>
                    onAssignTags && handleAction(() => onAssignTags(selectedTags))
                  }
                  disabled={selectedTags.length === 0}
                  className="w-full px-3 py-1.5 bg-[#D4A574] text-[#0F1419] text-sm font-medium rounded hover:bg-[#E8C297] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Применить
                </button>
              </div>
            )}
          </div>
        );

      case 'category':
        return (
          <div className="absolute top-full left-0 mt-1 w-64 max-h-64 overflow-y-auto bg-[#1A2332] border border-[#334155] rounded-lg shadow-xl z-50">
            <button
              onClick={() => onCategoryChange && handleAction(() => onCategoryChange(null))}
              className="w-full px-4 py-2 text-left text-sm text-[#64748B] hover:bg-[#243044] transition-colors border-b border-[#334155]"
            >
              Без категории
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange && handleAction(() => onCategoryChange(cat.id))}
                className="w-full px-4 py-2 text-left text-sm text-[#F1F5F9] hover:bg-[#243044] transition-colors"
              >
                {cat.name}
              </button>
            ))}
          </div>
        );

      case 'delete':
        return (
          <div className="absolute top-full right-0 mt-1 w-72 bg-[#1A2332] border border-[#334155] rounded-lg shadow-xl z-50 p-4">
            <p className="text-sm text-[#F1F5F9] mb-3">
              Вы уверены, что хотите удалить {selectedCount} элемент(ов)?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveAction(null)}
                className="flex-1 px-3 py-1.5 bg-[#243044] text-[#F1F5F9] text-sm rounded hover:bg-[#334155] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => onDelete && handleAction(onDelete)}
                className="flex-1 px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-40',
        'flex items-center gap-2 px-4 py-3',
        'bg-[#1A2332] border border-[#334155] rounded-xl shadow-2xl',
        'animate-in slide-in-from-bottom-4 duration-300',
        className
      )}
    >
      {/* Selection count */}
      <div className="flex items-center gap-2 pr-3 border-r border-[#334155]">
        <CheckSquare className="w-5 h-5 text-[#D4A574]" />
        <span className="text-sm font-medium text-[#F1F5F9]">
          {selectedCount} выбрано
        </span>
        <button
          onClick={onClearSelection}
          className="p-1 rounded hover:bg-[#243044] text-[#64748B] hover:text-[#F1F5F9] transition-colors"
          title="Снять выделение"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#1A2332]/80 rounded-xl flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-[#D4A574] animate-spin" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Status */}
        {onStatusChange && (
          <div className="relative">
            <button
              onClick={() => setActiveAction(activeAction === 'status' ? null : 'status')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                activeAction === 'status'
                  ? 'bg-[#D4A574] text-[#0F1419]'
                  : 'text-[#F1F5F9] hover:bg-[#243044]'
              )}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Статус</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {activeAction === 'status' && renderDropdown()}
          </div>
        )}

        {/* Transfer */}
        {onTransfer && (
          <div className="relative">
            <button
              onClick={() => setActiveAction(activeAction === 'transfer' ? null : 'transfer')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                activeAction === 'transfer'
                  ? 'bg-[#D4A574] text-[#0F1419]'
                  : 'text-[#F1F5F9] hover:bg-[#243044]'
              )}
            >
              <Truck className="w-4 h-4" />
              <span>Переместить</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {activeAction === 'transfer' && renderDropdown()}
          </div>
        )}

        {/* Category */}
        {onCategoryChange && (
          <div className="relative">
            <button
              onClick={() => setActiveAction(activeAction === 'category' ? null : 'category')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                activeAction === 'category'
                  ? 'bg-[#D4A574] text-[#0F1419]'
                  : 'text-[#F1F5F9] hover:bg-[#243044]'
              )}
            >
              <FolderTree className="w-4 h-4" />
              <span>Категория</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {activeAction === 'category' && renderDropdown()}
          </div>
        )}

        {/* Tags */}
        {onAssignTags && (
          <div className="relative">
            <button
              onClick={() => {
                setSelectedTags([]);
                setActiveAction(activeAction === 'tags' ? null : 'tags');
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                activeAction === 'tags'
                  ? 'bg-[#D4A574] text-[#0F1419]'
                  : 'text-[#F1F5F9] hover:bg-[#243044]'
              )}
            >
              <Tag className="w-4 h-4" />
              <span>Теги</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {activeAction === 'tags' && renderDropdown()}
          </div>
        )}

        {/* Delete */}
        {onDelete && (
          <div className="relative pl-2 ml-2 border-l border-[#334155]">
            <button
              onClick={() => setActiveAction(activeAction === 'delete' ? null : 'delete')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                activeAction === 'delete'
                  ? 'bg-red-500 text-white'
                  : 'text-red-400 hover:bg-red-500/10'
              )}
            >
              <Trash2 className="w-4 h-4" />
              <span>Удалить</span>
            </button>
            {activeAction === 'delete' && renderDropdown()}
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {activeAction && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setActiveAction(null)}
        />
      )}
    </div>
  );
}

export default BulkActionBar;
