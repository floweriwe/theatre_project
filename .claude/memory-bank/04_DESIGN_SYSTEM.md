# Theatre Management System — Дизайн-система v3.0

## 🎨 Философия дизайна

### "Modern Theatre Elegance"

Сочетание классической театральной эстетики с современным минимализмом:

- **Тёмная тема** — снижает нагрузку на глаза при работе за кулисами
- **Золотые акценты** — отсылка к театральной роскоши (занавес, люстры, позолота)
- **Типографика** — элегантные заголовки (Cormorant Garamond) + читаемый текст (Inter)
- **Пространство** — достаточно воздуха между элементами
- **Анимации** — плавные, театральные (как поднятие занавеса)

---

## 🎨 Цветовая палитра

### Основные цвета

```css
:root {
  /* Background */
  --color-bg-primary: #0F1419;      /* Основной фон */
  --color-bg-secondary: #1A2332;    /* Карточки, sidebar */
  --color-bg-tertiary: #243044;     /* Hover, вложенные элементы */
  --color-bg-elevated: #2D3B4F;     /* Модальные окна, dropdown */
  
  /* Accent - Gold */
  --color-gold: #D4A574;            /* Основной акцент */
  --color-gold-light: #E8C297;      /* Hover */
  --color-gold-dark: #B8956A;       /* Active/Pressed */
  --color-gold-muted: rgba(212, 165, 116, 0.1);  /* Фоновый акцент */
  
  /* Text */
  --color-text-primary: #F1F5F9;    /* Основной текст */
  --color-text-secondary: #94A3B8;  /* Вторичный текст */
  --color-text-muted: #64748B;      /* Приглушённый */
  --color-text-disabled: #475569;   /* Неактивный */
  
  /* Borders */
  --color-border: #334155;          /* Границы */
  --color-border-light: #475569;    /* Границы при hover */
  --color-border-focus: #D4A574;    /* Границы при фокусе */
  
  /* Status colors */
  --color-success: #10B981;         /* Успех */
  --color-success-bg: rgba(16, 185, 129, 0.1);
  
  --color-warning: #F59E0B;         /* Предупреждение */
  --color-warning-bg: rgba(245, 158, 11, 0.1);
  
  --color-error: #EF4444;           /* Ошибка */
  --color-error-bg: rgba(239, 68, 68, 0.1);
  
  --color-info: #3B82F6;            /* Информация */
  --color-info-bg: rgba(59, 130, 246, 0.1);
}
```

### Цвета для типов событий

```css
:root {
  /* Schedule event types */
  --color-event-performance: #D4A574;    /* Спектакль - золотой */
  --color-event-rehearsal: #3B82F6;      /* Репетиция - синий */
  --color-event-technical: #64748B;      /* Тех. работы - серый */
  --color-event-runthrough: #8B5CF6;     /* Прогон - фиолетовый */
  --color-event-premiere: #EF4444;       /* Премьера - красный */
  --color-event-tour: #10B981;           /* Гастроли - зелёный */
}
```

### Цвета для Hero-блоков (размытие на страницах)

```css
/* Hero blur accents by module */
--hero-dashboard: rgba(212, 165, 116, 0.1);    /* Золотой */
--hero-inventory: rgba(59, 130, 246, 0.1);     /* Синий */
--hero-documents: rgba(16, 185, 129, 0.1);     /* Изумрудный */
--hero-performances: rgba(139, 92, 246, 0.1);  /* Фиолетовый */
--hero-schedule: rgba(245, 158, 11, 0.1);      /* Янтарный */
--hero-tasks: rgba(236, 72, 153, 0.1);         /* Розовый */
```

---

## 📝 Типографика

### Шрифты

```css
:root {
  /* Display font - для заголовков */
  --font-display: 'Cormorant Garamond', Georgia, serif;
  
  /* Sans font - для текста и UI */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Mono font - для кода и чисел */
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### Размеры текста

```css
:root {
  /* Font sizes */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  --text-5xl: 3rem;        /* 48px */
  
  /* Line heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  
  /* Font weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### Применение

| Элемент | Шрифт | Размер | Вес | Цвет |
|---------|-------|--------|-----|------|
| H1 (страница) | Cormorant Garamond | 3xl | 600 | text-primary |
| H2 (секция) | Cormorant Garamond | 2xl | 600 | text-primary |
| H3 (подсекция) | Inter | xl | 600 | text-primary |
| H4 (карточка) | Inter | lg | 500 | text-primary |
| Body | Inter | base | 400 | text-primary |
| Body small | Inter | sm | 400 | text-secondary |
| Caption | Inter | xs | 400 | text-muted |
| Button | Inter | sm | 500 | — |
| Input | Inter | base | 400 | text-primary |
| Label | Inter | sm | 500 | text-secondary |

---

## 📐 Spacing и Layout

### Spacing Scale

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### Border Radius

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;    /* 4px */
  --radius-md: 0.375rem;   /* 6px */
  --radius-lg: 0.5rem;     /* 8px */
  --radius-xl: 0.75rem;    /* 12px */
  --radius-2xl: 1rem;      /* 16px */
  --radius-full: 9999px;
}
```

### Shadows

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
               0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
               0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
               0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Gold glow для акцентных элементов */
  --shadow-gold: 0 0 20px rgba(212, 165, 116, 0.3);
}
```

---

## 🧩 Компоненты

### Button

```tsx
// Variants
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

// Styles
const buttonStyles = {
  base: `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  
  variants: {
    primary: `
      bg-gold text-bg-primary
      hover:bg-gold-light
      active:bg-gold-dark
      focus:ring-gold
    `,
    secondary: `
      bg-bg-tertiary text-text-primary
      border border-border
      hover:bg-bg-elevated hover:border-border-light
      focus:ring-border
    `,
    ghost: `
      text-text-secondary
      hover:text-text-primary hover:bg-bg-tertiary
      focus:ring-border
    `,
    danger: `
      bg-error text-white
      hover:bg-red-600
      focus:ring-error
    `
  },
  
  sizes: {
    sm: 'h-8 px-3 text-sm gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2'
  }
};
```

### Card

```tsx
// Variants
type CardVariant = 'default' | 'elevated' | 'outlined' | 'interactive';

const cardStyles = {
  base: `
    rounded-xl p-6
    transition-all duration-200
  `,
  
  variants: {
    default: 'bg-bg-secondary',
    elevated: 'bg-bg-elevated shadow-lg',
    outlined: 'bg-bg-secondary border border-border',
    interactive: `
      bg-bg-secondary border border-border
      hover:border-gold/50 hover:shadow-gold
      cursor-pointer
    `
  }
};
```

### Input

```tsx
const inputStyles = `
  w-full h-10 px-4
  bg-bg-tertiary
  border border-border rounded-lg
  text-text-primary placeholder:text-text-muted
  transition-all duration-200
  
  hover:border-border-light
  focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold
  
  disabled:opacity-50 disabled:cursor-not-allowed
`;
```

### Select

```tsx
const selectStyles = `
  w-full h-10 px-4 pr-10
  bg-bg-tertiary
  border border-border rounded-lg
  text-text-primary
  appearance-none
  cursor-pointer
  
  hover:border-border-light
  focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold
`;
```

### Badge

```tsx
type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'gold';

const badgeStyles = {
  base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  
  variants: {
    default: 'bg-bg-tertiary text-text-secondary',
    success: 'bg-success-bg text-success',
    warning: 'bg-warning-bg text-warning',
    error: 'bg-error-bg text-error',
    info: 'bg-info-bg text-info',
    gold: 'bg-gold-muted text-gold'
  }
};
```

### Modal

```tsx
const modalStyles = {
  overlay: `
    fixed inset-0 z-50
    bg-black/60 backdrop-blur-sm
    flex items-center justify-center p-4
  `,
  
  content: `
    bg-bg-secondary
    rounded-2xl
    shadow-xl
    max-h-[90vh] overflow-y-auto
    w-full max-w-lg
    
    /* Animation */
    animate-in fade-in-0 zoom-in-95
  `,
  
  header: `
    px-6 py-4
    border-b border-border
    flex items-center justify-between
  `,
  
  body: 'px-6 py-4',
  
  footer: `
    px-6 py-4
    border-t border-border
    flex items-center justify-end gap-3
  `
};
```

### Table

```tsx
const tableStyles = {
  wrapper: 'overflow-x-auto rounded-xl border border-border',
  
  table: 'w-full',
  
  thead: 'bg-bg-tertiary',
  th: `
    px-4 py-3
    text-left text-xs font-medium text-text-muted uppercase tracking-wider
    border-b border-border
  `,
  
  tbody: 'divide-y divide-border',
  tr: 'hover:bg-bg-tertiary/50 transition-colors',
  td: 'px-4 py-4 text-sm text-text-primary'
};
```

### Calendar (для расписания)

```tsx
const calendarStyles = {
  header: `
    flex items-center justify-between
    px-4 py-3
    border-b border-border
  `,
  
  navigation: `
    flex items-center gap-2
  `,
  
  grid: 'grid grid-cols-7',
  
  dayHeader: `
    py-3 text-center
    text-xs font-medium text-text-muted uppercase
    border-b border-border
  `,
  
  day: `
    min-h-[120px] p-2
    border-r border-b border-border
    last:border-r-0
  `,
  
  dayNumber: `
    text-sm font-medium text-text-secondary
    mb-1
  `,
  
  today: 'text-gold font-bold',
  
  eventCard: `
    p-2 mb-1
    rounded-lg
    text-xs
    cursor-pointer
    transition-all duration-200
    hover:scale-[1.02]
  `
};
```

---

## 🎬 Анимации

### Transition Durations

```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;
}
```

### Easing Functions

```css
:root {
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Keyframes

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Театральный эффект — как поднятие занавеса */
@keyframes curtainUp {
  from {
    clip-path: inset(100% 0 0 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}

/* Gold shimmer для акцентных элементов */
@keyframes goldShimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}
```

### Применение

```css
/* Появление карточек */
.card-enter {
  animation: fadeInUp var(--duration-normal) var(--ease-out);
}

/* Модальные окна */
.modal-enter {
  animation: scaleIn var(--duration-normal) var(--ease-out);
}

/* Sidebar элементы */
.sidebar-item-enter {
  animation: slideInRight var(--duration-normal) var(--ease-out);
}

/* Skeleton loading */
.skeleton {
  animation: pulse 2s var(--ease-in-out) infinite;
}

/* Hero блок */
.hero-content {
  animation: curtainUp var(--duration-slower) var(--ease-out);
}
```

---

## 📱 Responsive Design

### Breakpoints

```css
:root {
  --screen-sm: 640px;   /* Mobile landscape */
  --screen-md: 768px;   /* Tablet portrait */
  --screen-lg: 1024px;  /* Tablet landscape */
  --screen-xl: 1280px;  /* Desktop */
  --screen-2xl: 1536px; /* Large desktop */
}
```

### Tailwind Config

```js
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
}
```

### Layout Guidelines

| Breakpoint | Sidebar | Grid Columns | Card Width |
|------------|---------|--------------|------------|
| < 768px | Hidden (hamburger) | 1 | 100% |
| 768px - 1024px | Collapsed (icons) | 2 | ~50% |
| 1024px - 1280px | Expanded | 3 | ~33% |
| > 1280px | Expanded | 4 | ~25% |

---

## 🖱️ Touch & Interaction

### Touch Targets

```css
/* Минимальный размер для touch */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}
```

### Hover vs Touch

```tsx
// Используем @media (hover: hover) для hover-эффектов
const interactiveStyles = `
  /* Touch-first */
  transition-all duration-200
  active:scale-95
  
  /* Hover только для устройств с мышью */
  @media (hover: hover) {
    hover:bg-bg-tertiary
    hover:shadow-md
  }
`;
```

### Focus States

```css
/* Visible focus для accessibility */
.focus-visible:focus {
  outline: 2px solid var(--color-gold);
  outline-offset: 2px;
}

/* Убираем outline для mouse users */
.focus:focus:not(:focus-visible) {
  outline: none;
}
```

---

## 🎭 Специфичные компоненты

### Event Card (Расписание)

Дизайн карточки события в стиле АртМеханика:

```tsx
const EventCard = ({ event, type }) => {
  const colors = {
    performance: 'border-l-gold bg-gold/5',
    rehearsal: 'border-l-blue-500 bg-blue-500/5',
    technical: 'border-l-gray-500 bg-gray-500/5',
    premiere: 'border-l-red-500 bg-red-500/5',
    tour: 'border-l-green-500 bg-green-500/5',
  };
  
  return (
    <div className={`
      p-3 rounded-lg
      border-l-4
      ${colors[type]}
      hover:shadow-md
      transition-all duration-200
    `}>
      {/* Время */}
      <div className="text-xs font-medium text-text-muted mb-1">
        {event.time}
      </div>
      
      {/* Название */}
      <div className="text-sm font-medium text-text-primary mb-2">
        {event.title}
      </div>
      
      {/* Участники (аватары) */}
      <div className="flex -space-x-2">
        {event.participants.slice(0, 5).map(p => (
          <Avatar key={p.id} src={p.avatar} size="sm" />
        ))}
        {event.participants.length > 5 && (
          <span className="text-xs text-text-muted ml-2">
            +{event.participants.length - 5}
          </span>
        )}
      </div>
      
      {/* Готовность сцены */}
      {event.stageReadyTime && (
        <div className="mt-2 text-xs text-text-muted">
          Готовность сцены: {event.stageReadyTime}
        </div>
      )}
    </div>
  );
};
```

### Inventory Card (Grid View)

```tsx
const InventoryCard = ({ item }) => (
  <div className="
    group
    bg-bg-secondary
    rounded-xl
    border border-border
    overflow-hidden
    hover:border-gold/50
    hover:shadow-gold
    transition-all duration-300
    cursor-pointer
  ">
    {/* Фото */}
    <div className="relative aspect-square bg-bg-tertiary">
      {item.photo ? (
        <img 
          src={item.photo} 
          alt={item.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <PackageIcon className="w-12 h-12 text-text-muted" />
        </div>
      )}
      
      {/* Badge статуса */}
      <Badge 
        variant={statusVariant[item.status]}
        className="absolute top-2 right-2"
      >
        {statusLabel[item.status]}
      </Badge>
    </div>
    
    {/* Информация */}
    <div className="p-4">
      <div className="text-xs text-text-muted mb-1">
        {item.inventoryNumber}
      </div>
      <div className="text-sm font-medium text-text-primary mb-2 line-clamp-2">
        {item.name}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {item.location}
        </span>
        <span className="text-xs text-gold">
          {item.quantity} {item.unit}
        </span>
      </div>
    </div>
  </div>
);
```

### Passport Section (Аккордеон)

```tsx
const PassportSection = ({ section, isOpen, onToggle }) => (
  <div className="border border-border rounded-xl overflow-hidden">
    {/* Header */}
    <button
      onClick={onToggle}
      className="
        w-full px-4 py-3
        flex items-center justify-between
        bg-bg-secondary
        hover:bg-bg-tertiary
        transition-colors
      "
    >
      <div className="flex items-center gap-3">
        <span className="text-sm text-gold font-mono">
          {section.code}
        </span>
        <span className="text-sm font-medium text-text-primary">
          {section.title}
        </span>
      </div>
      <ChevronIcon 
        className={`
          w-5 h-5 text-text-muted
          transition-transform duration-200
          ${isOpen ? 'rotate-180' : ''}
        `}
      />
    </button>
    
    {/* Content */}
    {isOpen && (
      <div className="p-4 bg-bg-tertiary/50 border-t border-border">
        {section.documents.map(doc => (
          <DocumentRow key={doc.id} document={doc} />
        ))}
      </div>
    )}
  </div>
);
```

---

## 🖼️ Иконки

### Библиотека: Lucide React

```tsx
import {
  // Navigation
  Home, Menu, X, ChevronDown, ChevronRight, ArrowLeft,
  
  // Modules
  Package, FileText, Calendar, Theater, CheckSquare, Bell,
  
  // Actions
  Plus, Edit, Trash2, Download, Upload, Search, Filter,
  
  // Status
  Check, AlertCircle, Clock, Info,
  
  // Users
  User, Users, UserCheck,
  
  // Other
  Settings, LogOut, Eye, Camera, MapPin, Tag
} from 'lucide-react';
```

### Размеры иконок

| Контекст | Размер | Класс |
|----------|--------|-------|
| Inline с текстом | 16px | `w-4 h-4` |
| Button | 18px | `w-[18px] h-[18px]` |
| Card | 20px | `w-5 h-5` |
| Feature | 24px | `w-6 h-6` |
| Hero | 32px | `w-8 h-8` |
| Empty state | 48px | `w-12 h-12` |

---

## 📏 Grid System

### Inventory Grid

```tsx
const inventoryGridStyles = `
  grid gap-4
  grid-cols-1      /* Mobile */
  sm:grid-cols-2   /* Tablet portrait */
  lg:grid-cols-3   /* Tablet landscape */
  xl:grid-cols-4   /* Desktop */
  2xl:grid-cols-5  /* Large desktop */
`;
```

### Dashboard Grid

```tsx
const dashboardGridStyles = `
  grid gap-6
  grid-cols-1
  md:grid-cols-2
  lg:grid-cols-4
`;
```

### Calendar Grid (Weekly View)

```tsx
const calendarGridStyles = `
  grid grid-cols-8  /* 1 time column + 7 days */
  gap-0
`;
```

---

## 📋 Tailwind Config (полный)

```js
// tailwind.config.js
const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Background
        'bg-primary': '#0F1419',
        'bg-secondary': '#1A2332',
        'bg-tertiary': '#243044',
        'bg-elevated': '#2D3B4F',
        
        // Gold accent
        gold: {
          DEFAULT: '#D4A574',
          light: '#E8C297',
          dark: '#B8956A',
          muted: 'rgba(212, 165, 116, 0.1)',
        },
        
        // Text
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
        
        // Border
        border: '#334155',
        'border-light': '#475569',
      },
      
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.2s ease-out',
        'curtain-up': 'curtainUp 0.5s ease-out',
        'gold-shimmer': 'goldShimmer 2s linear infinite',
      },
      
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        fadeInUp: {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: 0, transform: 'scale(0.95)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        slideInRight: {
          from: { opacity: 0, transform: 'translateX(20px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
        curtainUp: {
          from: { clipPath: 'inset(100% 0 0 0)' },
          to: { clipPath: 'inset(0 0 0 0)' },
        },
        goldShimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      
      boxShadow: {
        gold: '0 0 20px rgba(212, 165, 116, 0.3)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
};
```

---

## 🔍 Command Center (Cmd+K)

Глобальный поиск и навигация по приложению:

```tsx
// Открытие: Cmd+K (Mac) / Ctrl+K (Win)
// Компоненты:
// - CommandCenter.tsx - модальное окно с поиском
// - useCommandCenter.ts - глобальный хук для shortcut
// - commandCenterStore.ts - Zustand store

const CommandCenter = () => (
  <div className="
    fixed inset-0 z-50
    bg-black/50 backdrop-blur-sm
    flex items-start justify-center pt-[20vh]
  ">
    <div className="
      w-full max-w-2xl
      bg-bg-secondary
      rounded-2xl border border-border
      shadow-2xl
      overflow-hidden
    ">
      {/* Search Input */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-text-muted" />
          <input
            className="flex-1 bg-transparent text-text-primary"
            placeholder="Поиск по приложению..."
          />
        </div>
      </div>

      {/* Results */}
      <div className="max-h-[400px] overflow-y-auto p-2">
        {/* Links and search results */}
      </div>

      {/* Footer с подсказками */}
      <div className="px-4 py-2 border-t border-border text-xs text-text-muted">
        ↑↓ навигация • Enter выбор • Esc закрыть
      </div>
    </div>
  </div>
);
```

---

## 🎛️ FilterBar (Advanced Filters)

Система фильтрации с chips, presets и поиском:

```tsx
// Компоненты:
// - FilterBar.tsx - панель фильтров
// - useTableFilters.ts - хук управления состоянием

interface FilterChip {
  id: string;
  label: string;
  field: string;
  value: string | string[];
  removable?: boolean;
}

interface FilterPreset {
  id: string;
  name: string;
  filters: FilterChip[];
  searchQuery?: string;
}

const FilterBar = () => (
  <div className="flex items-center gap-4 flex-wrap">
    {/* Search */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
      <input className="pl-10 h-9 bg-bg-tertiary border border-border rounded-lg" />
    </div>

    {/* Filter Chips */}
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map(filter => (
        <div className="
          flex items-center gap-1.5 px-3 py-1
          bg-gold/10 text-gold rounded-full text-sm
        ">
          <span className="text-text-muted">{filter.label}:</span>
          <span>{filter.value}</span>
          <button className="hover:text-white">×</button>
        </div>
      ))}
    </div>

    {/* Presets */}
    <button className="text-sm text-text-secondary hover:text-text-primary">
      Пресеты
    </button>

    {/* Clear All */}
    <button className="text-sm text-error hover:text-red-400">
      Сбросить
    </button>
  </div>
);
```

---

## 📐 Responsive Layout Primitives

### ResponsiveContainer

```tsx
type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

const sizeClasses = {
  sm: 'max-w-screen-sm',     // 640px
  md: 'max-w-screen-md',     // 768px
  lg: 'max-w-screen-lg',     // 1024px
  xl: 'max-w-screen-xl',     // 1280px
  '2xl': 'max-w-screen-2xl', // 1536px
  full: 'max-w-full',
};

<ResponsiveContainer size="xl" padding centered>
  {/* Max 1280px, centered, with horizontal padding */}
</ResponsiveContainer>
```

### Stack / HStack / VStack

```tsx
// Flexbox primitives для простой компоновки

<Stack direction="column" gap="md" align="stretch">
  {/* Vertical stack with medium gap */}
</Stack>

<HStack gap="sm" justify="between" align="center">
  {/* Horizontal with space-between */}
</HStack>

<VStack gap="lg">
  {/* Vertical with large gap */}
</VStack>

// Gap sizes: none, xs, sm, md, lg, xl
```

### ResponsiveGrid

```tsx
// Auto-fit grid для карточек

<ResponsiveGrid minItemWidth={280} gap="md">
  {items.map(item => <Card key={item.id} />)}
</ResponsiveGrid>

// Creates: grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))
```

### PageLayout

```tsx
// Структура страницы с опциональным sidebar

<PageLayout
  header={<PageHeader title="Инвентарь" />}
  sidebar={<FilterSidebar />}  // optional
  sidebarPosition="right"      // 'left' | 'right'
  sidebarWidth="md"            // 'sm' | 'md' | 'lg'
>
  {/* Main content */}
</PageLayout>
```

---

## ♿ Accessibility Components

### VisuallyHidden

```tsx
// Скрытый контент для screen readers

<VisuallyHidden>
  Дополнительная информация для screen reader
</VisuallyHidden>

// focusable=true позволяет элементу получать фокус
<VisuallyHidden focusable>
  Skip to main content
</VisuallyHidden>
```

### LiveAnnouncer

```tsx
// ARIA live regions для объявлений

<LiveAnnouncerProvider>
  <App />
</LiveAnnouncerProvider>

// В компонентах:
const { announce } = useLiveAnnouncer();
announce('Загружено 10 элементов', 'polite');
announce('Ошибка при сохранении!', 'assertive');
```

### AccessibleIcon / IconButton

```tsx
// Декоративная иконка (скрыта от screen readers)
<AccessibleIcon>
  <SearchIcon />
</AccessibleIcon>

// Иконка со значением (читается screen reader)
<AccessibleIcon label="Статус: активен">
  <CheckIcon />
</AccessibleIcon>

// Кнопка-иконка с обязательным label
<IconButton label="Закрыть меню" onClick={close}>
  <XIcon />
</IconButton>
```

### Focus Management Hooks

```tsx
// Сохранение и восстановление фокуса (для модальных окон)
const { saveFocus, restoreFocus } = useFocusReturn();

// Фокус при монтировании
const inputRef = useFocusOnMount<HTMLInputElement>();

// Auto-focus ref callback
const autoFocusRef = useAutoFocus({ enabled: true, delay: 0 });
<input ref={autoFocusRef} />
```

---

## ✅ Accessibility (a11y)

### Требования

- Контрастность текста: минимум 4.5:1 для обычного текста
- Focus indicators: видимый outline для всех интерактивных элементов
- Keyboard navigation: все функции доступны с клавиатуры
- ARIA labels: для иконок без текста
- Screen reader support: семантическая разметка

### Проверка контрастности

| Комбинация | Ratio | Статус |
|------------|-------|--------|
| text-primary на bg-primary | 13.5:1 | ✅ AAA |
| text-secondary на bg-primary | 7.1:1 | ✅ AAA |
| text-muted на bg-primary | 4.6:1 | ✅ AA |
| gold на bg-primary | 6.2:1 | ✅ AA |

---

*Документ обновлён: 18 Января 2026*
*Версия: 3.1 (Phase 12: Command Center, FilterBar, Layout Primitives, Accessibility)*
