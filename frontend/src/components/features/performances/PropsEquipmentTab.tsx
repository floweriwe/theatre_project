/**
 * Таб "Реквизит и оборудование" для страницы спектакля.
 *
 * Отображает список привязанного инвентаря с возможностью добавления.
 */

import { useEffect, useState, useCallback } from 'react';
import { Box, Plus, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { performanceService } from '@/services/performance_service';
import { AddItemModal } from './AddItemModal';
import type { PerformanceInventoryItem } from '@/types';

interface PropsEquipmentTabProps {
  /** ID спектакля */
  performanceId: number;
}

/** Цвета статусов инвентаря */
const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  in_stock: 'success',
  reserved: 'info',
  in_use: 'warning',
  repair: 'error',
  written_off: 'default',
};

/** Метки статусов */
const STATUS_LABELS: Record<string, string> = {
  in_stock: 'На складе',
  reserved: 'Зарезервирован',
  in_use: 'В использовании',
  repair: 'На ремонте',
  written_off: 'Списан',
};

export function PropsEquipmentTab({ performanceId }: PropsEquipmentTabProps) {
  const [items, setItems] = useState<PerformanceInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await performanceService.getInventory(performanceId);
      setItems(response.items);
    } catch (err) {
      console.error('Failed to load inventory:', err);
      setError('Не удалось загрузить список реквизита');
    } finally {
      setLoading(false);
    }
  }, [performanceId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleItemAdded = () => {
    loadItems();
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-error/10 rounded-lg text-error">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-muted">
          <Box className="w-5 h-5" />
          <span className="text-sm">
            {items.length > 0
              ? `${items.length} предмет${items.length === 1 ? '' : items.length < 5 ? 'а' : 'ов'}`
              : 'Нет привязанного реквизита'}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить
        </Button>
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="text-center py-12 bg-bg-tertiary rounded-lg">
          <Package className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-50" />
          <p className="text-text-muted mb-2">Реквизит и оборудование не назначены</p>
          <p className="text-sm text-text-muted">
            Нажмите &quot;Добавить&quot; чтобы привязать предметы инвентаря
          </p>
        </div>
      ) : (
        /* Items table */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
                  Предмет
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
                  Статус
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-text-muted">
                  Кол-во
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
                  Примечание
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.itemId}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-text-primary font-medium">{item.itemName}</p>
                      <p className="text-sm text-text-muted">
                        {item.itemInventoryNumber}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={STATUS_COLORS[item.itemStatus] || 'default'}>
                      {STATUS_LABELS[item.itemStatus] || item.itemStatus}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center text-text-primary">
                    {item.quantityRequired}
                  </td>
                  <td className="py-3 px-4 text-text-secondary">
                    {item.note || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        performanceId={performanceId}
        onSuccess={handleItemAdded}
      />
    </div>
  );
}

export default PropsEquipmentTab;
