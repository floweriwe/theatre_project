/**
 * Компонент шапки приложения — Modern Theatre Elegance v3
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  LogOut,
  User,
  Settings,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/utils/helpers';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/utils/constants';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title = 'Обзор', onMenuClick }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user, logout } = useAuthStore();

  const notifications = [
    { id: 1, text: 'Новый документ добавлен', time: '5 мин назад', unread: true },
    { id: 2, text: 'Репетиция через 1 час', time: '30 мин назад', unread: true },
    { id: 3, text: 'Инвентарь обновлён', time: '2 часа назад', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="h-16 bg-surface border-b border-white/5 flex items-center justify-between px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-text-secondary hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title */}
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="p-2 text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5">
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {isNotificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 bg-surface-light border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-white/5">
                  <h3 className="font-medium text-white">Уведомления</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors',
                        notification.unread && 'bg-gold/5'
                      )}
                    >
                      <p className="text-sm text-white">{notification.text}</p>
                      <p className="text-xs text-text-muted mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-2">
                  <button className="w-full py-2 text-sm text-gold hover:text-gold-light transition-colors">
                    Показать все
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Help */}
        <Link
          to="/help"
          className="p-2 text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
        >
          <HelpCircle className="w-5 h-5" />
        </Link>

        {/* Profile */}
        <div className="relative ml-2">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
              <span className="text-sm font-medium text-gold">
                {user?.firstName?.[0] || 'A'}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white">
                {user?.firstName || 'Администратор'}
              </p>
              <p className="text-xs text-text-muted">admin</p>
            </div>
            <ChevronDown className="w-4 h-4 text-text-muted hidden md:block" />
          </button>

          {/* Profile dropdown */}
          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface-light border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-white/5">
                  <p className="font-medium text-white">{user?.email || 'admin@theatre.test'}</p>
                  <p className="text-xs text-text-muted mt-0.5">Администратор</p>
                </div>
                <div className="p-1">
                  <Link
                    to={ROUTES.PROFILE}
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Профиль
                  </Link>
                  <Link
                    to={ROUTES.SETTINGS}
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Настройки
                  </Link>
                </div>
                <div className="p-1 border-t border-white/5">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Выйти
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
