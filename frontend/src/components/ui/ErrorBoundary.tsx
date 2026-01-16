/**
 * ErrorBoundary Component — Modern Theatre Elegance v3
 *
 * Catches JavaScript errors in child components and displays fallback UI.
 * Prevents the entire app from crashing due to component errors.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Error callback for logging/reporting */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show reset button */
  showReset?: boolean;
  /** Title for error display */
  title?: string;
  /** Description for error display */
  description?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React errors.
 *
 * @example
 * // Basic usage
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example
 * // With custom fallback
 * <ErrorBoundary fallback={<CustomError />}>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example
 * // With error reporting
 * <ErrorBoundary onError={(error) => reportError(error)}>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  override render() {
    if (this.state.hasError) {
      // Return custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-display font-semibold text-text-primary mb-2">
              {this.props.title || 'Что-то пошло не так'}
            </h2>

            {/* Description */}
            <p className="text-text-secondary mb-6">
              {this.props.description ||
                'Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернуться на главную.'}
            </p>

            {/* Error details (development only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 rounded-xl bg-bg-surface border border-error/20 text-left">
                <p className="text-sm text-error font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              {this.props.showReset !== false && (
                <Button variant="outline" onClick={this.handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Попробовать снова
                </Button>
              )}
              <Button onClick={this.handleGoHome}>
                <Home className="w-4 h-4 mr-2" />
                На главную
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap a component with ErrorBoundary.
 *
 * @example
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   title: 'Ошибка модуля',
 *   onError: (error) => reportError(error),
 * });
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

/**
 * Page-level Error Boundary with full-page styling.
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      title="Ошибка страницы"
      description="Не удалось загрузить содержимое страницы. Попробуйте обновить или вернитесь на главную."
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Module-level Error Boundary for specific sections.
 */
export function ModuleErrorBoundary({
  children,
  moduleName,
}: {
  children: ReactNode;
  moduleName: string;
}) {
  return (
    <ErrorBoundary
      title={`Ошибка модуля "${moduleName}"`}
      description="Этот раздел временно недоступен. Попробуйте обновить страницу."
      showReset
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
