/**
 * Форма создания/редактирования инвентаря — Modern Theatre Elegance v3.
 * 
 * Поддерживает создание нового предмета и редактирование существующего.
 * Тёмная тема.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Package,
  Tag,
  Hash,
  Layers,
  CircleDollarSign,
  Calendar,
  Plus,
} from 'lucide-react';
import { Button, Input, Card, Alert, ContainerSpinner, Select } from '@/components/ui';
import { inventoryService } from '@/services/inventory_service';
import { ROUTES } from '@/utils/constants';
import type {
  InventoryCategory,
  StorageLocation,
  ItemStatus,
  InventoryItemCreateRequest,
  InventoryItemUpdateRequest,
} from '@/types';
import { STATUS_LABELS } from '@/types/inventory_types';

// =============================================================================
// Types
// =============================================================================

interface FormData {
  name: string;
  description: string;
  inventoryNumber: string;
  categoryId: string;
  locationId: string;
  status: ItemStatus;
  quantity: number;
  purchasePrice: string;
  currentValue: string;
  purchaseDate: string;
  warrantyUntil: string;
}

interface FormErrors {
  [key: string]: string;
}

// =============================================================================
// Initial Values
// =============================================================================

const initialFormData: FormData = {
  name: '',
  description: '',
  inventoryNumber: '',
  categoryId: '',
  locationId: '',
  status: 'in_stock',
  quantity: 1,
  purchasePrice: '',
  currentValue: '',
  purchaseDate: '',
  warrantyUntil: '',
};

// =============================================================================
// Status Options
// =============================================================================

const STATUS_OPTIONS = [
  { value: 'in_stock', label: STATUS_LABELS.in_stock },
  { value: 'reserved', label: STATUS_LABELS.reserved },
  { value: 'in_use', label: STATUS_LABELS.in_use },
  { value: 'repair', label: STATUS_LABELS.repair },
  { value: 'written_off', label: STATUS_LABELS.written_off },
];

// =============================================================================
// Main Component
// =============================================================================

export function InventoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';
  
  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  
  // Reference data
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load reference data and existing item
  const loadData = useCallback(async () => {
    try {
      const [categoriesData, locationsData] = await Promise.all([
        inventoryService.getCategories(),
        inventoryService.getLocations(),
      ]);
      
      setCategories(categoriesData);
      setLocations(locationsData);

      if (isEditing) {
        setLoading(true);
        const item = await inventoryService.getItem(Number(id));
        setFormData({
          name: item.name,
          description: item.description || '',
          inventoryNumber: item.inventoryNumber,
          categoryId: item.categoryId?.toString() || '',
          locationId: item.locationId?.toString() || '',
          status: item.status,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice?.toString() || '',
          currentValue: item.currentValue?.toString() || '',
          purchaseDate: item.purchaseDate || '',
          warrantyUntil: item.warrantyUntil || '',
        });
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [id, isEditing]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }
    
    if (!isEditing && !formData.inventoryNumber.trim()) {
      newErrors.inventoryNumber = 'Инвентарный номер обязателен';
    }
    
    if (formData.quantity < 1) {
      newErrors.quantity = 'Количество должно быть больше 0';
    }
    
    if (formData.purchasePrice && isNaN(parseFloat(formData.purchasePrice))) {
      newErrors.purchasePrice = 'Введите корректную сумму';
    }
    
    if (formData.currentValue && isNaN(parseFloat(formData.currentValue))) {
      newErrors.currentValue = 'Введите корректную сумму';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => new Set(prev).add(field));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched(new Set(Object.keys(formData)));
    
    if (!validate()) {
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      if (isEditing) {
        const updateData: InventoryItemUpdateRequest = {
          name: formData.name,
          description: formData.description || undefined,
          categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
          locationId: formData.locationId ? Number(formData.locationId) : undefined,
          status: formData.status,
          quantity: formData.quantity,
          purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
          currentValue: formData.currentValue ? parseFloat(formData.currentValue) : undefined,
          purchaseDate: formData.purchaseDate || undefined,
          warrantyUntil: formData.warrantyUntil || undefined,
        };
        
        await inventoryService.updateItem(Number(id), updateData);
        setSuccess('Предмет успешно обновлён');
        
        setTimeout(() => {
          navigate(`${ROUTES.INVENTORY}/${id}`);
        }, 1000);
      } else {
        const createData: InventoryItemCreateRequest = {
          name: formData.name,
          description: formData.description || undefined,
          inventoryNumber: formData.inventoryNumber || undefined,
          categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
          locationId: formData.locationId ? Number(formData.locationId) : undefined,
          quantity: formData.quantity,
          purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
          currentValue: formData.currentValue ? parseFloat(formData.currentValue) : undefined,
          purchaseDate: formData.purchaseDate || undefined,
          warrantyUntil: formData.warrantyUntil || undefined,
        };
        
        const newItem = await inventoryService.createItem(createData);
        setSuccess('Предмет успешно создан');
        
        setTimeout(() => {
          navigate(`${ROUTES.INVENTORY}/${newItem.id}`);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Failed to save:', err);
      if (err.response?.status === 409) {
        setError('Предмет с таким инвентарным номером уже существует');
      } else {
        setError('Ошибка сохранения. Попробуйте ещё раз.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Build category options
  const categoryOptions = [
    { value: '', label: 'Выберите категорию' },
    ...categories.map(c => ({ value: c.id.toString(), label: c.name })),
  ];

  // Build location options
  const locationOptions = [
    { value: '', label: 'Выберите место хранения' },
    ...locations.map(l => ({ value: l.id.toString(), label: l.name })),
  ];

  if (loading) {
    return <ContainerSpinner />;
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-elevated via-bg-elevated to-bg-surface p-8">
        {/* Декоративные элементы */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold-300/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <Link to={isEditing ? `${ROUTES.INVENTORY}/${id}` : ROUTES.INVENTORY}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-5 h-5 text-gold-300" />
                <span className="text-sm text-gold-300 font-medium">Инвентарь</span>
              </div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-text-primary">
                {isEditing ? 'Редактирование предмета' : 'Новый предмет'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success">
          {success}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h2 className="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-gold-300" />
                Основная информация
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Название *"
                  placeholder="Введите название"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={touched.has('name') ? errors.name : undefined}
                  leftIcon={<Package className="w-4 h-4" />}
                />
                
                <Input
                  label="Инвентарный номер"
                  placeholder="Авто-генерация при пустом"
                  value={formData.inventoryNumber}
                  onChange={(e) => handleChange('inventoryNumber', e.target.value)}
                  error={touched.has('inventoryNumber') ? errors.inventoryNumber : undefined}
                  leftIcon={<Hash className="w-4 h-4" />}
                  disabled={isEditing}
                />
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Описание
                  </label>
                  <textarea
                    placeholder="Введите описание предмета"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-bg-surface-hover border border-border-subtle rounded-xl 
                      text-text-primary placeholder:text-text-muted
                      focus:outline-none focus:ring-2 focus:ring-gold-300/50 focus:border-gold-300/50
                      transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Classification */}
            <div className="pt-6 border-t border-border-subtle">
              <h2 className="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-gold-300" />
                Классификация
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Категория"
                  options={categoryOptions}
                  value={formData.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                />
                
                <Select
                  label="Место хранения"
                  options={locationOptions}
                  value={formData.locationId}
                  onChange={(e) => handleChange('locationId', e.target.value)}
                />
                
                {isEditing && (
                  <Select
                    label="Статус"
                    options={STATUS_OPTIONS}
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Quantity & Price */}
            <div className="pt-6 border-t border-border-subtle">
              <h2 className="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-gold-300" />
                Количество и стоимость
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Количество *"
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                  error={touched.has('quantity') ? errors.quantity : undefined}
                  leftIcon={<Layers className="w-4 h-4" />}
                />
                
                <Input
                  label="Стоимость закупки"
                  placeholder="0"
                  value={formData.purchasePrice}
                  onChange={(e) => handleChange('purchasePrice', e.target.value)}
                  error={touched.has('purchasePrice') ? errors.purchasePrice : undefined}
                  leftIcon={<CircleDollarSign className="w-4 h-4" />}
                />
                
                <Input
                  label="Текущая стоимость"
                  placeholder="0"
                  value={formData.currentValue}
                  onChange={(e) => handleChange('currentValue', e.target.value)}
                  error={touched.has('currentValue') ? errors.currentValue : undefined}
                  leftIcon={<CircleDollarSign className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="pt-6 border-t border-border-subtle">
              <h2 className="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold-300" />
                Даты
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Дата закупки"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleChange('purchaseDate', e.target.value)}
                />
                
                <Input
                  label="Гарантия до"
                  type="date"
                  value={formData.warrantyUntil}
                  onChange={(e) => handleChange('warrantyUntil', e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row gap-3 justify-end">
              <Link to={isEditing ? `${ROUTES.INVENTORY}/${id}` : ROUTES.INVENTORY}>
                <Button variant="secondary" className="w-full sm:w-auto">
                  Отмена
                </Button>
              </Link>
              
              <Button 
                type="submit" 
                variant="primary"
                loading={saving}
                leftIcon={isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              >
                {isEditing ? 'Сохранить изменения' : 'Создать предмет'}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
