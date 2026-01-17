/**
 * Дерево структуры спектакля.
 *
 * Отображает:
 * - Разделы паспорта спектакля
 * - Привязанный инвентарь
 * - Назначенный каст и персонал
 * - Активные чеклисты
 */
import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Volume2,
  Palette,
  Box,
  Shirt,
  Brush,
  Video,
  Sparkles,
  MoreHorizontal,
  Package,
  Users,
  ClipboardList,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import type { SelectedItem } from './PerformanceConstructor';
import type { PerformanceStructure, ChecklistInstance } from '@/types/performance_hub';
import type { SectionType } from '@/types/performance_types';

interface PerformanceTreeProps {
  structure: PerformanceStructure;
  selectedItem: SelectedItem;
  onSelect: (item: SelectedItem) => void;
  onRefetch: () => void;
}

const SECTION_ICONS: Record<SectionType, React.ReactNode> = {
  lighting: <Lightbulb className="w-4 h-4" />,
  sound: <Volume2 className="w-4 h-4" />,
  scenery: <Palette className="w-4 h-4" />,
  props: <Box className="w-4 h-4" />,
  costumes: <Shirt className="w-4 h-4" />,
  makeup: <Brush className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  effects: <Sparkles className="w-4 h-4" />,
  other: <MoreHorizontal className="w-4 h-4" />,
};

const SECTION_LABELS: Record<SectionType, string> = {
  lighting: 'Свет',
  sound: 'Звук',
  scenery: 'Декорации',
  props: 'Реквизит',
  costumes: 'Костюмы',
  makeup: 'Грим',
  video: 'Видео',
  effects: 'Спецэффекты',
  other: 'Прочее',
};

export function PerformanceTree({
  structure,
  selectedItem,
  onSelect,
}: PerformanceTreeProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['sections', 'inventory', 'cast', 'checklists'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const isItemSelected = (type: NonNullable<SelectedItem>['type'], id: string | number): boolean => {
    if (!selectedItem) return false;
    if (selectedItem.type !== type) return false;
    if (type === 'section') return (selectedItem.data as { id: number }).id === id;
    return (selectedItem.data as { id: string }).id === id;
  };

  return (
    <div className="space-y-2">
      {/* Performance Info */}
      <div className="bg-[#1A2332] rounded-lg p-4 border border-[#D4A574]/10">
        <h3 className="text-lg font-['Cormorant_Garamond'] font-semibold text-[#F1F5F9] mb-1">
          {structure.performance.title}
        </h3>
        <p className="text-sm text-[#64748B]">
          Статус: <span className="text-[#94A3B8]">{structure.performance.status}</span>
        </p>
      </div>

      {/* Sections */}
      <TreeSection
        title="Разделы паспорта"
        icon={<Palette className="w-4 h-4" />}
        count={structure.sections.length}
        expanded={expandedSections.has('sections')}
        onToggle={() => toggleSection('sections')}
      >
        {structure.sections.map((section) => (
          <TreeItem
            key={section.id}
            icon={SECTION_ICONS[section.sectionType as SectionType] || <MoreHorizontal className="w-4 h-4" />}
            label={section.title || SECTION_LABELS[section.sectionType as SectionType]}
            selected={isItemSelected('section', section.id)}
            onClick={() => onSelect({ type: 'section', data: section })}
          />
        ))}
        {structure.sections.length === 0 && (
          <EmptyTreeItem message="Нет разделов" />
        )}
      </TreeSection>

      {/* Inventory */}
      <TreeSection
        title="Инвентарь"
        icon={<Package className="w-4 h-4" />}
        count={structure.inventory.length}
        expanded={expandedSections.has('inventory')}
        onToggle={() => toggleSection('inventory')}
      >
        {structure.inventory.map((item) => (
          <TreeItem
            key={item.id}
            icon={<Package className="w-4 h-4" />}
            label={item.itemName || `Предмет #${item.itemId}`}
            sublabel={item.sceneName ? `Сцена: ${item.sceneName}` : undefined}
            badge={item.quantity > 1 ? `×${item.quantity}` : undefined}
            selected={isItemSelected('inventory', item.id)}
            onClick={() => onSelect({ type: 'inventory', data: item })}
          />
        ))}
        {structure.inventory.length === 0 && (
          <EmptyTreeItem message="Нет привязанного инвентаря" />
        )}
      </TreeSection>

      {/* Cast & Crew */}
      <TreeSection
        title="Каст и персонал"
        icon={<Users className="w-4 h-4" />}
        count={structure.cast.totalCast + structure.cast.totalCrew}
        expanded={expandedSections.has('cast')}
        onToggle={() => toggleSection('cast')}
      >
        {structure.cast.cast.length > 0 && (
          <div className="mb-2">
            <p className="text-xs text-[#64748B] px-3 py-1">Актёры ({structure.cast.totalCast})</p>
            {structure.cast.cast.map((member) => (
              <TreeItem
                key={member.id}
                icon={<Users className="w-4 h-4" />}
                label={member.userFullName || `Пользователь #${member.userId}`}
                sublabel={member.characterName || undefined}
                badge={member.isUnderstudy ? 'дублёр' : undefined}
                selected={isItemSelected('cast', member.id)}
                onClick={() => onSelect({ type: 'cast', data: member })}
              />
            ))}
          </div>
        )}
        {structure.cast.crew.length > 0 && (
          <div>
            <p className="text-xs text-[#64748B] px-3 py-1">Персонал ({structure.cast.totalCrew})</p>
            {structure.cast.crew.map((member) => (
              <TreeItem
                key={member.id}
                icon={<Users className="w-4 h-4" />}
                label={member.userFullName || `Пользователь #${member.userId}`}
                sublabel={member.functionalRole || undefined}
                selected={isItemSelected('cast', member.id)}
                onClick={() => onSelect({ type: 'cast', data: member })}
              />
            ))}
          </div>
        )}
        {structure.cast.totalCast + structure.cast.totalCrew === 0 && (
          <EmptyTreeItem message="Нет назначенных участников" />
        )}
      </TreeSection>

      {/* Checklists */}
      <TreeSection
        title="Чеклисты"
        icon={<ClipboardList className="w-4 h-4" />}
        count={structure.checklists.length}
        expanded={expandedSections.has('checklists')}
        onToggle={() => toggleSection('checklists')}
      >
        {structure.checklists.map((checklist) => (
          <ChecklistTreeItem
            key={checklist.id}
            checklist={checklist}
            selected={isItemSelected('checklist', checklist.id)}
            onClick={() => onSelect({ type: 'checklist', data: checklist })}
          />
        ))}
        {structure.checklists.length === 0 && (
          <EmptyTreeItem message="Нет активных чеклистов" />
        )}
      </TreeSection>
    </div>
  );
}

// =============================================================================
// Tree Components
// =============================================================================

interface TreeSectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function TreeSection({
  title,
  icon,
  count,
  expanded,
  onToggle,
  children,
}: TreeSectionProps) {
  return (
    <div className="bg-[#1A2332] rounded-lg border border-[#D4A574]/10 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#243044] transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-[#64748B]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[#64748B]" />
        )}
        <span className="text-[#D4A574]">{icon}</span>
        <span className="flex-1 text-left text-sm font-medium text-[#F1F5F9]">
          {title}
        </span>
        <span className="text-xs text-[#64748B] bg-[#243044] px-2 py-0.5 rounded">
          {count}
        </span>
      </button>
      {expanded && <div className="pb-2">{children}</div>}
    </div>
  );
}

interface TreeItemProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  badge?: string;
  selected: boolean;
  onClick: () => void;
}

function TreeItem({
  icon,
  label,
  sublabel,
  badge,
  selected,
  onClick,
}: TreeItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 mx-2 rounded-lg transition-colors ${
        selected
          ? 'bg-[#D4A574]/20 text-[#D4A574]'
          : 'hover:bg-[#243044] text-[#F1F5F9]'
      }`}
      style={{ width: 'calc(100% - 16px)' }}
    >
      <span className={selected ? 'text-[#D4A574]' : 'text-[#64748B]'}>{icon}</span>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm truncate">{label}</p>
        {sublabel && (
          <p className="text-xs text-[#64748B] truncate">{sublabel}</p>
        )}
      </div>
      {badge && (
        <span className="text-xs text-[#94A3B8] bg-[#243044] px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}
    </button>
  );
}

interface ChecklistTreeItemProps {
  checklist: ChecklistInstance;
  selected: boolean;
  onClick: () => void;
}

function ChecklistTreeItem({ checklist, selected, onClick }: ChecklistTreeItemProps) {
  const isCompleted = checklist.status === 'completed';
  const percentage = checklist.completionPercentage;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 mx-2 rounded-lg transition-colors ${
        selected
          ? 'bg-[#D4A574]/20 text-[#D4A574]'
          : 'hover:bg-[#243044] text-[#F1F5F9]'
      }`}
      style={{ width: 'calc(100% - 16px)' }}
    >
      {isCompleted ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      ) : (
        <Circle className="w-4 h-4 text-[#64748B]" />
      )}
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm truncate">{checklist.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 bg-[#243044] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isCompleted ? 'bg-emerald-400' : 'bg-[#D4A574]'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs text-[#64748B]">{percentage}%</span>
        </div>
      </div>
    </button>
  );
}

function EmptyTreeItem({ message }: { message: string }) {
  return (
    <div className="px-3 py-4 text-center">
      <p className="text-xs text-[#64748B]">{message}</p>
    </div>
  );
}

export default PerformanceTree;
