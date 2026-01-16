import React, { useState, useRef, useEffect } from 'react';

/**
 * Типы уведомлений
 */
type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'document' | 'schedule' | 'inventory';

/**
 * Интерфейс уведомления
 */
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  actor?: {
    name: string;
    avatar?: string;
  };
}

/**
 * Пропсы компонента NotificationCenter
 */
interface NotificationCenterProps {
  /** Максимальное количество отображаемых уведомлений */
  maxVisible?: number;
}

/**
 * Моковые данные уведомлений
 */
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'document',
    title: 'Новый документ',
    message: 'Добавлен технический райдер для спектакля "Гамлет"',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 минут назад
    read: false,
    link: '/documents/1',
    actor: {
      name: 'Анна Петрова',
    },
  },
  {
    id: '2',
    type: 'schedule',
    title: 'Изменение в расписании',
    message: 'Репетиция "Чайки" перенесена на 15:00',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 минут назад
    read: false,
    link: '/schedule',
    actor: {
      name: 'Иван Сидоров',
    },
  },
  {
    id: '3',
    type: 'inventory',
    title: 'Инвентарь на ремонте',
    message: 'Софит №5 отправлен на техническое обслуживание',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 часа назад
    read: true,
    link: '/inventory/5',
  },
  {
    id: '4',
    type: 'success',
    title: 'Спектакль утверждён',
    message: 'Премьера "Вишнёвого сада" назначена на 15 января',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 часов назад
    read: true,
    link: '/performances/3',
  },
  {
    id: '5',
    type: 'warning',
    title: 'Истекает срок',
    message: 'Сертификат на противопожарное оборудование истекает через 7 дней',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 день назад
    read: true,
  },
  {
    id: '6',
    type: 'info',
    title: 'Системное обновление',
    message: 'Плановые технические работы запланированы на воскресенье с 02:00 до 06:00',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 дня назад
    read: true,
  },
];

/**
 * Центр уведомлений — компонент для отображения списка уведомлений.
 * Отображается в хедере приложения.
 */
export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  maxVisible = 10,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications
    .filter((n) => (filter === 'unread' ? !n.read : true))
    .slice(0, maxVisible);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  /**
   * Форматирование времени уведомления
   */
  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    if (days < 7) return `${days} дн. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  /**
   * Иконка типа уведомления
   */
  const getTypeIcon = (type: NotificationType) => {
    const icons: Record<NotificationType, React.ReactNode> = {
      info: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      success: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      warning: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      error: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      document: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      schedule: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      inventory: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    };
    return icons[type];
  };

  /**
   * Цвет типа уведомления
   */
  const getTypeColor = (type: NotificationType): string => {
    const colors: Record<NotificationType, string> = {
      info: 'text-blue-400 bg-blue-500/10',
      success: 'text-green-400 bg-green-500/10',
      warning: 'text-amber-400 bg-amber-500/10',
      error: 'text-red-400 bg-red-500/10',
      document: 'text-purple-400 bg-purple-500/10',
      schedule: 'text-cyan-400 bg-cyan-500/10',
      inventory: 'text-orange-400 bg-orange-500/10',
    };
    return colors[type];
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Кнопка-триггер */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
        aria-label="Уведомления"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Бейдж с количеством непрочитанных */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-text-primary text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Выпадающая панель */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-surface border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          {/* Заголовок */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-text-primary">Уведомления</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-gold hover:text-gold-light transition-colors"
                >
                  Прочитать все
                </button>
              )}
            </div>

            {/* Фильтры */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-gold/20 text-gold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === 'unread'
                    ? 'bg-gold/20 text-gold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
              >
                Непрочитанные
                {unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Список уведомлений */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-text-secondary">
                  {filter === 'unread' ? 'Нет непрочитанных уведомлений' : 'Нет уведомлений'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative px-4 py-3 hover:bg-white/5 transition-colors group ${
                      !notification.read ? 'bg-white/5' : ''
                    }`}
                  >
                    {/* Индикатор непрочитанного */}
                    {!notification.read && (
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-gold rounded-full" />
                    )}

                    <div className="flex gap-3">
                      {/* Иконка типа */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.type)}`}>
                        {getTypeIcon(notification.type)}
                      </div>

                      {/* Контент */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-text-primary truncate">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-text-muted flex-shrink-0">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        {notification.actor && (
                          <p className="text-xs text-text-muted mt-1">
                            от {notification.actor.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Кнопки действий (при наведении) */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-1 rounded hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
                          title="Прочитано"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 rounded hover:bg-white/10 text-text-secondary hover:text-red-400 transition-colors"
                        title="Удалить"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Футер */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={clearAll}
                className="text-sm text-text-secondary hover:text-red-400 transition-colors"
              >
                Очистить все
              </button>
              <a
                href="/notifications"
                className="text-sm text-gold hover:text-gold-light transition-colors"
              >
                Все уведомления →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
