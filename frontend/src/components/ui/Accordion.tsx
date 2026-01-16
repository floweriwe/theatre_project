/**
 * Компонент аккордеона — Modern Theatre Elegance v3
 *
 * Элегантный аккордеон с тёмным фоном и золотыми акцентами.
 * Поддерживает независимое раскрытие нескольких секций.
 */

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type HTMLAttributes,
  type ButtonHTMLAttributes,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/helpers';

// =============================================================================
// Context
// =============================================================================

interface AccordionContextValue {
  openItems: Set<string>;
  toggleItem: (value: string) => void;
  variant: 'default' | 'ghost';
}

const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);

const useAccordionContext = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion provider');
  }
  return context;
};

interface AccordionItemContextValue {
  value: string;
}

const AccordionItemContext = createContext<AccordionItemContextValue | undefined>(undefined);

const useAccordionItemContext = () => {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionHeader/AccordionContent must be used within AccordionItem');
  }
  return context;
};

// =============================================================================
// Accordion Root
// =============================================================================

interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  /** Изначально открытые секции */
  defaultValue?: string[];
  /** Вариант стилизации */
  variant?: 'default' | 'ghost';
  /** Дочерние элементы */
  children: ReactNode;
}

/**
 * Корневой компонент аккордеона.
 * Поддерживает независимое раскрытие нескольких секций.
 *
 * @example
 * <Accordion defaultValue={['section1']}>
 *   <AccordionItem value="section1">
 *     <AccordionHeader>Секция 1</AccordionHeader>
 *     <AccordionContent>Содержимое секции 1</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 */
export function Accordion({
  defaultValue = [],
  variant = 'default',
  className,
  children,
  ...props
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultValue));

  const toggleItem = (value: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, variant }}>
      <div className={cn('space-y-2', className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

// =============================================================================
// Accordion Item
// =============================================================================

interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  /** Уникальный идентификатор секции */
  value: string;
  /** Дочерние элементы */
  children: ReactNode;
}

/**
 * Элемент аккордеона (одна секция).
 */
export function AccordionItem({ value, className, children, ...props }: AccordionItemProps) {
  const { variant } = useAccordionContext();

  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div
        className={cn(
          'rounded-xl overflow-hidden',
          variant === 'default' && 'bg-[#1A2332] border border-[#D4A574]/10',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

// =============================================================================
// Accordion Header
// =============================================================================

interface AccordionHeaderProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Иконка (отображается слева от текста) */
  icon?: ReactNode;
  /** Дочерние элементы */
  children: ReactNode;
}

/**
 * Заголовок секции аккордеона.
 * При клике переключает раскрытие/сворачивание содержимого.
 */
export function AccordionHeader({ icon, className, children, ...props }: AccordionHeaderProps) {
  const { openItems, toggleItem, variant } = useAccordionContext();
  const { value } = useAccordionItemContext();
  const isOpen = openItems.has(value);

  return (
    <button
      type="button"
      onClick={() => toggleItem(value)}
      className={cn(
        'w-full flex items-center justify-between gap-3 px-6 py-4',
        'text-left transition-colors',
        variant === 'default' && 'hover:bg-[#243044]/50',
        className
      )}
      aria-expanded={isOpen}
      {...props}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && <span className="flex-shrink-0 text-[#D4A574]">{icon}</span>}
        <span className="font-['Inter'] font-medium text-text-primary truncate">{children}</span>
      </div>
      <ChevronDown
        className={cn(
          'w-5 h-5 flex-shrink-0 text-[#D4A574] transition-transform duration-200',
          isOpen && 'rotate-180'
        )}
      />
    </button>
  );
}

// =============================================================================
// Accordion Content
// =============================================================================

interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Дочерние элементы */
  children: ReactNode;
}

/**
 * Содержимое секции аккордеона.
 * Отображается только когда секция раскрыта.
 */
export function AccordionContent({ className, children, ...props }: AccordionContentProps) {
  const { openItems } = useAccordionContext();
  const { value } = useAccordionItemContext();
  const isOpen = openItems.has(value);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn('px-6 pb-6 pt-2 animate-fade-in', className)}
      role="region"
      aria-labelledby={`accordion-header-${value}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Accordion;
