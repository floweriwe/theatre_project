/**
 * CategoryTreeFilter - древовидный фильтр по категориям.
 *
 * Отображает иерархию категорий с возможностью:
 * - Выбора категории
 * - Раскрытия/сворачивания узлов
 * - Поиска по названию
 */
import { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
  code?: string;
  color?: string;
  parentId?: number | null;
  children?: Category[];
  itemCount?: number;
}

interface CategoryTreeFilterProps {
  categories: Category[];
  selectedId: number | null;
  onSelect: (categoryId: number | null) => void;
  className?: string;
  /** Показывать счётчик элементов */
  showCounts?: boolean;
  /** Показывать поиск */
  showSearch?: boolean;
  /** Заголовок */
  title?: string;
}

function buildTree(categories: Category[]): Category[] {
  const map = new Map<number, Category>();
  const roots: Category[] = [];

  // First pass: create map
  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  // Second pass: build tree
  categories.forEach((cat) => {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function filterTree(nodes: Category[], search: string): Category[] {
  const searchLower = search.toLowerCase();

  const filter = (node: Category): Category | null => {
    const matches = node.name.toLowerCase().includes(searchLower);
    const filteredChildren = node.children
      ?.map(filter)
      .filter((n): n is Category => n !== null) || [];

    if (matches || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }
    return null;
  };

  return nodes.map(filter).filter((n): n is Category => n !== null);
}

interface TreeNodeProps {
  node: Category;
  level: number;
  selectedId: number | null;
  expandedIds: Set<number>;
  onSelect: (id: number | null) => void;
  onToggle: (id: number) => void;
  showCounts?: boolean;
}

function TreeNode({
  node,
  level,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
  showCounts,
}: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (hasChildren) {
            onToggle(node.id);
          }
          onSelect(node.id);
        }}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors',
          'hover:bg-[#243044]',
          isSelected && 'bg-[#D4A574]/10 text-[#D4A574]'
        )}
        style={{ paddingLeft: `${8 + level * 16}px` }}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <span className="text-[#64748B]">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        ) : (
          <span className="w-4" />
        )}

        {/* Folder icon */}
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen
              className="w-4 h-4"
              style={{ color: node.color || '#64748B' }}
            />
          ) : (
            <Folder
              className="w-4 h-4"
              style={{ color: node.color || '#64748B' }}
            />
          )
        ) : (
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: node.color || '#64748B' }}
          />
        )}

        {/* Name */}
        <span
          className={cn(
            'flex-1 text-left truncate',
            isSelected ? 'text-[#D4A574]' : 'text-[#F1F5F9]'
          )}
        >
          {node.name}
        </span>

        {/* Count badge */}
        {showCounts && node.itemCount !== undefined && (
          <span className="text-xs text-[#64748B] bg-[#243044] px-1.5 py-0.5 rounded">
            {node.itemCount}
          </span>
        )}
      </button>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
              showCounts={showCounts}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTreeFilter({
  categories,
  selectedId,
  onSelect,
  className,
  showCounts = true,
  showSearch = true,
  title = 'Категории',
}: CategoryTreeFilterProps) {
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // Build tree structure
  const tree = useMemo(() => buildTree(categories), [categories]);

  // Filter tree if searching
  const filteredTree = useMemo(
    () => (search ? filterTree(tree, search) : tree),
    [tree, search]
  );

  // Auto-expand when searching
  const displayExpandedIds = useMemo(() => {
    if (search) {
      // Expand all when searching
      const allIds = new Set<number>();
      const collectIds = (nodes: Category[]) => {
        nodes.forEach((node) => {
          if (node.children && node.children.length > 0) {
            allIds.add(node.id);
            collectIds(node.children);
          }
        });
      };
      collectIds(filteredTree);
      return allIds;
    }
    return expandedIds;
  }, [search, filteredTree, expandedIds]);

  const handleToggle = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div
      className={cn(
        'bg-[#1A2332] border border-[#334155] rounded-xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#334155]">
        <h3 className="text-sm font-medium text-[#F1F5F9]">{title}</h3>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="px-3 py-2 border-b border-[#334155]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-full pl-8 pr-8 py-1.5 bg-[#243044] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:border-[#D4A574]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tree content */}
      <div className="p-2 max-h-80 overflow-y-auto">
        {/* All items option */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors',
            'hover:bg-[#243044]',
            selectedId === null && 'bg-[#D4A574]/10 text-[#D4A574]'
          )}
        >
          <span className="w-4" />
          <Folder className="w-4 h-4 text-[#64748B]" />
          <span
            className={cn(
              'flex-1 text-left',
              selectedId === null ? 'text-[#D4A574]' : 'text-[#F1F5F9]'
            )}
          >
            Все категории
          </span>
        </button>

        {/* Tree nodes */}
        {filteredTree.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-[#64748B]">
            {search ? 'Ничего не найдено' : 'Нет категорий'}
          </div>
        ) : (
          filteredTree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              selectedId={selectedId}
              expandedIds={displayExpandedIds}
              onSelect={onSelect}
              onToggle={handleToggle}
              showCounts={showCounts}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default CategoryTreeFilter;
