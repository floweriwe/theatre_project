/**
 * Страница журнала аудита — Modern Theatre Elegance v3
 */

import { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  User,
  Clock,
  FileText,
  Package,
  Calendar,
  Settings,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';

interface AuditEntry {
  id: number;
  action: string;
  entityType: string;
  entityName: string;
  user: string;
  timestamp: string;
  details: string;
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Создание',
  update: 'Изменение',
  delete: 'Удаление',
  login: 'Вход',
  logout: 'Выход',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-500/10 text-emerald-400',
  update: 'bg-blue-500/10 text-blue-400',
  delete: 'bg-red-500/10 text-red-400',
  login: 'bg-purple-500/10 text-purple-400',
  logout: 'bg-gray-500/10 text-gray-400',
};

const ENTITY_ICONS: Record<string, typeof FileText> = {
  document: FileText,
  inventory: Package,
  schedule: Calendar,
  user: User,
  settings: Settings,
};

export function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const auditLog: AuditEntry[] = [
    {
      id: 1,
      action: 'create',
      entityType: 'document',
      entityName: 'Договор аренды №42',
      user: 'Иван Петров',
      timestamp: new Date().toISOString(),
      details: 'Создан новый документ в категории "Договоры"',
    },
    {
      id: 2,
      action: 'update',
      entityType: 'inventory',
      entityName: 'Костюм Гамлета',
      user: 'Мария Иванова',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      details: 'Изменён статус: "На складе" → "Зарезервировано"',
    },
    {
      id: 3,
      action: 'login',
      entityType: 'user',
      entityName: 'admin@theatre.test',
      user: 'Администратор',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      details: 'Успешный вход в систему',
    },
    {
      id: 4,
      action: 'delete',
      entityType: 'schedule',
      entityName: 'Репетиция "Вишнёвый сад"',
      user: 'Сергей Сидоров',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      details: 'Удалено событие из расписания',
    },
    {
      id: 5,
      action: 'update',
      entityType: 'settings',
      entityName: 'Настройки уведомлений',
      user: 'Администратор',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      details: 'Изменены параметры email-уведомлений',
    },
  ];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLog = auditLog.filter(entry => {
    if (search && !entry.entityName.toLowerCase().includes(search.toLowerCase()) && 
        !entry.user.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (actionFilter && entry.action !== actionFilter) return false;
    if (entityFilter && entry.entityType !== entityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-light to-surface p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-purple-400 text-sm flex items-center gap-2 mb-2">
              <History className="w-4 h-4" />
              Безопасность и контроль
            </p>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
              Журнал аудита
            </h1>
            <p className="text-text-secondary">
              История всех действий в системе
            </p>
          </div>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Поиск по объекту или пользователю..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full lg:w-40"
          >
            <option value="">Все действия</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full lg:w-40"
          >
            <option value="">Все объекты</option>
            <option value="document">Документы</option>
            <option value="inventory">Инвентарь</option>
            <option value="schedule">Расписание</option>
            <option value="user">Пользователи</option>
            <option value="settings">Настройки</option>
          </Select>
        </div>
      </Card>

      {/* Audit Log */}
      <Card className="divide-y divide-white/5">
        {filteredLog.length === 0 ? (
          <div className="p-8 text-center">
            <History className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Записи не найдены</h3>
            <p className="text-text-muted">Попробуйте изменить параметры фильтрации</p>
          </div>
        ) : (
          filteredLog.map((entry) => {
            const Icon = ENTITY_ICONS[entry.entityType] || FileText;
            return (
              <div key={entry.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={ACTION_COLORS[entry.action]}>
                        {ACTION_LABELS[entry.action]}
                      </Badge>
                      <span className="text-white font-medium truncate">{entry.entityName}</span>
                    </div>
                    <p className="text-sm text-text-secondary mb-2">{entry.details}</p>
                    <div className="flex items-center gap-4 text-sm text-text-muted">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {entry.user}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}

export default AuditLogPage;
