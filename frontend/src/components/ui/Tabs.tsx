import React, { createContext, useContext, useState, ReactNode } from 'react';
import { cn } from '../../utils/cn';

// Context для управления состоянием табов
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

// Главный контейнер Tabs
interface TabsProps {
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onChange,
  children,
  className,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  const activeTab = value ?? internalValue;
  const setActiveTab = (newValue: string) => {
    if (!value) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// Список табов (заголовки)
interface TabsListProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export const TabsList: React.FC<TabsListProps> = ({
  children,
  className,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'bg-sidebar-bg/50 p-1 rounded-xl border border-card-border',
    pills: 'flex gap-2',
    underline: 'border-b border-card-border',
  };

  return (
    <div 
      role="tablist"
      className={cn(
        'flex',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </div>
  );
};

// Отдельный таб (заголовок)
interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className,
  disabled = false,
  icon,
}) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50',
        isActive
          ? 'bg-gold/10 text-gold shadow-sm'
          : 'text-text-secondary hover:text-text-primary hover:bg-sidebar-hover/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

// Контент таба
interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
  forceMount?: boolean;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className,
  forceMount = false,
}) => {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  if (!forceMount && !isActive) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      hidden={!isActive}
      className={cn(
        'mt-4 focus:outline-none',
        isActive && 'animate-fade-in',
        className
      )}
    >
      {children}
    </div>
  );
};

// Вертикальные табы
interface VerticalTabsProps {
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export const VerticalTabs: React.FC<VerticalTabsProps> = ({
  defaultValue,
  value,
  onChange,
  children,
  className,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  const activeTab = value ?? internalValue;
  const setActiveTab = (newValue: string) => {
    if (!value) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('flex gap-6', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface VerticalTabsListProps {
  children: ReactNode;
  className?: string;
}

export const VerticalTabsList: React.FC<VerticalTabsListProps> = ({
  children,
  className,
}) => {
  return (
    <div 
      role="tablist"
      aria-orientation="vertical"
      className={cn(
        'flex flex-col gap-1 w-56 shrink-0',
        className
      )}
    >
      {children}
    </div>
  );
};

interface VerticalTabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
  badge?: ReactNode;
}

export const VerticalTabsTrigger: React.FC<VerticalTabsTriggerProps> = ({
  value,
  children,
  className,
  disabled = false,
  icon,
  badge,
}) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      className={cn(
        'flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl transition-all text-left',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50',
        isActive
          ? 'bg-gold/10 text-gold border-l-2 border-gold'
          : 'text-text-secondary hover:text-text-primary hover:bg-sidebar-hover/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
      {badge}
    </button>
  );
};

interface VerticalTabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export const VerticalTabsContent: React.FC<VerticalTabsContentProps> = ({
  value,
  children,
  className,
}) => {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={cn(
        'flex-1 animate-fade-in',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Tabs;
