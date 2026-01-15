/**
 * Компонент выпадающего меню — Modern Theatre Elegance v3
 */

import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function Dropdown({
  trigger,
  children,
  align = 'left',
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[200px] py-1',
            'bg-surface-light border border-white/10 rounded-xl shadow-xl',
            'animate-in fade-in-0 zoom-in-95 duration-100',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  disabled = false,
  destructive = false,
  icon,
  className,
}: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
        'transition-colors',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && !destructive && 'text-text-secondary hover:text-white hover:bg-white/5',
        !disabled && destructive && 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
        className
      )}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-white/5" />;
}

// Alias for compatibility
export const DropdownSeparator = DropdownDivider;

export function DropdownLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 py-1.5 text-xs font-medium text-text-muted uppercase tracking-wider">
      {children}
    </div>
  );
}

// Checkbox item for dropdown
interface DropdownCheckboxItemProps {
  children: ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function DropdownCheckboxItem({
  children,
  checked = false,
  onChange,
  disabled = false,
  className,
}: DropdownCheckboxItemProps) {
  return (
    <button
      onClick={() => !disabled && onChange?.(!checked)}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
        'transition-colors',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'text-text-secondary hover:text-white hover:bg-white/5',
        className
      )}
    >
      <div className={cn(
        'w-4 h-4 rounded border flex items-center justify-center',
        checked ? 'bg-gold border-gold' : 'border-white/20'
      )}>
        {checked && (
          <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      {children}
    </button>
  );
}

// Submenu component
interface DropdownSubmenuProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DropdownSubmenu({
  trigger,
  children,
  className,
}: DropdownSubmenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="w-full flex items-center justify-between px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/5 cursor-pointer">
        {trigger}
        <ChevronDown className="w-4 h-4 -rotate-90" />
      </div>
      {isOpen && (
        <div className="absolute left-full top-0 ml-1 min-w-[180px] py-1 bg-surface-light border border-white/10 rounded-xl shadow-xl">
          {children}
        </div>
      )}
    </div>
  );
}

// Trigger button for dropdown
interface DropdownTriggerButtonProps {
  children: ReactNode;
  className?: string;
}

export function DropdownTriggerButton({
  children,
  className,
}: DropdownTriggerButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-surface-light border border-white/10',
        'text-text-secondary hover:text-white hover:border-white/20',
        'transition-colors',
        className
      )}
    >
      {children}
      <ChevronDown className="w-4 h-4" />
    </button>
  );
}

// Простой выбор с выпадающим списком
interface SimpleDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export function SimpleDropdown({
  value,
  onChange,
  options,
  placeholder = 'Выберите...',
  className,
}: SimpleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-2',
          'bg-surface-light border border-white/10 rounded-lg',
          'text-left transition-colors',
          'hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-gold/50',
          isOpen && 'border-gold ring-2 ring-gold/50'
        )}
      >
        <span className={selectedOption ? 'text-white' : 'text-text-muted'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-text-muted transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 py-1 bg-surface-light border border-white/10 rounded-lg shadow-xl max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-4 py-2 text-sm text-left transition-colors',
                option.value === value
                  ? 'bg-gold/10 text-gold'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
