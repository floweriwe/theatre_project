/**
 * Страница управления категориями — Modern Theatre Elegance v3
 */

import { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  Package,
  FileText,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface Category {
  id: number;
  name: string;
  code: string;
  type: 'inventory' | 'document';
  color: string;
  itemsCount: number;
  isActive: boolean;
}

export function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const categories: Category[] = [
    { id: 1, name: 'Костюмы', code: 'costumes', type: 'inventory', color: '#8B5CF6', itemsCount: 45, isActive: true },
    { id: 2, name: 'Реквизит', code: 'props', type: 'inventory', color: '#3B82F6', itemsCount: 78, isActive: true },
    { id: 3, name: 'Декорации', code: 'scenery', type: 'inventory', color: '#10B981', itemsCount: 23, isActive: true },
    { id: 4, name: 'Технические документы', code: 'tech', type: 'document', color: '#F59E0B', itemsCount: 34, isActive: true },
    { id: 5, name: 'Договоры', code: 'contracts', type: 'document', color: '#EF4444', itemsCount: 12, isActive: true },
    { id: 6, name: 'Кадровые документы', code: 'hr', type: 'document', color: '#EC4899', itemsCount: 8, isActive: false },
  ];

  const filteredCategories = categories.filter(cat => {
    if (search && !cat.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && cat.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-light to-surface p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-blue-400 text-sm flex items-center gap-2 mb-2">
              <FolderOpen className="w-4 h-4" />
              Настройка системы
            </p>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
              Категории
            </h1>
            <p className="text-text-secondary">
              Управление категориями инвентаря и документов
            </p>
          </div>

          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Добавить категорию
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
                placeholder="Поиск категорий..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={typeFilter === '' ? 'primary' : 'outline'}
              onClick={() => setTypeFilter('')}
            >
              Все
            </Button>
            <Button
              variant={typeFilter === 'inventory' ? 'primary' : 'outline'}
              onClick={() => setTypeFilter('inventory')}
            >
              <Package className="w-4 h-4 mr-2" />
              Инвентарь
            </Button>
            <Button
              variant={typeFilter === 'document' ? 'primary' : 'outline'}
              onClick={() => setTypeFilter('document')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Документы
            </Button>
          </div>
        </div>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((category) => (
          <Card key={category.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {category.type === 'inventory' ? (
                    <Package className="w-5 h-5" style={{ color: category.color }} />
                  ) : (
                    <FileText className="w-5 h-5" style={{ color: category.color }} />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-white">{category.name}</h3>
                  <p className="text-sm text-text-muted">{category.code}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={category.type === 'inventory' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}>
                  {category.type === 'inventory' ? 'Инвентарь' : 'Документы'}
                </Badge>
                {!category.isActive && (
                  <Badge className="bg-red-500/10 text-red-400">Неактивна</Badge>
                )}
              </div>
              <span className="text-sm text-text-muted">{category.itemsCount} элементов</span>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Edit className="w-4 h-4 mr-1" />
                Изменить
              </Button>
              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <Card className="p-8 text-center">
          <FolderOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Категории не найдены</h3>
          <p className="text-text-muted mb-4">Попробуйте изменить параметры поиска</p>
        </Card>
      )}
    </div>
  );
}

export default CategoriesPage;
