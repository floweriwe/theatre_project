/**
 * UI Components — Modern Theatre Elegance v3
 * 
 * Экспорт всех UI компонентов дизайн-системы.
 * Тёмная тема.
 */

// Core UI
export { Button } from './Button';
export { 
  Card, 
  CardStat, 
  CardDivider, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter 
} from './Card';
export { Input } from './Input';
export { Select } from './Select';
export { Badge } from './Badge';
export { Alert } from './Alert';
export { Modal } from './Modal';
export { Table } from './Table';
export { VirtualTable } from './VirtualTable';
export { SearchableSelect } from './SearchableSelect';
export { MultiSelect } from './MultiSelect';
export { ProgressRing } from './ProgressRing';
export { StepWizard, StepNavigation } from './StepWizard';
export { ImageGallery } from './ImageGallery';
export { PageHero } from './PageHero';
export { FormField } from './FormField';
export { FilterBar } from './FilterBar';

// Navigation & Layout
export { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
  VerticalTabs,
  VerticalTabsList,
  VerticalTabsTrigger,
  VerticalTabsContent
} from './Tabs';

export {
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
  DropdownCheckboxItem,
  DropdownSubmenu,
  DropdownTriggerButton
} from './Dropdown';

export {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionContent
} from './Accordion';

// Loading States
export { Spinner, ContainerSpinner, FullPageSpinner } from './Spinner';
export {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonStats,
  SkeletonInventoryGrid
} from './Skeleton';

// Feedback
export { ToastProvider, useToast, useToastHelpers } from './Toast';
export {
  ErrorBoundary,
  PageErrorBoundary,
  ModuleErrorBoundary,
  withErrorBoundary,
} from './ErrorBoundary';
export { SkipToContent } from './SkipToContent';
export { VisuallyHidden } from './VisuallyHidden';
export { LiveAnnouncerProvider, useLiveAnnouncer } from './LiveAnnouncer';
export { AccessibleIcon, IconButton } from './AccessibleIcon';

// Types re-export
export type { SelectOption } from './Select';
export type { SelectOption as SearchableSelectOption, SelectGroup } from './SearchableSelect';
export type { MultiSelectOption } from './MultiSelect';
export type { VirtualColumn, VirtualTableProps } from './VirtualTable';
export type { WizardStep } from './StepWizard';
export type { GalleryImage } from './ImageGallery';
export type { FilterChip, FilterPreset } from './FilterBar';
