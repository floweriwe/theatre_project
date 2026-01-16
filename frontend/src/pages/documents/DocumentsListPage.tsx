/**
 * Страница списка документов — Modern Theatre Elegance v3
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Grid,
  List,
  RefreshCw,
  Tag,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { cn } from '@/utils/helpers';
import { ROUTES } from '@/utils/constants';
import { documentService } from '@/services/document_service';
import type { DocumentListItem, DocumentCategory, DocumentStatus, DocumentStats } from '@/types/document_types';

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Черновик',
  active: 'Активный',
  archived: 'В архиве',
};

const STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  archived: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export function DocumentsListPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [sortBy, setSortBy] = useState<string>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [docsData, catsData, statsData] = await Promise.all([
        documentService.getDocuments({
          categoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
          status: selectedStatus as DocumentStatus || undefined,
          search: search || undefined,
          limit: 100,
        }),
        documentService.getCategories(),
        documentService.getStats(),
      ]);

      setDocuments(docsData.items || []);
      setCategories(catsData || []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Не удалось загрузить документы');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number | undefined | null) => {
    if (!bytes || bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Sort documents
  const sortedDocuments = [...documents].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = (a.fileSize || 0) - (b.fileSize || 0);
        break;
      case 'created':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updated':
      default:
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-light to-surface p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-emerald-400 text-sm flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" />
              Документооборот театра
            </p>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-text-primary mb-2">
              Документы
            </h1>
            <p className="text-text-secondary">
              {stats?.totalDocuments || documents.length} документов общим размером{' '}
              {formatBytes(stats?.totalSize)}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
            <Button asChild>
              <Link to={`${ROUTES.DOCUMENTS}/new`}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats?.totalDocuments || 0}</p>
              <p className="text-sm text-text-muted">Всего</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats?.active || 0}</p>
              <p className="text-sm text-text-muted">Активных</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stats?.draft || 0}</p>
              <p className="text-sm text-text-muted">Черновиков</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{formatBytes(stats?.totalSize)}</p>
              <p className="text-sm text-text-muted">Размер</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Поиск документов..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Category filter */}
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

          {/* Status filter */}
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full lg:w-40"
          >
            <option value="">Все статусы</option>
            <option value="active">Активный</option>
            <option value="draft">Черновик</option>
            <option value="archived">В архиве</option>
          </Select>

          {/* Sort */}
          <div className="flex gap-2">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full lg:w-44"
            >
              <option value="updated">По дате изменения</option>
              <option value="created">По дате создания</option>
              <option value="name">По названию</option>
              <option value="size">По размеру</option>
            </Select>
            <button
              onClick={toggleSortOrder}
              className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
              title={sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </button>
          </div>
          
          {/* View mode toggle */}
          <div className="flex gap-1 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'grid' ? 'bg-white/10 text-text-primary' : 'text-text-muted hover:text-text-primary'
              )}
              title="Плитки"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'list' ? 'bg-white/10 text-text-primary' : 'text-text-muted hover:text-text-primary'
              )}
              title="Таблица"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Documents */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-12 w-12 rounded-lg mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : sortedDocuments.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">Нет документов</h3>
          <p className="text-text-muted mb-4">Документы не найдены</p>
          <Button asChild>
            <Link to={`${ROUTES.DOCUMENTS}/new`}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить документ
            </Link>
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedDocuments.map((doc) => (
            <Link key={doc.id} to={`${ROUTES.DOCUMENTS}/${doc.id}`}>
              <Card className="p-4 hover:border-emerald-500/30 transition-colors h-full flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text-primary text-sm leading-tight line-clamp-2" title={doc.name}>
                      {doc.name}
                    </h3>
                    <p className="text-xs text-text-muted mt-1 truncate" title={doc.fileName}>
                      {doc.fileName}
                    </p>
                  </div>
                </div>
                
                {doc.categoryName && (
                  <div className="flex items-center gap-1 text-xs text-text-secondary mb-3">
                    <Tag className="w-3 h-3" />
                    <span>{doc.categoryName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm mt-auto pt-3 border-t border-white/5">
                  <span className="text-text-muted">{formatBytes(doc.fileSize)}</span>
                  <Badge className={cn('text-xs', STATUS_COLORS[doc.status])}>
                    v{doc.currentVersion}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-light border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Название</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Файл</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Категория</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Статус</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-text-muted">Размер</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">Версия</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-text-muted">Изменён</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedDocuments.map((doc) => (
                  <tr 
                    key={doc.id} 
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => navigate(`${ROUTES.DOCUMENTS}/${doc.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-text-primary font-medium truncate max-w-[200px]" title={doc.name}>
                          {doc.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-sm truncate max-w-[150px]" title={doc.fileName}>
                      {doc.fileName}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-sm">
                      {doc.categoryName || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-xs', STATUS_COLORS[doc.status])}>
                        {STATUS_LABELS[doc.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-text-secondary text-sm">
                      {formatBytes(doc.fileSize)}
                    </td>
                    <td className="px-4 py-3 text-center text-emerald-400 text-sm font-medium">
                      v{doc.currentVersion}
                    </td>
                    <td className="px-4 py-3 text-right text-text-muted text-sm">
                      {formatDate(doc.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default DocumentsListPage;
