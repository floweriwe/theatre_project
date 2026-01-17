/**
 * Performance Constructor - главный конструктор спектакля.
 *
 * 3-колоночный layout:
 * - Левая: Библиотека ресурсов (инвентарь, персонал, шаблоны)
 * - Центр: Структура спектакля (дерево разделов)
 * - Правая: Панель инспектора (редактирование выбранного элемента)
 */
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Layers,
  Package,
  Users,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Save,
  History,
} from 'lucide-react';
import { performanceHubService } from '@/services/performance_hub_service';
import { ResourceLibrary } from './ResourceLibrary';
import { PerformanceTree } from './PerformanceTree';
import { InspectorPanel } from './InspectorPanel';
import type {
  PerformanceStructure,
  PerformanceInventoryLink,
  PerformanceCastMember,
  ChecklistInstance,
} from '@/types/performance_hub';

interface PerformanceConstructorProps {
  performanceId: number;
}

export type SelectedItem =
  | { type: 'section'; data: PerformanceStructure['sections'][0] }
  | { type: 'inventory'; data: PerformanceInventoryLink }
  | { type: 'cast'; data: PerformanceCastMember }
  | { type: 'checklist'; data: ChecklistInstance }
  | null;

export type ResourceTab = 'inventory' | 'cast' | 'checklists';

export function PerformanceConstructor({ performanceId }: PerformanceConstructorProps) {
  // Панели
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Текущий таб библиотеки и выбранный элемент
  const [activeResourceTab, setActiveResourceTab] = useState<ResourceTab>('inventory');
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);

  // Загрузка структуры спектакля
  const {
    data: structure,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['performance-structure', performanceId],
    queryFn: () => performanceHubService.getStructure(performanceId),
  });

  // Обработка выбора элемента
  const handleSelect = useCallback((item: SelectedItem) => {
    setSelectedItem(item);
    if (item && !rightPanelOpen) {
      setRightPanelOpen(true);
    }
  }, [rightPanelOpen]);

  // Создание снапшота
  const handleCreateSnapshot = async () => {
    try {
      await performanceHubService.createSnapshot(performanceId, 'Ручное сохранение');
      refetch();
    } catch (err) {
      console.error('Failed to create snapshot:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-[#0F1419]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#D4A574] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#94A3B8]">Загрузка конструктора...</p>
        </div>
      </div>
    );
  }

  if (error || !structure) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-[#0F1419]">
        <div className="text-center">
          <p className="text-red-400 mb-4">
            Ошибка загрузки: {(error as Error)?.message || 'Неизвестная ошибка'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#D4A574] text-[#0F1419] rounded-lg hover:bg-[#E8C297]"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px] bg-[#0F1419] rounded-lg overflow-hidden border border-[#D4A574]/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1A2332] border-b border-[#D4A574]/10">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-[#D4A574]" />
          <h2 className="text-lg font-['Cormorant_Garamond'] font-semibold text-[#F1F5F9]">
            Конструктор спектакля
          </h2>
          <span className="text-sm text-[#64748B]">
            v{structure.performance.configurationVersion}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateSnapshot}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#F1F5F9] bg-[#243044] rounded-lg hover:bg-[#2D3B50] transition-colors"
          >
            <Save className="w-4 h-4" />
            Сохранить версию
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#94A3B8] bg-[#243044] rounded-lg hover:bg-[#2D3B50] transition-colors">
            <History className="w-4 h-4" />
            История
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Resource Library */}
        <div
          className={`flex flex-col border-r border-[#D4A574]/10 bg-[#1A2332] transition-all duration-300 ${
            leftPanelOpen ? 'w-80' : 'w-12'
          }`}
        >
          {/* Tab Buttons */}
          <div className="flex items-center justify-between px-2 py-2 border-b border-[#D4A574]/10">
            {leftPanelOpen && (
              <div className="flex gap-1">
                <TabButton
                  active={activeResourceTab === 'inventory'}
                  onClick={() => setActiveResourceTab('inventory')}
                  icon={<Package className="w-4 h-4" />}
                  label="Инвентарь"
                />
                <TabButton
                  active={activeResourceTab === 'cast'}
                  onClick={() => setActiveResourceTab('cast')}
                  icon={<Users className="w-4 h-4" />}
                  label="Персонал"
                />
                <TabButton
                  active={activeResourceTab === 'checklists'}
                  onClick={() => setActiveResourceTab('checklists')}
                  icon={<ClipboardList className="w-4 h-4" />}
                  label="Чеклисты"
                />
              </div>
            )}
            <button
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              className="p-1.5 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#243044] rounded transition-colors"
            >
              {leftPanelOpen ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Resource Content */}
          {leftPanelOpen && (
            <ResourceLibrary
              performanceId={performanceId}
              activeTab={activeResourceTab}
              onRefetch={refetch}
            />
          )}
        </div>

        {/* Center - Performance Tree */}
        <div className="flex-1 overflow-auto bg-[#0F1419] p-4">
          <PerformanceTree
            structure={structure}
            selectedItem={selectedItem}
            onSelect={handleSelect}
            onRefetch={refetch}
          />
        </div>

        {/* Right Panel - Inspector */}
        <div
          className={`flex flex-col border-l border-[#D4A574]/10 bg-[#1A2332] transition-all duration-300 ${
            rightPanelOpen ? 'w-80' : 'w-12'
          }`}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#D4A574]/10">
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="p-1.5 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#243044] rounded transition-colors"
            >
              {rightPanelOpen ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
            {rightPanelOpen && (
              <span className="text-sm font-medium text-[#F1F5F9]">Инспектор</span>
            )}
          </div>

          {/* Inspector Content */}
          {rightPanelOpen && (
            <InspectorPanel
              performanceId={performanceId}
              selectedItem={selectedItem}
              onUpdate={refetch}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Вспомогательный компонент для табов
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors ${
        active
          ? 'bg-[#D4A574]/20 text-[#D4A574]'
          : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#243044]'
      }`}
      title={label}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

export default PerformanceConstructor;
