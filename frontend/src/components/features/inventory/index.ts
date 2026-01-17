/**
 * Inventory Feature Components
 *
 * Компоненты для модуля инвентаря:
 * - ViewSwitcher - переключение режимов отображения
 * - BulkActionBar - панель массовых операций
 * - CategoryTreeFilter - фильтр по категориям (дерево)
 * - TagManager - управление тегами
 * - ImageUploader - загрузка изображений с превью
 * - InventoryPhotoGallery - галерея фото предмета
 * - PhysicalSpecsSection - физические характеристики
 */

export { ViewSwitcher, useViewMode } from './ViewSwitcher';
export type { ViewMode } from './ViewSwitcher';

export { BulkActionBar } from './BulkActionBar';

export { CategoryTreeFilter } from './CategoryTreeFilter';

export { TagManager } from './TagManager';

export { ImageUploader } from './ImageUploader';

export { InventoryPhotoGallery } from './InventoryPhotoGallery';

export { PhysicalSpecsSection } from './PhysicalSpecsSection';
