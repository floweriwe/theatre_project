/**
 * Страница детального просмотра предмета инвентаря
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Tag,
  Calendar,
  DollarSign,
  History,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { useToastHelpers } from '@/components/ui/Toast';
import { ROUTES } from '@/utils/constants';
import { inventoryService } from '@/services/inventory_service';
import { InventoryPhotoGallery, PhysicalSpecsSection } from '@/components/features/inventory';
import type { InventoryItem, ItemStatus } from '@/types/inventory_types';

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

export function InventoryItemPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToastHelpers();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadItem = useCallback(async (itemId: number, showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const data = await inventoryService.getItem(itemId);
      setItem(data);
    } catch (err) {
      console.error('Failed to load item:', err);
      setError('Не удалось загрузить данные предмета');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (id) {
      const itemId = parseInt(id, 10);
      if (isNaN(itemId) || itemId <= 0) {
        setError('Некорректный ID предмета');
        setLoading(false);
        return;
      }
      loadItem(itemId);
    }
  }, [id, loadItem]);

  const handlePhotoUpload = async (file: File) => {
    if (!item) return;

    setIsUploading(true);
    try {
      await inventoryService.uploadPhoto(item.id, file);
      toast.success('Фото загружено', 'Фотография успешно добавлена');
      // Перезагружаем данные предмета для обновления списка фото
      await loadItem(item.id, false);
    } catch (err) {
      console.error('Failed to upload photo:', err);
      toast.error('Ошибка загрузки', 'Не удалось загрузить фотографию');
    } finally {
      setIsUploading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card className="p-6">
          <Skeleton className="h-64" />
        </Card>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-6">
        <Alert variant="error">
          <AlertCircle className="w-4 h-4" />
          {error || 'Предмет не найден'}
        </Alert>
        <Button variant="outline" asChild>
          <Link to={ROUTES.INVENTORY}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться к списку
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={ROUTES.INVENTORY}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">{item.name}</h1>
            <p className="text-text-muted">{item.inventoryNumber}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to={`${ROUTES.INVENTORY}/${id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Редактировать
            </Link>
          </Button>
          <Button variant="danger">
            <Trash2 className="w-4 h-4 mr-2" />
            Удалить
          </Button>
        </div>
      </div>

      {/* Photo Gallery */}
      <InventoryPhotoGallery
        photos={item.photos || []}
        itemId={item.id}
        onUpload={handlePhotoUpload}
        isUploading={isUploading}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-text-primary mb-4">Основная информация</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-text-muted mb-1">Статус</p>
                <Badge className={STATUS_COLORS[item.status]}>
                  {STATUS_LABELS[item.status]}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-text-muted mb-1">Количество</p>
                <p className="text-text-primary font-medium">{item.quantity} шт.</p>
              </div>
              {item.category && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Категория</p>
                  <div className="flex items-center gap-2 text-text-primary">
                    <Tag className="w-4 h-4 text-blue-400" />
                    {item.category.name}
                  </div>
                </div>
              )}
              {item.location && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Местоположение</p>
                  <div className="flex items-center gap-2 text-text-primary">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    {item.location.name}
                  </div>
                </div>
              )}
            </div>

            {item.description && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-sm text-text-muted mb-2">Описание</p>
                <p className="text-text-secondary">{item.description}</p>
              </div>
            )}
          </Card>

          {/* Custom Fields */}
          {item.customFields && Object.keys(item.customFields).length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-medium text-text-primary mb-4">Дополнительные характеристики</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(item.customFields).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm text-text-muted mb-1 capitalize">{key}</p>
                    <p className="text-text-primary">{String(value)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* History */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-text-muted" />
              <h2 className="text-lg font-medium text-text-primary">История изменений</h2>
            </div>
            <p className="text-text-muted text-center py-8">
              История изменений пока недоступна
            </p>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Physical Specs */}
          <PhysicalSpecsSection
            dimensions={item.dimensions}
            weight={item.weight}
            condition={item.condition}
          />

          {/* Financial Info */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-medium text-text-primary">Стоимость</h2>
            </div>
            <div className="space-y-4">
              {item.purchasePrice && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Цена покупки</p>
                  <p className="text-xl font-bold text-text-primary">
                    {formatCurrency(item.purchasePrice)}
                  </p>
                </div>
              )}
              {item.currentValue && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Текущая стоимость</p>
                  <p className="text-xl font-bold text-gold">
                    {formatCurrency(item.currentValue)}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Dates */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-text-muted" />
              <h2 className="text-lg font-medium text-text-primary">Даты</h2>
            </div>
            <div className="space-y-4">
              {item.purchaseDate && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Дата покупки</p>
                  <p className="text-text-primary">{formatDate(item.purchaseDate)}</p>
                </div>
              )}
              {item.createdAt && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Добавлен в систему</p>
                  <p className="text-text-primary">{formatDate(item.createdAt)}</p>
                </div>
              )}
              {item.updatedAt && (
                <div>
                  <p className="text-sm text-text-muted mb-1">Последнее обновление</p>
                  <p className="text-text-primary">{formatDate(item.updatedAt)}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default InventoryItemPage;
