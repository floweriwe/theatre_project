/**
 * Библиотека ресурсов для Performance Constructor.
 *
 * Показывает:
 * - Доступный инвентарь для добавления
 * - Пользователей для назначения в каст
 * - Шаблоны чеклистов
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Package, User, ClipboardCheck } from 'lucide-react';
import { inventoryService } from '@/services/inventory_service';
import { performanceHubService } from '@/services/performance_hub_service';
import type { ResourceTab } from './PerformanceConstructor';
import type { InventoryItemList } from '@/types/inventory_types';
import type { ChecklistTemplate } from '@/types/performance_hub';

interface ResourceLibraryProps {
  performanceId: number;
  activeTab: ResourceTab;
  onRefetch: () => void;
}

export function ResourceLibrary({
  performanceId,
  activeTab,
  onRefetch,
}: ResourceLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-[#D4A574]/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#243044] border border-[#D4A574]/10 rounded-lg text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#D4A574]/30"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'inventory' && (
          <InventoryList
            performanceId={performanceId}
            searchQuery={searchQuery}
            onRefetch={onRefetch}
          />
        )}
        {activeTab === 'cast' && (
          <CastList
            performanceId={performanceId}
            searchQuery={searchQuery}
            onRefetch={onRefetch}
          />
        )}
        {activeTab === 'checklists' && (
          <ChecklistTemplatesList
            performanceId={performanceId}
            searchQuery={searchQuery}
            onRefetch={onRefetch}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Inventory List
// =============================================================================

interface InventoryListProps {
  performanceId: number;
  searchQuery: string;
  onRefetch: () => void;
}

function InventoryList({
  performanceId,
  searchQuery,
  onRefetch,
}: InventoryListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-items', searchQuery],
    queryFn: () => inventoryService.getItems({ search: searchQuery, limit: 50 }),
  });

  const handleAddItem = async (item: InventoryItemList) => {
    try {
      await performanceHubService.addInventoryLink(performanceId, {
        itemId: item.id,
        quantity: 1,
      });
      onRefetch();
    } catch (err) {
      console.error('Failed to add inventory:', err);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message="Ошибка загрузки инвентаря" />;
  }

  const items = data?.items || [];

  if (items.length === 0) {
    return <EmptyState message="Инвентарь не найден" />;
  }

  return (
    <div className="p-2 space-y-1">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#243044] transition-colors group"
        >
          <div className="w-10 h-10 rounded bg-[#243044] flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-[#64748B]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#F1F5F9] truncate">{item.name}</p>
            <p className="text-xs text-[#64748B] truncate">
              {item.inventoryNumber} • {item.categoryName || 'Без категории'}
            </p>
          </div>
          <button
            onClick={() => handleAddItem(item)}
            className="p-1.5 text-[#64748B] hover:text-[#D4A574] hover:bg-[#D4A574]/10 rounded opacity-0 group-hover:opacity-100 transition-all"
            title="Добавить к спектаклю"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Cast List (placeholder - будет загружать пользователей)
// =============================================================================

interface CastListProps {
  performanceId: number;
  searchQuery: string;
  onRefetch: () => void;
}

function CastList({ performanceId, searchQuery, onRefetch }: CastListProps) {
  // TODO: Загрузка пользователей театра
  const mockUsers = [
    { id: 1, fullName: 'Иванов Иван', department: 'Актёрский цех' },
    { id: 2, fullName: 'Петрова Мария', department: 'Актёрский цех' },
    { id: 3, fullName: 'Сидоров Алексей', department: 'Осветительный цех' },
    { id: 4, fullName: 'Козлова Анна', department: 'Звуковой цех' },
  ];

  const filteredUsers = mockUsers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = async (user: typeof mockUsers[0], roleType: 'cast' | 'crew') => {
    try {
      await performanceHubService.addCastMember(performanceId, {
        userId: user.id,
        roleType,
      });
      onRefetch();
    } catch (err) {
      console.error('Failed to add cast member:', err);
    }
  };

  if (filteredUsers.length === 0) {
    return <EmptyState message="Сотрудники не найдены" />;
  }

  return (
    <div className="p-2 space-y-1">
      {filteredUsers.map((user) => (
        <div
          key={user.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#243044] transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-[#243044] flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-[#64748B]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#F1F5F9] truncate">{user.fullName}</p>
            <p className="text-xs text-[#64748B] truncate">{user.department}</p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={() => handleAddUser(user, 'cast')}
              className="px-2 py-1 text-xs text-[#D4A574] hover:bg-[#D4A574]/10 rounded"
              title="Добавить как актёра"
            >
              Актёр
            </button>
            <button
              onClick={() => handleAddUser(user, 'crew')}
              className="px-2 py-1 text-xs text-[#94A3B8] hover:bg-[#94A3B8]/10 rounded"
              title="Добавить как персонал"
            >
              Персонал
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Checklist Templates List
// =============================================================================

interface ChecklistTemplatesListProps {
  performanceId: number;
  searchQuery: string;
  onRefetch: () => void;
}

function ChecklistTemplatesList({
  performanceId,
  searchQuery,
  onRefetch,
}: ChecklistTemplatesListProps) {
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['checklist-templates'],
    queryFn: () => performanceHubService.getChecklistTemplates(),
  });

  const filteredTemplates = (templates || []).filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateInstance = async (template: ChecklistTemplate) => {
    try {
      await performanceHubService.createChecklistInstance(performanceId, {
        templateId: template.id,
      });
      onRefetch();
    } catch (err) {
      console.error('Failed to create checklist instance:', err);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message="Ошибка загрузки шаблонов" />;
  }

  if (filteredTemplates.length === 0) {
    return <EmptyState message="Шаблоны не найдены" />;
  }

  return (
    <div className="p-2 space-y-1">
      {filteredTemplates.map((template) => (
        <div
          key={template.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#243044] transition-colors group"
        >
          <div className="w-10 h-10 rounded bg-[#243044] flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="w-5 h-5 text-[#64748B]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#F1F5F9] truncate">{template.name}</p>
            <p className="text-xs text-[#64748B] truncate">
              {template.items.length} пунктов
            </p>
          </div>
          <button
            onClick={() => handleCreateInstance(template)}
            className="p-1.5 text-[#64748B] hover:text-[#D4A574] hover:bg-[#D4A574]/10 rounded opacity-0 group-hover:opacity-100 transition-all"
            title="Создать чеклист"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Shared Components
// =============================================================================

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-[#D4A574] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-red-400">{message}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-[#64748B]">{message}</p>
    </div>
  );
}

export default ResourceLibrary;
