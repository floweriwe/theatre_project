/**
 * Модальное окно добавления предмета инвентаря к спектаклю.
 */

import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToastHelpers } from '@/components/ui/Toast';
import { inventoryService } from '@/services/inventory_service';
import { performanceService } from '@/services/performance_service';
import type { InventoryItemList } from '@/types';

interface AddItemModalProps {
  /** Открыто ли окно */
  isOpen: boolean;
  /** Callback закрытия */
  onClose: () => void;
  /** ID спектакля */
  performanceId: number;
  /** Callback успешного добавления */
  onSuccess: () => void;
}

export function AddItemModal({
  isOpen,
  onClose,
  performanceId,
  onSuccess,
}: AddItemModalProps) {
  const toast = useToastHelpers();

  // Состояния
  const [items, setItems] = useState<InventoryItemList[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Выбранный предмет
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  // Загрузка списка инвентаря
  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getItems({ limit: 100 });
      setItems(response.items);
    } catch (err) {
      console.error('Failed to load items:', err);
      toast.error('Ошибка', 'Не удалось загрузить список инвентаря');
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация по поиску
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const searchLower = search.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.inventoryNumber.toLowerCase().includes(searchLower)
    );
  }, [items, search]);

  // Сброс формы при закрытии
  const handleClose = () => {
    setSearch('');
    setSelectedItemId(null);
    setQuantity(1);
    setNote('');
    onClose();
  };

  // Отправка формы
  const handleSubmit = async () => {
    if (!selectedItemId) {
      toast.warning('Внимание', 'Выберите предмет из списка');
      return;
    }

    setSubmitting(true);
    try {
      await performanceService.addInventory(performanceId, {
        itemId: selectedItemId,
        quantityRequired: quantity,
        note: note.trim() || undefined,
      });
      toast.success('Добавлено', 'Предмет успешно привязан к спектаклю');
      handleClose();
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to add item:', err);
      // Проверяем на 409 Conflict
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 409) {
        toast.error('Ошибка', 'Этот предмет уже привязан к спектаклю');
      } else {
        toast.error('Ошибка', 'Не удалось добавить предмет');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Добавить реквизит"
      subtitle="Выберите предмет инвентаря для привязки к спектаклю"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!selectedItemId || submitting}
            loading={submitting}
          >
            Добавить
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Поиск */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Поиск по названию или номеру..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Список предметов */}
        <div className="max-h-60 overflow-y-auto border border-border-default rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              {search ? 'Ничего не найдено' : 'Нет доступного инвентаря'}
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${
                    selectedItemId === item.id ? 'bg-gold/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-sm text-text-muted">
                        {item.inventoryNumber}
                        {item.categoryName && ` • ${item.categoryName}`}
                      </p>
                    </div>
                    {selectedItemId === item.id && (
                      <div className="w-2 h-2 rounded-full bg-gold" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Выбранный предмет и параметры */}
        {selectedItem && (
          <div className="p-4 bg-bg-tertiary rounded-lg space-y-4">
            <div>
              <p className="text-sm text-text-muted mb-1">Выбрано</p>
              <p className="text-white font-medium">{selectedItem.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">
                  Количество
                </label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-2">
                  Примечание
                </label>
                <Input
                  placeholder="Например, 'Только в 1 акте'"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default AddItemModal;
