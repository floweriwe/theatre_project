/**
 * PageLayout — Consistent page structure wrapper
 * Modern Theatre Elegance v3
 *
 * Provides:
 * - Page header with title, description, and actions
 * - Responsive content area
 * - Optional sidebar/aside
 * - Breadcrumb support
 */

import { cn } from '@/utils/helpers';
import type { ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageLayoutProps {
  /** Page title */
  title?: string;
  /** Page description */
  description?: string;
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** Action buttons for page header */
  actions?: ReactNode;
  /** Main content */
  children: ReactNode;
  /** Optional sidebar content */
  sidebar?: ReactNode;
  /** Sidebar position */
  sidebarPosition?: 'left' | 'right';
  /** Sidebar width */
  sidebarWidth?: 'sm' | 'md' | 'lg';
  /** Additional class names for content area */
  className?: string;
  /** Full-width mode (no max-width constraint) */
  fullWidth?: boolean;
}

// =============================================================================
// Sidebar Width Mappings
// =============================================================================

const sidebarWidthClasses = {
  sm: 'w-full lg:w-64',
  md: 'w-full lg:w-80',
  lg: 'w-full lg:w-96',
};

// =============================================================================
// Component
// =============================================================================

export function PageLayout({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  sidebar,
  sidebarPosition = 'right',
  sidebarWidth = 'md',
  className,
  fullWidth = false,
}: PageLayoutProps) {
  const hasSidebar = !!sidebar;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && <span>/</span>}
              {item.href ? (
                <a
                  href={item.href}
                  className="hover:text-text-primary transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <span className={index === breadcrumbs.length - 1 ? 'text-text-primary' : ''}>
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Page Header */}
      {(title || actions) && (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {title && (
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-text-primary">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-sm sm:text-base text-text-secondary">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3 flex-shrink-0">
              {actions}
            </div>
          )}
        </header>
      )}

      {/* Content Area */}
      {hasSidebar ? (
        <div className={cn(
          'flex flex-col lg:flex-row gap-6',
          sidebarPosition === 'left' && 'lg:flex-row-reverse'
        )}>
          {/* Main Content */}
          <main className={cn('flex-1 min-w-0', className)}>
            {children}
          </main>

          {/* Sidebar */}
          <aside className={cn(
            'flex-shrink-0',
            sidebarWidthClasses[sidebarWidth]
          )}>
            {sidebar}
          </aside>
        </div>
      ) : (
        <main className={cn(
          !fullWidth && 'max-w-none',
          className
        )}>
          {children}
        </main>
      )}
    </div>
  );
}

export default PageLayout;
