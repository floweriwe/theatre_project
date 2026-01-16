/**
 * PageHero — Modern Theatre Elegance v3
 *
 * Reusable hero section for module landing pages.
 * Features gradient mesh background with gold blur effect.
 */

import { type ReactNode } from 'react';
import { cn } from '@/utils/helpers';

interface PageHeroProps {
  /** Page title - displays in Cormorant Garamond */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Small label above the title (e.g., module name) */
  label?: string;
  /** Icon to display next to the label */
  labelIcon?: ReactNode;
  /** Breadcrumb items */
  breadcrumbs?: string[];
  /** Action button(s) to display in the hero */
  action?: ReactNode;
  /** Blur accent color (default: gold) */
  accentColor?: 'gold' | 'blue' | 'purple' | 'emerald' | 'amber';
  /** Additional className */
  className?: string;
  /** Children content (renders below title/subtitle) */
  children?: ReactNode;
}

/** Accent color configurations for gradient blur */
const accentColors = {
  gold: {
    primary: 'bg-gold-300/10',
    secondary: 'bg-gold-300/5',
  },
  blue: {
    primary: 'bg-blue-500/10',
    secondary: 'bg-blue-500/5',
  },
  purple: {
    primary: 'bg-purple-500/10',
    secondary: 'bg-purple-500/5',
  },
  emerald: {
    primary: 'bg-emerald-500/10',
    secondary: 'bg-emerald-500/5',
  },
  amber: {
    primary: 'bg-amber-500/10',
    secondary: 'bg-amber-500/5',
  },
};

/**
 * PageHero component for consistent module landing page headers.
 *
 * @example
 * // Basic usage
 * <PageHero title="Инвентарь" subtitle="Управление реквизитом и оборудованием" />
 *
 * @example
 * // With label, icon and action
 * <PageHero
 *   label="Модуль"
 *   labelIcon={<Package className="w-5 h-5" />}
 *   title="Инвентарь"
 *   subtitle="Управление реквизитом"
 *   accentColor="blue"
 *   action={<Button>Добавить</Button>}
 * />
 *
 * @example
 * // With breadcrumbs
 * <PageHero
 *   title="Детали спектакля"
 *   breadcrumbs={['Главная', 'Спектакли', 'Евгений Онегин']}
 * />
 */
export function PageHero({
  title,
  subtitle,
  label,
  labelIcon,
  breadcrumbs,
  action,
  accentColor = 'gold',
  className,
  children,
}: PageHeroProps) {
  const colors = accentColors[accentColor];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-bg-elevated via-bg-elevated to-bg-surface',
        'p-6 lg:p-8',
        className
      )}
    >
      {/* Background decoration - gradient mesh */}
      <div
        className={cn(
          'absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl',
          '-translate-y-1/2 translate-x-1/3',
          colors.primary
        )}
      />
      <div
        className={cn(
          'absolute bottom-0 left-0 w-64 h-64 rounded-full blur-2xl',
          'translate-y-1/2 -translate-x-1/3',
          colors.secondary
        )}
      />

      {/* Content layer */}
      <div className="relative z-10">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-3" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-text-muted">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <span className="text-text-muted/50">/</span>
                  )}
                  <span
                    className={cn(
                      index === breadcrumbs.length - 1
                        ? 'text-text-primary'
                        : 'hover:text-text-secondary transition-colors'
                    )}
                  >
                    {crumb}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Main content row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            {/* Label with icon */}
            {label && (
              <div className="flex items-center gap-2 mb-2">
                {labelIcon && (
                  <span className="text-gold-300">{labelIcon}</span>
                )}
                <span className="text-sm text-gold-300 font-medium">
                  {label}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-text-primary mb-1">
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-text-secondary text-base lg:text-lg">
                {subtitle}
              </p>
            )}
          </div>

          {/* Action buttons */}
          {action && (
            <div className="flex flex-wrap gap-3">
              {action}
            </div>
          )}
        </div>

        {/* Additional children content */}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHero;
