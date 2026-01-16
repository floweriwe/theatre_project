/**
 * Страница списка инвентаря — Modern Theatre Elegance v3
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Grid,
  List,
  RefreshCw,
  MapPin,
  Tag,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { PageHero } from '@/components/ui/PageHero';
import { cn } from '@/utils/helpers';
import { ROUTES } from '@/utils/constants';
import { inventoryService } from '@/services/inventory_service';
import type { InventoryItemList, InventoryCategory, ItemStatus, InventoryStats } from '@/types/inventory_types';

const STATUS_LABELS: Record<ItemStatus, string> = {
  in_stock: 'На складе',
  reserved: 'Зарезервировано',
  in_use: 'В использовании',
  repair: 'На ремонте',
  written_off: 'Списано',
};

const STATUS_COLORS: Record<ItemStatus, string> = {
  in_stock: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  reserved: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  in_use: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  repair: 'bg-red-500/10 text-red-400 border-red-500/20',
  written_off: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export function InventoryListPage() {
  const [items, setItems] = useState<InventoryItemList[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [stats, setStats] = useState<InventoryStats | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [itemsData, categoriesData, statsData] = await Promise.all([
        inventoryService.getItems({
          categoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
          status: selectedStatus as ItemStatus || undefined,
          search: search || undefined,
        }),
        inventoryService.getCategories(),
        inventoryService.getStats(),
      ]);

      setItems(itemsData.items || []);
      setStats(statsData);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
      setError('Не удалось загрузить данные инвентаря');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <PageHero
        label="Управление имуществом"
        labelIcon={<Package className="w-4 h-4" />}
        title="Инвентарь"
        subtitle={`${stats?.totalItems || items.length} единиц оборудования и реквизита на общую сумму ${formatCurrency(stats?.totalValue || 0)}`}
        accentColor="blue"
        action={
          <>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
            <Button asChild>
              <Link to={`${ROUTES.INVENTORY}/new`}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </Link>
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats?.totalItems || items.length}</p>
              <p className="text-sm text-text-muted">Всего</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats?.inStock || 0}</p>
              <p className="text-sm text-text-muted">На складе</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats?.reserved || 0}</p>
              <p className="text-sm text-text-muted">Зарезервировано</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats?.inUse || 0}</p>
              <p className="text-sm text-text-muted">В использовании</p>
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
                placeholder="Поиск по названию или инвентарному номеру..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full lg:w-48"
          >
            <option value="">Все категории</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </Select>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full lg:w-48"
          >
            <option value="">Все статусы</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <div className="flex gap-1 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded',
                viewMode === 'grid' ? 'bg-white/10 text-text-primary' : 'text-text-muted hover:text-text-primary'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded',
                viewMode === 'list' ? 'bg-white/10 text-text-primary' : 'text-text-muted hover:text-text-primary'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-32 mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">Нет данных</h3>
          <p className="text-text-muted mb-4">
            Инвентарь пуст или не найдено элементов по заданным фильтрам
          </p>
          <Button asChild>
            <Link to={`${ROUTES.INVENTORY}/new`}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить первый элемент
            </Link>
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <Link key={item.id} to={`${ROUTES.INVENTORY}/${item.id}`}>
              <Card className="p-4 hover:border-blue-500/30 transition-colors h-full">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-text-primary line-clamp-2">{item.name}</h3>
                  <Badge className={STATUS_COLORS[item.status]}>
                    {STATUS_LABELS[item.status]}
                  </Badge>
                </div>
                <p className="text-sm text-text-muted mb-3">{item.inventoryNumber}</p>
                <div className="space-y-2 text-sm">
                  {item.categoryName && (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Tag className="w-4 h-4" />
                      <span>{item.categoryName}</span>
                    </div>
                  )}
                  {item.locationName && (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <MapPin className="w-4 h-4" />
                      <span>{item.locationName}</span>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-light">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Название</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Инв. номер</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Категория</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Статус</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-text-muted">Кол-во</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 cursor-pointer" onClick={() => window.location.href = `${ROUTES.INVENTORY}/${item.id}`}>
                  <td className="px-4 py-3 text-text-primary">{item.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{item.inventoryNumber}</td>
                  <td className="px-4 py-3 text-text-secondary">{item.categoryName || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_COLORS[item.status]}>
                      {STATUS_LABELS[item.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary">
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

export default InventoryListPage;
