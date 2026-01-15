/**
 * Компонент боковой панели навигации — Modern Theatre Elegance v3
 */

import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FileText,
  Theater,
  Calendar,
  Settings,
  X,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Users,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/utils/helpers';
import { ROUTES } from '@/utils/constants';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'ГЛАВНОЕ',
    items: [
      {
        path: ROUTES.DASHBOARD,
        label: 'Обзор',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'УПРАВЛЕНИЕ',
    items: [
      {
        path: ROUTES.INVENTORY,
        label: 'Инвентарь',
        icon: Package,
      },
      {
        path: ROUTES.DOCUMENTS,
        label: 'Документы',
        icon: FileText,
      },
      {
        path: ROUTES.PERFORMANCES,
        label: 'Спектакли',
        icon: Theater,
        badge: 'NEW',
      },
      {
        path: ROUTES.SCHEDULE,
        label: 'Расписание',
        icon: Calendar,
      },
    ],
  },
  {
    title: 'ОТЧЁТЫ',
    items: [
      {
        path: '/reports',
        label: 'Аналитика',
        icon: BarChart3,
      },
    ],
  },
  {
    title: 'АДМИНИСТРИРОВАНИЕ',
    items: [
      {
        path: '/admin/users',
        label: 'Пользователи',
        icon: Users,
      },
      {
        path: ROUTES.SETTINGS,
        label: 'Настройки',
        icon: Settings,
      },
    ],
  },
  {
    title: 'СПРАВКА',
    items: [
      {
        path: '/help',
        label: 'Центр помощи',
        icon: HelpCircle,
      },
    ],
  },
];

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation();

  const isActiveRoute = (path: string) => {
    if (path === ROUTES.DASHBOARD) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-[280px] bg-surface border-r border-white/5',
          'transform transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="font-display text-lg font-semibold text-white">
                Theatre
              </span>
              <span className="block text-[10px] text-gold tracking-wider uppercase">
                Management System
              </span>
            </div>
          </Link>
          
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-text-secondary hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100%-4rem)]">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-medium text-text-muted tracking-wider mb-2 px-3">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = isActiveRoute(item.path);
                  const Icon = item.icon;

                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                          'transition-all duration-200 group',
                          isActive
                            ? 'bg-gold/10 text-gold'
                            : 'text-text-secondary hover:text-white hover:bg-white/5'
                        )}
                      >
                        <Icon className={cn(
                          'w-5 h-5 transition-colors',
                          isActive ? 'text-gold' : 'text-text-muted group-hover:text-white'
                        )} />
                        <span className="flex-1 text-sm font-medium">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gold/20 text-gold rounded">
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <ChevronRight className="w-4 h-4 text-gold" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-text-muted text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Theatre</span>
            <span className="text-text-muted/50">v1.0.0 • MVP</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
