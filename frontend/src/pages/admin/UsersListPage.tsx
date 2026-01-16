/**
 * Страница списка пользователей — Modern Theatre Elegance v3
 */

import { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Clock,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  director: 'Режиссёр',
  manager: 'Менеджер',
  technician: 'Техник',
  actor: 'Актёр',
  viewer: 'Наблюдатель',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/10 text-red-400',
  director: 'bg-purple-500/10 text-purple-400',
  manager: 'bg-blue-500/10 text-blue-400',
  technician: 'bg-amber-500/10 text-amber-400',
  actor: 'bg-emerald-500/10 text-emerald-400',
  viewer: 'bg-gray-500/10 text-gray-400',
};

export function UsersListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    // TODO: Загрузка с API
    setTimeout(() => {
      setUsers([
        {
          id: 1,
          email: 'admin@theatre.test',
          first_name: 'Администратор',
          last_name: 'Системный',
          role: 'admin',
          is_active: true,
          last_login: new Date().toISOString(),
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          email: 'director@theatre.test',
          first_name: 'Иван',
          last_name: 'Петров',
          role: 'director',
          is_active: true,
          last_login: new Date(Date.now() - 86400000).toISOString(),
          created_at: '2024-02-15T00:00:00Z',
        },
        {
          id: 3,
          email: 'tech@theatre.test',
          first_name: 'Сергей',
          last_name: 'Техников',
          role: 'technician',
          is_active: true,
          last_login: null,
          created_at: '2024-03-10T00:00:00Z',
        },
        {
          id: 4,
          email: 'manager@theatre.test',
          first_name: 'Мария',
          last_name: 'Менеджерова',
          role: 'manager',
          is_active: false,
          last_login: new Date(Date.now() - 604800000).toISOString(),
          created_at: '2024-04-01T00:00:00Z',
        },
      ]);
      setLoading(false);
    }, 500);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Никогда';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Никогда';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дн. назад`;
    if (days < 30) return `${Math.floor(days / 7)} нед. назад`;
    return formatDate(dateString);
  };

  const filteredUsers = users.filter(user => {
    if (search && !`${user.first_name} ${user.last_name} ${user.email}`.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (roleFilter && user.role !== roleFilter) return false;
    if (statusFilter === 'active' && !user.is_active) return false;
    if (statusFilter === 'inactive' && user.is_active) return false;
    return true;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    recentlyActive: users.filter(u => {
      if (!u.last_login) return false;
      const diff = Date.now() - new Date(u.last_login).getTime();
      return diff < 7 * 24 * 60 * 60 * 1000;
    }).length,
    inactive: users.filter(u => !u.is_active).length,
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-light to-surface p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-amber-400 text-sm flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" />
              Управление пользователями
            </p>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-text-primary mb-2">
              Пользователи
            </h1>
            <p className="text-text-secondary">
              Управление учётными записями и правами доступа
            </p>
          </div>

          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Добавить пользователя
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
              <p className="text-sm text-text-muted">Всего</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.active}</p>
              <p className="text-sm text-text-muted">Активных</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.recentlyActive}</p>
              <p className="text-sm text-text-muted">Недавно активны</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <UserX className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats.inactive}</p>
              <p className="text-sm text-text-muted">Неактивных</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Поиск по имени или email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full lg:w-48"
          >
            <option value="">Все роли</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full lg:w-48"
          >
            <option value="">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-light">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Пользователь</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Роль</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Статус</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Последний вход</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-text-muted">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><Skeleton className="h-10 w-48" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-6 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-6 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-6 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-8 w-8 ml-auto" /></td>
                </tr>
              ))
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                  Пользователи не найдены
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-gold">
                          {user.first_name[0]}{user.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-text-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={ROLE_COLORS[user.role]}>
                      {ROLE_LABELS[user.role] || user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={user.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}>
                      {user.is_active ? 'Активен' : 'Неактивен'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatRelativeTime(user.last_login)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default UsersListPage;
