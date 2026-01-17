/**
 * CommandCenter — Центр команд (Cmd+K / Ctrl+K)
 * Modern Theatre Elegance v3
 *
 * Глобальный поиск и быстрые действия.
 * - Fuzzy search по всем разделам
 * - Навигация по страницам
 * - Быстрые действия
 * - Keyboard navigation
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Fuse from 'fuse.js';
import {
  Search,
  LayoutDashboard,
  Package,
  FileText,
  Theater,
  Calendar,
  Settings,
  Users,
  BarChart3,
  HelpCircle,
  Plus,
  ArrowRight,
  Command,
  Hash,
} from 'lucide-react';
import { cn } from '@/utils/helpers';
import { ROUTES } from '@/utils/constants';
import { useCommandCenterStore } from '@/store/commandCenterStore';

// =============================================================================
// Types
// =============================================================================

type CommandType = 'navigation' | 'action' | 'search';

interface CommandItem {
  id: string;
  type: CommandType;
  title: string;
  description?: string;
  icon: typeof Search;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
  group: string;
}

// =============================================================================
// Command Data
// =============================================================================

const createCommands = (navigate: ReturnType<typeof useNavigate>, onClose: () => void): CommandItem[] => [
  // Navigation
  {
    id: 'nav-dashboard',
    type: 'navigation',
    title: 'Обзор',
    description: 'Главная страница',
    icon: LayoutDashboard,
    group: 'Навигация',
    keywords: ['главная', 'дашборд', 'home', 'dashboard'],
    action: () => { navigate(ROUTES.DASHBOARD); onClose(); },
  },
  {
    id: 'nav-inventory',
    type: 'navigation',
    title: 'Инвентарь',
    description: 'Реквизит, костюмы, оборудование',
    icon: Package,
    group: 'Навигация',
    keywords: ['реквизит', 'костюмы', 'оборудование', 'props', 'inventory'],
    action: () => { navigate(ROUTES.INVENTORY); onClose(); },
  },
  {
    id: 'nav-documents',
    type: 'navigation',
    title: 'Документы',
    description: 'Файлы и документация',
    icon: FileText,
    group: 'Навигация',
    keywords: ['файлы', 'документация', 'files', 'docs'],
    action: () => { navigate(ROUTES.DOCUMENTS); onClose(); },
  },
  {
    id: 'nav-performances',
    type: 'navigation',
    title: 'Спектакли',
    description: 'Репертуар и паспорта',
    icon: Theater,
    group: 'Навигация',
    keywords: ['репертуар', 'постановки', 'shows', 'performances'],
    action: () => { navigate(ROUTES.PERFORMANCES); onClose(); },
  },
  {
    id: 'nav-schedule',
    type: 'navigation',
    title: 'Расписание',
    description: 'Календарь событий',
    icon: Calendar,
    group: 'Навигация',
    keywords: ['календарь', 'события', 'calendar', 'schedule', 'events'],
    action: () => { navigate(ROUTES.SCHEDULE); onClose(); },
  },
  {
    id: 'nav-reports',
    type: 'navigation',
    title: 'Аналитика',
    description: 'Отчёты и статистика',
    icon: BarChart3,
    group: 'Навигация',
    keywords: ['отчёты', 'статистика', 'reports', 'analytics'],
    action: () => { navigate(ROUTES.REPORTS); onClose(); },
  },
  {
    id: 'nav-users',
    type: 'navigation',
    title: 'Пользователи',
    description: 'Управление пользователями',
    icon: Users,
    group: 'Навигация',
    keywords: ['сотрудники', 'users', 'staff'],
    action: () => { navigate(ROUTES.ADMIN_USERS); onClose(); },
  },
  {
    id: 'nav-settings',
    type: 'navigation',
    title: 'Настройки',
    description: 'Параметры системы',
    icon: Settings,
    group: 'Навигация',
    keywords: ['параметры', 'settings', 'preferences'],
    action: () => { navigate(ROUTES.SETTINGS); onClose(); },
  },
  {
    id: 'nav-help',
    type: 'navigation',
    title: 'Справка',
    description: 'Центр помощи',
    icon: HelpCircle,
    group: 'Навигация',
    keywords: ['помощь', 'help', 'support'],
    action: () => { navigate(ROUTES.HELP); onClose(); },
  },

  // Actions
  {
    id: 'action-new-inventory',
    type: 'action',
    title: 'Создать предмет инвентаря',
    description: 'Добавить новый предмет',
    icon: Plus,
    shortcut: 'N',
    group: 'Быстрые действия',
    keywords: ['создать', 'добавить', 'новый', 'create', 'add', 'new'],
    action: () => { navigate(ROUTES.INVENTORY_NEW); onClose(); },
  },
  {
    id: 'action-new-performance',
    type: 'action',
    title: 'Создать спектакль',
    description: 'Добавить новую постановку',
    icon: Plus,
    group: 'Быстрые действия',
    keywords: ['создать', 'добавить', 'новый', 'спектакль', 'постановка'],
    action: () => { navigate(ROUTES.PERFORMANCES_NEW); onClose(); },
  },
  {
    id: 'action-upload-document',
    type: 'action',
    title: 'Загрузить документ',
    description: 'Добавить новый файл',
    icon: Plus,
    group: 'Быстрые действия',
    keywords: ['загрузить', 'файл', 'upload', 'document'],
    action: () => { navigate(ROUTES.DOCUMENTS_UPLOAD); onClose(); },
  },
];

// =============================================================================
// Component
// =============================================================================

export function CommandCenter() {
  const navigate = useNavigate();
  const { isOpen, searchQuery, close, setSearchQuery } = useCommandCenterStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Commands with navigation
  const commands = useMemo(() => createCommands(navigate, close), [navigate, close]);

  // Fuse.js fuzzy search
  const fuse = useMemo(() => new Fuse(commands, {
    keys: ['title', 'description', 'keywords'],
    threshold: 0.4,
    includeScore: true,
  }), [commands]);

  // Filtered results
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      return commands;
    }
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, fuse, commands]);

  // Group by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.group]) {
        groups[cmd.group] = [];
      }
      groups[cmd.group].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Execute selected command
  const executeCommand = useCallback((command: CommandItem) => {
    command.action();
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  }, [filteredCommands, selectedIndex, executeCommand, close]);

  // Get flat index for grouped items
  const getFlatIndex = useCallback((groupName: string, itemIndex: number): number => {
    let flatIndex = 0;
    for (const [name, items] of Object.entries(groupedCommands)) {
      if (name === groupName) {
        return flatIndex + itemIndex;
      }
      flatIndex += items.length;
    }
    return 0;
  }, [groupedCommands]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={close}
      />

      {/* Modal */}
      <div className="relative flex items-start justify-center pt-[15vh]">
        <div
          className={cn(
            'w-full max-w-xl mx-4',
            'bg-bg-overlay border border-border-default',
            'rounded-2xl shadow-2xl shadow-black/50',
            'animate-scale-in overflow-hidden'
          )}
          onKeyDown={handleKeyDown}
        >
          {/* Search Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
            <Search className="w-5 h-5 text-text-muted flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск команд и страниц..."
              className={cn(
                'flex-1 bg-transparent border-none outline-none',
                'text-text-primary placeholder:text-text-muted',
                'text-base'
              )}
            />
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-xs font-medium text-text-muted bg-bg-surface rounded border border-border-subtle">
                esc
              </kbd>
            </div>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2 scrollbar-thin">
            {filteredCommands.length > 0 ? (
              Object.entries(groupedCommands).map(([groupName, items]) => (
                <div key={groupName} className="mb-2">
                  {/* Group Header */}
                  <div className="px-4 py-1.5">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      {groupName}
                    </span>
                  </div>

                  {/* Group Items */}
                  {items.map((item, itemIndex) => {
                    const flatIndex = getFlatIndex(groupName, itemIndex);
                    const isSelected = flatIndex === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.id}
                        data-selected={isSelected}
                        onClick={() => executeCommand(item)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2.5 cursor-pointer',
                          'transition-colors',
                          isSelected
                            ? 'bg-gold-300/10 text-text-primary'
                            : 'hover:bg-bg-surface-hover text-text-secondary'
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                          isSelected ? 'bg-gold-300/20' : 'bg-bg-surface'
                        )}>
                          <Icon className={cn(
                            'w-4 h-4',
                            isSelected ? 'text-gold-300' : 'text-text-muted'
                          )} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            'font-medium truncate',
                            isSelected && 'text-gold-300'
                          )}>
                            {item.title}
                          </div>
                          {item.description && (
                            <div className="text-xs text-text-muted truncate">
                              {item.description}
                            </div>
                          )}
                        </div>

                        {item.shortcut && (
                          <kbd className="px-1.5 py-0.5 text-xs font-medium text-text-muted bg-bg-surface rounded border border-border-subtle">
                            {item.shortcut}
                          </kbd>
                        )}

                        {isSelected && (
                          <ArrowRight className="w-4 h-4 text-gold-300 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-text-muted">
                <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Ничего не найдено</p>
                <p className="text-xs mt-1">Попробуйте другой запрос</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border-subtle bg-bg-surface/50">
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-bg-surface rounded border border-border-subtle">↑</kbd>
                <kbd className="px-1 py-0.5 bg-bg-surface rounded border border-border-subtle">↓</kbd>
                навигация
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-bg-surface rounded border border-border-subtle">↵</kbd>
                выбрать
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default CommandCenter;
