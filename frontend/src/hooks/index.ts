// Хуки приложения
export { useAuth } from './useAuth';
export type { UserRole } from './useAuth';
export type { User } from '@/types/auth_types';

// Query hooks (React Query)
export * from './queries';

// Keyboard navigation
export {
  useArrowNavigation,
  useFocusTrap,
  useEscapeKey,
  focusRingClasses,
} from './useKeyboardNavigation';

// Table filters
export { useTableFilters } from './useTableFilters';
export type { SortConfig, UseTableFiltersOptions, UseTableFiltersReturn } from './useTableFilters';

// Focus management (accessibility)
export {
  useRouteFocus,
  useFocusReturn,
  useFocusOnMount,
  useAutoFocus,
} from './useFocusManagement';
