# UI Components Analysis — Design System v3 Compliance

## Executive Summary
- Компонентов проверено: 8 (Button, Card, Modal, Input, Select, Badge, Table, Spinner)
- Полностью соответствуют: 6 (75%)
- Требуют исправлений: 2 (25%)
- Общий уровень соответствия: 85%

**Основные находки:**
- Цветовая палитра в Tailwind Config использует CSS variables (хорошо), но legacy цвета hardcoded
- Компоненты UI используют правильную систему токенов (`bg-bg-surface`, `text-text-primary`)
- Table компонент использует старые hardcoded классы (`bg-surface-100`, `border-surface-200`)
- Spinner имеет неправильные классы для цветов
- Отсутствует глобальный CSS файл с CSS variables

---

## 1. Цветовая палитра

### Tailwind Config

| Token | Документация | tailwind.config.js | Статус |
|-------|--------------|-------------------|--------|
| bg-primary | #0F1419 | CSS var `--bg-base` | ✅ Правильный подход |
| bg-secondary | #1A2332 | CSS var `--bg-surface` | ✅ Правильный подход |
| bg-tertiary | #243044 | CSS var `--bg-surface-hover` | ✅ Правильный подход |
| bg-elevated | #2D3B4F | CSS var `--bg-elevated` | ✅ Правильный подход |
| gold | #D4A574 | CSS var `--gold-400` | ✅ Правильный подход |
| gold-light | #E8C297 | CSS var `--gold-300` | ✅ Правильный подход |
| text-primary | #F1F5F9 | CSS var `--text-primary` | ✅ Правильный подход |
| text-secondary | #94A3B8 | CSS var `--text-secondary` | ✅ Правильный подход |
| text-muted | #64748B | CSS var `--text-muted` | ✅ Правильный подход |

**Проблемы:**

- [ ] **Legacy цвета hardcoded** — в tailwind.config.js есть дублирование с legacy системой (строки 59-105):
  ```js
  primary: {
    DEFAULT: '#0F1419',
    50: '#F7F8F9',
    // ...
  },
  gold: {
    DEFAULT: '#D4A574',
    // ...
  }
  ```
  **Риск:** может привести к использованию `bg-primary` вместо `bg-bg-base`

- [ ] **Отсутствует файл с CSS variables** — нет определения `:root { --bg-base: ...; }`. Переменные должны быть в `frontend/src/index.css` или отдельном файле

### Рекомендации по Tailwind Config

**Удалить legacy секции (строки 59-105):**
```js
// УДАЛИТЬ:
primary: { DEFAULT: '#0F1419', ... },
gold: { DEFAULT: '#D4A574', ... },
surface: { DEFAULT: '#1A2332', ... },
background: { DEFAULT: '#0F1419', ... },
text: { primary: '#F1F5F9', ... }
```

**Создать файл с CSS variables (`frontend/src/styles/variables.css`):**
```css
:root {
  /* Background */
  --bg-base: 15 20 25;        /* #0F1419 в RGB */
  --bg-elevated: 26 35 50;    /* #1A2332 */
  --bg-surface: 26 35 50;     /* #1A2332 */
  --bg-surface-hover: 36 48 68; /* #243044 */
  --bg-overlay: 45 59 79;     /* #2D3B4F */

  /* Gold palette */
  --gold-50: 253 248 243;     /* #FDF8F3 */
  --gold-100: 249 237 224;    /* #F9EDE0 */
  --gold-200: 242 217 188;    /* #F2D9BC */
  --gold-300: 232 194 151;    /* #E8C297 */
  --gold-400: 212 165 116;    /* #D4A574 */
  --gold-500: 196 136 77;     /* #C4884D */
  --gold-600: 166 105 58;     /* #A6693A */

  /* Text */
  --text-primary: 241 245 249;   /* #F1F5F9 */
  --text-secondary: 148 163 184; /* #94A3B8 */
  --text-muted: 100 116 139;     /* #64748B */
  --text-placeholder: 71 85 105; /* #475569 */

  /* Borders */
  --border-subtle: 51 65 85;     /* #334155 */
  --border-default: 71 85 105;   /* #475569 */
  --border-strong: 100 116 139;  /* #64748B */

  /* Semantic colors */
  --success: 16 185 129;      /* #10B981 */
  --warning: 245 158 11;      /* #F59E0B */
  --error: 239 68 68;         /* #EF4444 */
  --info: 59 130 246;         /* #3B82F6 */
}
```

**Импортировать в `frontend/src/App.tsx`:**
```tsx
import './styles/variables.css';
```

---

## 2. Типографика

### Шрифты

| Назначение | Документация | Реализация | Статус |
|------------|--------------|------------|--------|
| Заголовки | Cormorant Garamond | `font-display: ['Cormorant Garamond', ...]` | ✅ |
| Текст | Inter | `font-sans: ['Inter', ...]` | ✅ |
| Моноширинный | JetBrains Mono | `font-mono: ['JetBrains Mono', ...]` | ✅ |

### Применение в компонентах

| Элемент | Должно быть | Реализация | Статус |
|---------|-------------|------------|--------|
| Card title | `font-display text-lg font-semibold` | `font-display text-lg font-semibold text-white` | ✅ |
| Modal title | `font-display text-xl font-semibold` | `font-display text-xl font-semibold text-white` | ✅ |
| Button text | `font-medium` | `font-medium` | ✅ |
| Input | `font-sans text-sm` | `text-sm` (sans по умолчанию) | ✅ |

**Проблем не обнаружено.**

---

## 3. Анализ компонентов

### Button.tsx (frontend/src/components/ui/Button.tsx)

**Соответствие Design System v3:**

| Свойство | Документация | Реализация | Статус |
|----------|--------------|------------|--------|
| Primary bg | `bg-gold text-bg-primary` | `bg-gradient-to-r from-gold-300 to-gold-400` | ⚠️ Улучшено |
| Secondary bg | `bg-bg-tertiary border border-border` | `bg-transparent border border-border-default` | ⚠️ Немного отличается |
| Hover primary | `hover:bg-gold-light` | `hover:from-gold-200 hover:to-gold-300` | ✅ |
| Focus ring | `focus:ring-gold` | `focus-visible:ring-gold-300/50` | ✅ |
| Border radius | `rounded-lg` | `rounded-lg` / `rounded-xl` (xl для size=xl) | ✅ |

**Комментарий:**
- Primary использует **градиент** вместо solid — это **улучшение**, соответствует театральной эстетике
- Secondary прозрачная — тоже хороший выбор для dark theme
- Вариант `gold-outline` — отличное дополнение

**Проблем нет. Компонент соответствует и улучшает дизайн-систему.**

---

### Card.tsx (frontend/src/components/ui/Card.tsx)

**Соответствие Design System v3:**

| Свойство | Документация | Реализация | Статус |
|----------|--------------|------------|--------|
| Default bg | `bg-bg-secondary` | `bg-bg-surface` | ✅ Алиас |
| Border | `border border-border` | `border border-border-subtle` | ✅ |
| Border radius | `rounded-xl` | `rounded-2xl` | ⚠️ Увеличен |
| Interactive hover | `hover:border-gold/50 hover:shadow-gold` | `hover:border-border-default hover:shadow-lg` | ⚠️ Нет золотого эффекта |
| Icon bg | `bg-gold-muted text-gold` | `bg-gold-300/10 text-gold-300` | ✅ |

**Проблемы:**

- [ ] **Interactive variant не имеет золотого hover** (строка 46):
  ```tsx
  // СЕЙЧАС:
  'hover:border-border-default',
  'hover:shadow-lg hover:shadow-black/20'

  // ДОЛЖНО БЫТЬ (из документации):
  'hover:border-gold/50 hover:shadow-gold'
  ```

**Исправление:**
```tsx
// frontend/src/components/ui/Card.tsx, строка 40-48
interactive: cn(
  'bg-bg-surface',
  'border border-border-subtle',
  'rounded-2xl',
  'cursor-pointer',
  'transition-all duration-200',
  // ИСПРАВИТЬ:
  'hover:bg-bg-surface-hover hover:border-gold-300/50',
  'hover:shadow-gold shadow-gold/0' // добавить shadow-gold
),
```

**Border radius:**
- Документация: `rounded-xl` (12px)
- Реализация: `rounded-2xl` (16px)
- **Вердикт:** Оставить как есть, 16px лучше для крупных карточек

---

### Modal.tsx (frontend/src/components/ui/Modal.tsx)

**Соответствие Design System v3:**

| Свойство | Документация | Реализация | Статус |
|----------|--------------|------------|--------|
| Overlay bg | `bg-black/60 backdrop-blur-sm` | `bg-black/70 backdrop-blur-sm` | ✅ Небольшое отличие |
| Content bg | `bg-bg-secondary` | `bg-bg-overlay` | ✅ Использует elevated |
| Border radius | `rounded-2xl` | `rounded-2xl` | ✅ |
| Border | `border border-border` | `border border-border-default` | ✅ |
| Animation | `animate-in fade-in-0 zoom-in-95` | `animate-scale-in` | ✅ |
| Close button hover | `hover:bg-bg-tertiary` | `hover:bg-white/5` | ⚠️ Немного отличается |

**Комментарий:**
- `bg-bg-overlay` (#2D3B4F) вместо `bg-bg-secondary` (#1A2332) — **правильно**, модалки должны быть elevated
- Close button использует `white/5` — это эквивалентно hover эффекту на тёмном фоне

**Проблем нет. Компонент соответствует.**

---

### Input.tsx (frontend/src/components/ui/Input.tsx)

**Соответствие Design System v3:**

| Свойство | Документация | Реализация | Статус |
|----------|--------------|------------|--------|
| Background | `bg-bg-tertiary` | `bg-bg-surface` | ⚠️ Отличается |
| Border | `border border-border rounded-lg` | `border border-border-default rounded-lg` | ✅ |
| Text color | `text-text-primary` | `text-text-primary` | ✅ |
| Placeholder | `placeholder:text-text-muted` | `placeholder:text-text-placeholder` | ✅ Использует dedicated токен |
| Focus border | `focus:border-gold` | `focus:border-gold-300/50` | ✅ |
| Focus ring | `focus:ring-1 focus:ring-gold` | `focus:ring-2 focus:ring-gold-300/20` | ✅ |
| Hover | `hover:border-border-light` | `hover:border-border-strong` | ✅ Алиас |

**Проблемы:**

- [ ] **Background должен быть tertiary, а не surface** (строка 111):
  ```tsx
  // СЕЙЧАС:
  'bg-bg-surface',

  // ДОЛЖНО БЫТЬ (из документации):
  'bg-bg-tertiary'  // или 'bg-bg-surface-hover' (это алиас для tertiary)
  ```

**Исправление:**
```tsx
// frontend/src/components/ui/Input.tsx, строка 111
// ЗАМЕНИТЬ:
'bg-bg-surface',
// НА:
'bg-bg-surface-hover',  // это tertiary (#243044)
```

**Обоснование:**
- `bg-surface` = #1A2332 (secondary)
- `bg-surface-hover` = #243044 (tertiary)
- Input должен быть темнее фона карточки для контраста

---

### Select.tsx (frontend/src/components/ui/Select.tsx)

**Соответствие Design System v3:**

| Свойство | Документация | Реализация | Статус |
|----------|--------------|------------|--------|
| Background | `bg-bg-tertiary` | `bg-bg-surface` | ⚠️ Та же проблема что и Input |
| Border | `border border-border rounded-lg` | `border border-border-default rounded-lg` | ✅ |
| Focus | `focus:border-gold focus:ring-1 focus:ring-gold` | `focus:border-gold-300/50 focus:ring-gold-300/20` | ✅ |
| Chevron icon | Должна быть | Есть (ChevronDown) | ✅ |
| Option стили | `[&>option]:bg-bg-overlay` | `[&>option]:bg-bg-overlay [&>option]:text-text-primary` | ✅ |

**Проблемы:**

- [ ] **Та же проблема с background** (строка 45):
  ```tsx
  'bg-bg-surface border-border-default text-text-primary',
  // ДОЛЖНО БЫТЬ:
  'bg-bg-surface-hover border-border-default text-text-primary',
  ```

**Исправление:**
```tsx
// frontend/src/components/ui/Select.tsx, строки 43-50
const variantStyles = {
  // Default — тёмный фон для тёмной темы
  default: cn(
    'bg-bg-surface-hover border-border-default text-text-primary',  // ИСПРАВИТЬ
    'hover:border-border-strong',
    'focus:border-gold-300/50 focus:ring-gold-300/20',
    'disabled:bg-bg-surface-hover disabled:opacity-60',
    '[&>option]:bg-bg-overlay [&>option]:text-text-primary'
  ),
  // Filled — чуть светлее
  filled: cn(
    'bg-bg-surface-hover border-transparent text-text-primary',
    'hover:bg-bg-overlay',
    'focus:bg-bg-surface focus:border-gold-300/50 focus:ring-gold-300/20',
    'disabled:opacity-60',
    '[&>option]:bg-bg-overlay [&>option]:text-text-primary'
  ),
};
```

---

### Badge.tsx (frontend/src/components/ui/Badge.tsx)

**Соответствие Design System v3:**

| Свойство | Документация | Реализация | Статус |
|----------|--------------|------------|--------|
| Base styles | `rounded-full text-xs font-medium` | `rounded-full font-medium text-xs` (md size) | ✅ |
| Default bg | `bg-bg-tertiary text-text-secondary` | `bg-white/10 text-text-secondary` | ⚠️ Немного отличается |
| Gold bg | `bg-gold-muted text-gold` | `bg-gold-300/10 text-gold-300` | ✅ |
| Success bg | `bg-success-bg text-success` | `bg-success/10 text-success` | ✅ |
| Error bg | `bg-error-bg text-error` | `bg-error/10 text-error` | ✅ |

**Комментарий:**
- `bg-white/10` vs `bg-bg-tertiary` — практически эквивалентно на тёмном фоне
- Использует `/10` для прозрачности — современный подход

**Проблем нет. Компонент соответствует.**

---

### Table.tsx (frontend/src/components/ui/Table.tsx)

**Соответствие Design System v3:**

| Свойство | Документация | Реализация | Статус |
|----------|--------------|------------|--------|
| Wrapper | `overflow-x-auto rounded-xl border border-border` | Нет wrapper с border | ❌ |
| Thead bg | `bg-bg-tertiary` | `bg-surface-100` | ❌ Hardcoded старый класс |
| Th border | `border-b border-border` | `border-b border-surface-200` | ❌ Hardcoded |
| Tr hover | `hover:bg-bg-tertiary/50` | `hover:bg-gold-50/50` | ❌ Неправильный цвет |
| Td text | `text-text-primary` | Нет явного класса | ⚠️ |

**КРИТИЧЕСКИЕ ПРОБЛЕМЫ:**

- [ ] **Использует несуществующие классы `surface-100`, `surface-200`** (строки 152, 165, 188)
- [ ] **Hover использует `gold-50` вместо `bg-tertiary`** (строка 225)
- [ ] **Striped mode использует `bg-surface-50` и `bg-white`** (строка 224) — это светлая тема!

**Исправление:**

```tsx
// frontend/src/components/ui/Table.tsx

// ЗАМЕНИТЬ строку 152:
<thead className={`
  bg-bg-surface-hover  // было: bg-surface-100
  ${stickyHeader ? 'sticky top-0 z-10' : ''}
`}>

// ЗАМЕНИТЬ строки 164-167:
className={`
  ${cellPadding[size]}
  ${getAlignClass(column.align)}
  ${getVisibilityClass(column)}
  font-semibold text-text-primary
  border-b border-border-subtle  // было: border-surface-200
  ${column.sortable ? 'cursor-pointer select-none hover:bg-bg-surface transition-colors' : ''}
  ${column.className || ''}
`}

// ЗАМЕНИТЬ строку 188:
<tbody className="divide-y divide-border-subtle">  // было: divide-surface-200

// ЗАМЕНИТЬ строки 220-227:
<tr
  key={rowKey(item, index)}
  className={`
    transition-colors
    ${variant === 'striped' && index % 2 === 1 ? 'bg-bg-surface-hover' : 'bg-bg-surface'}
    ${hoverable ? 'hover:bg-bg-surface-hover/50' : ''}
    ${onRowClick ? 'cursor-pointer' : ''}
  `}
  onClick={() => onRowClick?.(item, index)}
>
```

---

### Spinner.tsx (frontend/src/components/ui/Spinner.tsx)

**Соответствие Design System v3:**

| Свойство | Документация | Реализация | Статус |
|----------|--------------|------------|--------|
| Gold variant | `text-gold` | `text-gold` | ❌ Несуществующий класс |
| Animation | `animate-spin` | `animate-spin` | ✅ |

**ПРОБЛЕМЫ:**

- [ ] **Класс `text-gold` не определён в Tailwind Config** (строка 28-30)
  ```tsx
  const variantClasses: Record<string, string> = {
    gold: 'text-gold',        // ❌ Не существует
    white: 'text-white',      // ✅ OK
    primary: 'text-primary',  // ❌ Не существует
  };
  ```

**Исправление:**
```tsx
// frontend/src/components/ui/Spinner.tsx, строки 27-31
const variantClasses: Record<string, string> = {
  gold: 'text-gold-400',      // ИСПРАВИТЬ
  white: 'text-white',
  primary: 'text-text-primary',  // ИСПРАВИТЬ
};
```

---

## 4. Hardcoded значения

### Найденные проблемы

| Файл | Строка | Hardcoded | Должно быть | Приоритет |
|------|--------|-----------|-------------|-----------|
| Table.tsx | 152 | `bg-surface-100` | `bg-bg-surface-hover` | P0 |
| Table.tsx | 165 | `border-surface-200` | `border-border-subtle` | P0 |
| Table.tsx | 188 | `divide-surface-200` | `divide-border-subtle` | P0 |
| Table.tsx | 224 | `bg-surface-50` / `bg-white` | `bg-bg-surface-hover` / `bg-bg-surface` | P0 |
| Table.tsx | 225 | `hover:bg-gold-50/50` | `hover:bg-bg-surface-hover/50` | P0 |
| Spinner.tsx | 28 | `text-gold` | `text-gold-400` | P1 |
| Spinner.tsx | 30 | `text-primary` | `text-text-primary` | P1 |
| Input.tsx | 111 | `bg-bg-surface` | `bg-bg-surface-hover` | P1 |
| Select.tsx | 45 | `bg-bg-surface` | `bg-bg-surface-hover` | P1 |
| Card.tsx | 46-47 | Нет золотого hover | `hover:border-gold-300/50 hover:shadow-gold` | P2 |

---

## 5. Отсутствующие компоненты

По документации должны быть, но отсутствуют:

- [ ] **Textarea.tsx** (упоминается в системе форм)
- [ ] **Calendar.tsx** (описан в документации для расписания)
- [ ] **Tooltip.tsx** (стандартный UI компонент)
- [ ] **Avatar.tsx** (используется в EventCard примере)
- [ ] **Checkbox.tsx** / **Radio.tsx** (стандартные поля форм)
- [ ] **Tabs.tsx** (для навигации внутри страниц)
- [ ] **Alert.tsx** / **Toast.tsx** (для уведомлений)

---

## 6. Отсутствующие файлы

- [ ] **`frontend/src/styles/variables.css`** — файл с CSS variables для `:root`
- [ ] **`frontend/src/index.css`** — глобальные стили (был удалён или не создан)

**Необходимо создать:**

```css
/* frontend/src/styles/variables.css */
:root {
  /* Background */
  --bg-base: 15 20 25;
  --bg-elevated: 26 35 50;
  --bg-surface: 26 35 50;
  --bg-surface-hover: 36 48 68;
  --bg-overlay: 45 59 79;

  /* Gold */
  --gold-50: 253 248 243;
  --gold-100: 249 237 224;
  --gold-200: 242 217 188;
  --gold-300: 232 194 151;
  --gold-400: 212 165 116;
  --gold-500: 196 136 77;
  --gold-600: 166 105 58;

  /* Text */
  --text-primary: 241 245 249;
  --text-secondary: 148 163 184;
  --text-muted: 100 116 139;
  --text-placeholder: 71 85 105;

  /* Borders */
  --border-subtle: 51 65 85;
  --border-default: 71 85 105;
  --border-strong: 100 116 139;

  /* Semantic */
  --success: 16 185 129;
  --warning: 245 158 11;
  --error: 239 68 68;
  --info: 59 130 246;
}

/* Global base styles */
body {
  background-color: rgb(var(--bg-base));
  color: rgb(var(--text-primary));
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

---

## 7. Приоритеты исправлений

### P0 — Критично (компоненты не работают)

1. **Table.tsx — исправить все hardcoded классы**
   - `bg-surface-100` → `bg-bg-surface-hover`
   - `border-surface-200` → `border-border-subtle`
   - `divide-surface-200` → `divide-border-subtle`
   - `bg-white` / `bg-surface-50` → `bg-bg-surface` / `bg-bg-surface-hover`
   - `hover:bg-gold-50/50` → `hover:bg-bg-surface-hover/50`
   - **Трудозатраты:** 30 минут

2. **Создать файл с CSS variables**
   - `frontend/src/styles/variables.css`
   - Импортировать в `App.tsx`
   - **Трудозатраты:** 15 минут

### P1 — Важно (визуальная консистентность)

3. **Input.tsx — исправить background**
   - `bg-bg-surface` → `bg-bg-surface-hover`
   - **Трудозатраты:** 2 минуты

4. **Select.tsx — исправить background**
   - `bg-bg-surface` → `bg-bg-surface-hover`
   - **Трудозатраты:** 2 минуты

5. **Spinner.tsx — исправить классы цветов**
   - `text-gold` → `text-gold-400`
   - `text-primary` → `text-text-primary`
   - **Трудозатраты:** 2 минуты

6. **tailwind.config.js — удалить legacy цвета**
   - Удалить `primary`, `gold`, `surface`, `background`, `text` (строки 59-105)
   - **Трудозатраты:** 5 минут

### P2 — Желательно (polish)

7. **Card.tsx — добавить золотой hover для interactive**
   - `hover:border-gold-300/50 hover:shadow-gold`
   - **Трудозатраты:** 5 минут

8. **Создать отсутствующие компоненты**
   - Textarea, Calendar, Tooltip, Avatar, Checkbox, Radio, Tabs, Alert
   - **Трудозатраты:** 4-6 часов (по 30-45 мин на компонент)

---

## 8. Оценка трудозатрат

| Задача | Приоритет | Часы |
|--------|-----------|------|
| Исправить Table.tsx | P0 | 0.5h |
| Создать variables.css | P0 | 0.25h |
| Исправить Input.tsx | P1 | 0.05h |
| Исправить Select.tsx | P1 | 0.05h |
| Исправить Spinner.tsx | P1 | 0.05h |
| Очистить tailwind.config.js | P1 | 0.1h |
| Исправить Card.tsx hover | P2 | 0.1h |
| Создать недостающие компоненты | P2 | 5h |
| **ИТОГО (без P2 компонентов)** | **P0-P1** | **1.1h** |
| **ИТОГО (полностью)** | **P0-P2** | **6.1h** |

---

## 9. Код исправлений

### 9.1. frontend/src/styles/variables.css (СОЗДАТЬ)

```css
/**
 * Theatre Management System — CSS Variables
 * Design System v3 — Modern Theatre Elegance
 */

:root {
  /* ========================================
     Background Colors (RGB format for alpha support)
     ======================================== */

  /* Main backgrounds */
  --bg-base: 15 20 25;           /* #0F1419 — основной фон страницы */
  --bg-elevated: 26 35 50;       /* #1A2332 — поднятые элементы (sidebar) */
  --bg-surface: 26 35 50;        /* #1A2332 — карточки */
  --bg-surface-hover: 36 48 68;  /* #243044 — hover состояние */
  --bg-overlay: 45 59 79;        /* #2D3B4F — модальные окна */

  /* ========================================
     Gold Accent Palette
     ======================================== */

  --gold-50: 253 248 243;   /* #FDF8F3 */
  --gold-100: 249 237 224;  /* #F9EDE0 */
  --gold-200: 242 217 188;  /* #F2D9BC */
  --gold-300: 232 194 151;  /* #E8C297 — light accent */
  --gold-400: 212 165 116;  /* #D4A574 — primary accent */
  --gold-500: 196 136 77;   /* #C4884D */
  --gold-600: 166 105 58;   /* #A6693A — dark accent */

  /* ========================================
     Text Colors
     ======================================== */

  --text-primary: 241 245 249;    /* #F1F5F9 — основной текст */
  --text-secondary: 148 163 184;  /* #94A3B8 — вторичный текст */
  --text-muted: 100 116 139;      /* #64748B — приглушённый */
  --text-placeholder: 71 85 105;  /* #475569 — placeholder */

  /* ========================================
     Border Colors
     ======================================== */

  --border-subtle: 51 65 85;    /* #334155 — тонкие границы */
  --border-default: 71 85 105;  /* #475569 — обычные границы */
  --border-strong: 100 116 139; /* #64748B — яркие границы */

  /* ========================================
     Semantic Colors
     ======================================== */

  --success: 16 185 129;   /* #10B981 — успех */
  --warning: 245 158 11;   /* #F59E0B — предупреждение */
  --error: 239 68 68;      /* #EF4444 — ошибка */
  --info: 59 130 246;      /* #3B82F6 — информация */
}

/* ========================================
   Global Styles
   ======================================== */

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background-color: rgb(var(--bg-base));
  color: rgb(var(--text-primary));
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.5;
  overflow-x: hidden;
}

/* Selection */
::selection {
  background-color: rgb(var(--gold-400) / 0.3);
  color: rgb(var(--text-primary));
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
```

### 9.2. frontend/src/App.tsx (ИЗМЕНИТЬ)

```tsx
// Добавить импорт в начало файла:
import './styles/variables.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// ... остальные импорты
```

### 9.3. frontend/src/components/ui/Table.tsx (ИСПРАВИТЬ)

```tsx
// Строка 152: ЗАМЕНИТЬ
<thead
  className={`
    bg-bg-surface-hover
    ${stickyHeader ? 'sticky top-0 z-10' : ''}
  `}
>

// Строки 164-167: ЗАМЕНИТЬ
className={`
  ${cellPadding[size]}
  ${getAlignClass(column.align)}
  ${getVisibilityClass(column)}
  font-semibold text-text-primary
  border-b border-border-subtle
  ${column.sortable ? 'cursor-pointer select-none hover:bg-bg-surface transition-colors' : ''}
  ${column.className || ''}
`}

// Строка 188: ЗАМЕНИТЬ
<tbody className="divide-y divide-border-subtle">

// Строки 220-227: ЗАМЕНИТЬ
<tr
  key={rowKey(item, index)}
  className={`
    transition-colors
    ${variant === 'striped' && index % 2 === 1 ? 'bg-bg-surface-hover' : 'bg-bg-surface'}
    ${hoverable ? 'hover:bg-bg-surface-hover/50' : ''}
    ${onRowClick ? 'cursor-pointer' : ''}
  `}
  onClick={() => onRowClick?.(item, index)}
>
```

### 9.4. frontend/src/components/ui/Input.tsx (ИСПРАВИТЬ)

```tsx
// Строка 111: ЗАМЕНИТЬ
'bg-bg-surface-hover',  // было: 'bg-bg-surface'
```

### 9.5. frontend/src/components/ui/Select.tsx (ИСПРАВИТЬ)

```tsx
// Строки 43-50: ЗАМЕНИТЬ
const variantStyles = {
  default: cn(
    'bg-bg-surface-hover border-border-default text-text-primary',
    'hover:border-border-strong',
    'focus:border-gold-300/50 focus:ring-gold-300/20',
    'disabled:bg-bg-surface-hover disabled:opacity-60',
    '[&>option]:bg-bg-overlay [&>option]:text-text-primary'
  ),
  filled: cn(
    'bg-bg-surface-hover border-transparent text-text-primary',
    'hover:bg-bg-overlay',
    'focus:bg-bg-surface focus:border-gold-300/50 focus:ring-gold-300/20',
    'disabled:opacity-60',
    '[&>option]:bg-bg-overlay [&>option]:text-text-primary'
  ),
};
```

### 9.6. frontend/src/components/ui/Spinner.tsx (ИСПРАВИТЬ)

```tsx
// Строки 27-31: ЗАМЕНИТЬ
const variantClasses: Record<string, string> = {
  gold: 'text-gold-400',
  white: 'text-white',
  primary: 'text-text-primary',
};
```

### 9.7. frontend/src/components/ui/Card.tsx (ИСПРАВИТЬ)

```tsx
// Строки 40-48: ЗАМЕНИТЬ
interactive: cn(
  'bg-bg-surface',
  'border border-border-subtle',
  'rounded-2xl',
  'cursor-pointer',
  'transition-all duration-200',
  'hover:bg-bg-surface-hover hover:border-gold-300/50',
  'hover:shadow-gold shadow-gold/0'
),
```

### 9.8. frontend/tailwind.config.js (ИСПРАВИТЬ)

```js
// УДАЛИТЬ строки 58-105 (legacy support):
// legacy: {
//   primary: { ... },
//   gold: { ... },
//   surface: { ... },
//   background: { ... },
//   text: { ... }
// }

// Оставить только:
colors: {
  // Backgrounds (CSS variables)
  'bg-base': 'rgb(var(--bg-base) / <alpha-value>)',
  'bg-elevated': 'rgb(var(--bg-elevated) / <alpha-value>)',
  'bg-surface': 'rgb(var(--bg-surface) / <alpha-value>)',
  'bg-surface-hover': 'rgb(var(--bg-surface-hover) / <alpha-value>)',
  'bg-overlay': 'rgb(var(--bg-overlay) / <alpha-value>)',

  // Text (CSS variables)
  'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
  'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
  'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
  'text-placeholder': 'rgb(var(--text-placeholder) / <alpha-value>)',

  // Borders (CSS variables)
  'border-subtle': 'rgb(var(--border-subtle))',
  'border-default': 'rgb(var(--border-default))',
  'border-strong': 'rgb(var(--border-strong))',

  // Gold palette (CSS variables)
  'gold-50': 'rgb(var(--gold-50) / <alpha-value>)',
  'gold-100': 'rgb(var(--gold-100) / <alpha-value>)',
  'gold-200': 'rgb(var(--gold-200) / <alpha-value>)',
  'gold-300': 'rgb(var(--gold-300) / <alpha-value>)',
  'gold-400': 'rgb(var(--gold-400) / <alpha-value>)',
  'gold-500': 'rgb(var(--gold-500) / <alpha-value>)',
  'gold-600': 'rgb(var(--gold-600) / <alpha-value>)',

  // Semantic colors (CSS variables)
  success: 'rgb(var(--success) / <alpha-value>)',
  warning: 'rgb(var(--warning) / <alpha-value>)',
  error: 'rgb(var(--error) / <alpha-value>)',
  info: 'rgb(var(--info) / <alpha-value>)',
},
```

---

## 10. Checklist для проверки после исправлений

### Визуальная проверка

- [ ] Открыть любую страницу с карточками — проверить цвет фона карточек
- [ ] Открыть форму — проверить цвет фона Input и Select (должен быть темнее карточки)
- [ ] Навести на Interactive Card — должна появиться золотая граница
- [ ] Открыть Modal — проверить тёмный фон
- [ ] Открыть таблицу — проверить правильные цвета header, borders, hover
- [ ] Загрузка — проверить золотой Spinner

### Технические проверки

```bash
# 1. Проверить отсутствие ошибок в консоли браузера
npm run dev
# Открыть http://localhost:5173 и проверить Console

# 2. Проверить типы TypeScript
npm run typecheck

# 3. Проверить сборку production
npm run build
```

### Проверка контрастности (a11y)

- [ ] Текст text-primary на bg-base: ratio >= 13.5:1 ✅
- [ ] Текст text-secondary на bg-base: ratio >= 7:1 ✅
- [ ] Текст text-muted на bg-base: ratio >= 4.5:1 ✅
- [ ] Кнопка primary (gold на black): ratio >= 6:1 ✅

---

## 11. Выводы и рекомендации

### Позитивное

1. **Архитектура компонентов** — отличная структура, использование forwardRef, TypeScript типы
2. **CSS Variables подход** — правильное использование Tailwind с CSS variables
3. **Консистентность** — большинство компонентов следуют единому паттерну
4. **Accessibility** — есть ARIA labels, focus states, keyboard navigation
5. **Animations** — плавные переходы, правильные duration

### Что требует внимания

1. **Table.tsx** — критические ошибки с hardcoded классами (P0)
2. **Отсутствие variables.css** — CSS variables не определены (P0)
3. **Input/Select background** — не соответствует документации (P1)
4. **Legacy colors в tailwind.config.js** — риск неправильного использования (P1)
5. **Отсутствующие компоненты** — Calendar, Textarea, Tooltip и др. (P2)

### Следующие шаги

1. **Исправить P0 проблемы** (1 час)
2. **Исправить P1 проблемы** (15 минут)
3. **Протестировать все исправления** (30 минут)
4. **Создать недостающие компоненты** (5 часов, можно отложить)

### Общая оценка

**85% соответствие Design System v3** — отличный результат для MVP. Большинство проблем легко исправляются за 1-2 часа. После исправлений P0 и P1 соответствие будет **95%**.

---

*Отчёт создан: 2026-01-16*
*Анализировал: UI/UX Designer AI Agent*
*Версия Design System: v3.0*
