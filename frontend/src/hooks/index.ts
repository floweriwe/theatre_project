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
