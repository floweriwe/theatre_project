/**
 * FormField Component — Modern Theatre Elegance v3
 *
 * Wrapper component for form fields with React Hook Form integration.
 * Provides consistent styling and error handling.
 */

import { type ReactNode } from 'react';
import {
  useFormContext,
  Controller,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { cn } from '@/utils/helpers';
import { Input } from './Input';
import { Select, type SelectOption } from './Select';

interface FormFieldProps<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'textarea' | 'select';
  placeholder?: string;
  options?: SelectOption[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helpText?: string;
  children?: ReactNode;
}

/**
 * Form field wrapper with label, input, and error display.
 *
 * @example
 * <FormProvider {...methods}>
 *   <form onSubmit={methods.handleSubmit(onSubmit)}>
 *     <FormField name="email" label="Email" type="email" required />
 *     <FormField name="password" label="Пароль" type="password" required />
 *     <FormField
 *       name="status"
 *       label="Статус"
 *       type="select"
 *       options={statusOptions}
 *     />
 *   </form>
 * </FormProvider>
 */
export function FormField<TFieldValues extends FieldValues>({
  name,
  label,
  type = 'text',
  placeholder,
  options,
  required,
  disabled,
  className,
  helpText,
  children,
}: FormFieldProps<TFieldValues>) {
  const {
    control,
    formState: { errors },
  } = useFormContext<TFieldValues>();

  // Get nested error message
  const error = name.split('.').reduce((obj: unknown, key) => {
    if (obj && typeof obj === 'object' && key in obj) {
      return (obj as Record<string, unknown>)[key];
    }
    return undefined;
  }, errors) as { message?: string } | undefined;

  const errorMessage = error?.message;

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Label */}
      <label
        htmlFor={name}
        className="block text-sm font-medium text-text-primary"
      >
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>

      {/* Input/Select */}
      {children ? (
        children
      ) : type === 'select' && options ? (
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Select
              id={name}
              {...field}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              error={errorMessage}
              disabled={disabled}
            >
              <option value="">Выберите...</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          )}
        />
      ) : type === 'textarea' ? (
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <textarea
              id={name}
              {...field}
              value={field.value ?? ''}
              placeholder={placeholder}
              disabled={disabled}
              rows={4}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl',
                'bg-bg-surface border border-border-subtle',
                'text-text-primary placeholder:text-text-placeholder',
                'focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                errorMessage && 'border-error focus:ring-error/50 focus:border-error'
              )}
            />
          )}
        />
      ) : (
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Input
              id={name}
              type={type}
              {...field}
              value={field.value ?? ''}
              onChange={(e) => {
                const value = type === 'number'
                  ? (e.target.value === '' ? null : parseFloat(e.target.value))
                  : e.target.value;
                field.onChange(value);
              }}
              placeholder={placeholder}
              error={errorMessage}
              disabled={disabled}
            />
          )}
        />
      )}

      {/* Help Text */}
      {helpText && !errorMessage && (
        <p className="text-xs text-text-muted">{helpText}</p>
      )}

      {/* Error Message */}
      {errorMessage && (
        <p className="text-xs text-error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export default FormField;
