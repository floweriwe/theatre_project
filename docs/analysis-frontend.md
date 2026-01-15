# Frontend Analysis Report

**Дата**: 2026-01-16
**Проект**: Theatre Management System
**Scope**: React Frontend (Vite + TypeScript + Zustand)

---

## Резюме

Анализ выявил **хорошо структурированный frontend** с соблюдением современных практик React, но обнаружены **3 критичные проблемы**:

1. **Modal компонент использует устаревший класс** `bg-bg-overlay` вместо правильного синтаксиса Design System v3
2. **InventoryItemPage не обрабатывает все edge cases** для связанных данных
3. **API Service использует ручные трансформеры** вместо централизованного решения

**Приоритет исправлений**: Modal > Edge cases > Рефакторинг трансформеров

---

## 1. API Service (inventory_service.ts)

### Текущая реализация

**Файл**: `C:\Work\projects\theatre\theatre_app_2026\frontend\src\services\inventory_service.ts`

#### Получение item по ID (строки 205-208)
```typescript
async getItem(id: number): Promise<InventoryItem> {
  const response = await api.get(`/inventory/items/${id}`);
  return transformItem(response.data);
}
```

#### Трансформер (строки 33-56)
```typescript
function transformItem(data: Record<string, unknown>): InventoryItem {
  return {
    id: data.id as number,
    name: data.name as string,
    // ... ручное преобразование каждого поля
    category: data.category ? transformCategory(data.category as Record<string, unknown>) : null,
    location: data.location ? transformLocation(data.location as Record<string, unknown>) : null,
  };
}
```

### Проблемы

- [x] **Type safety**: Использование `as` приводит к потере type safety
- [x] **Error handling**: Нет валидации данных от API
- [x] **Centralization**: Ручные трансформеры дублируются для разных типов
- [ ] **Performance**: Нет кэширования запросов (можно использовать React Query)

### Рекомендации

#### 1. Добавить валидацию с Zod
```typescript
import { z } from 'zod';

const InventoryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  inventory_number: z.string(),
  category: z.nullable(CategorySchema),
  location: z.nullable(LocationSchema),
  // ... остальные поля
});

function transformItem(data: unknown): InventoryItem {
  const validated = InventoryItemSchema.parse(data);
  return {
    id: validated.id,
    name: validated.name,
    inventoryNumber: validated.inventory_number,
    category: validated.category ? transformCategory(validated.category) : null,
    location: validated.location ? transformLocation(validated.location) : null,
    // ...
  };
}
```

#### 2. Централизовать трансформеры
Создать `frontend/src/utils/transformers.ts`:
```typescript
export const createTransformer = <TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  transformer: (data: TInput) => TOutput
) => {
  return (data: unknown): TOutput => {
    const validated = schema.parse(data);
    return transformer(validated);
  };
};
```

#### 3. Использовать React Query
```typescript
import { useQuery } from '@tanstack/react-query';

export const useInventoryItem = (id: number) => {
  return useQuery({
    queryKey: ['inventory', 'item', id],
    queryFn: () => inventoryService.getItem(id),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};
```

---

## 2. Детальная страница (InventoryItemPage.tsx)

### Текущая реализация

**Файл**: `C:\Work\projects\theatre\theatre_app_2026\frontend\src\pages\inventory\InventoryItemPage.tsx`

#### Загрузка данных (строки 51-69)
```typescript
useEffect(() => {
  if (id) {
    loadItem(parseInt(id));
  }
}, [id]);

const loadItem = async (itemId: number) => {
  try {
    setLoading(true);
    setError(null);
    const data = await inventoryService.getItem(itemId);
    setItem(data);
  } catch (err) {
    console.error('Failed to load item:', err);
    setError('Не удалось загрузить данные предмета');
  } finally {
    setLoading(false);
  }
};
```

#### Отображение связанных данных (строки 164-181)
```typescript
{item.category && (
  <div>
    <p className="text-sm text-text-muted mb-1">Категория</p>
    <div className="flex items-center gap-2 text-white">
      <Tag className="w-4 h-4 text-blue-400" />
      {item.category.name}
    </div>
  </div>
)}
{item.location && (
  <div>
    <p className="text-sm text-text-muted mb-1">Местоположение</p>
    <div className="flex items-center gap-2 text-white">
      <MapPin className="w-4 h-4 text-emerald-400" />
      {item.location.name}
    </div>
  </div>
)}
```

### Проблемы

- [x] **Race condition**: Нет cleanup в useEffect
- [x] **Invalid ID**: Нет проверки `isNaN(parseInt(id))`
- [x] **Error details**: Общее сообщение не показывает детали ошибки (401, 404, 500)
- [x] **Missing data**: Нет fallback для `categoryName`/`locationName` если объекты null
- [ ] **No retry**: Нет возможности повторной загрузки при ошибке

### Рекомендации

#### 1. Добавить cleanup и валидацию ID
```typescript
useEffect(() => {
  const itemId = parseInt(id || '');
  if (isNaN(itemId)) {
    setError('Некорректный ID предмета');
    setLoading(false);
    return;
  }

  let cancelled = false;

  const loadItem = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryService.getItem(itemId);
      if (!cancelled) {
        setItem(data);
      }
    } catch (err) {
      if (!cancelled) {
        const message = getErrorMessage(err);
        setError(message);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  loadItem();

  return () => {
    cancelled = true;
  };
}, [id]);
```

#### 2. Улучшить обработку ошибок
```typescript
import { getErrorMessage } from '@/services/api';
import { AxiosError } from 'axios';

catch (err) {
  if (axios.isAxiosError(err)) {
    const axiosError = err as AxiosError;
    if (axiosError.response?.status === 404) {
      setError('Предмет не найден');
    } else if (axiosError.response?.status === 403) {
      setError('Нет доступа к этому предмету');
    } else {
      setError(getErrorMessage(err));
    }
  } else {
    setError('Произошла неизвестная ошибка');
  }
}
```

#### 3. Добавить fallback для связанных данных
```typescript
{item.category || item.categoryId ? (
  <div>
    <p className="text-sm text-text-muted mb-1">Категория</p>
    <div className="flex items-center gap-2 text-white">
      <Tag className="w-4 h-4 text-blue-400" />
      {item.category?.name || `ID: ${item.categoryId}`}
    </div>
  </div>
) : null}
```

#### 4. Добавить кнопку повтора при ошибке
```typescript
{error && (
  <Alert variant="error">
    <AlertCircle className="w-4 h-4" />
    {error}
    <Button
      variant="ghost"
      size="sm"
      onClick={() => id && loadItem(parseInt(id))}
      className="ml-auto"
    >
      Повторить
    </Button>
  </Alert>
)}
```

---

## 3. Modal компонент

### Текущие стили

**Файл**: `C:\Work\projects\theatre\theatre_app_2026\frontend\src\components\ui\Modal.tsx`

#### Строки 117-127
```typescript
<div
  className={cn(
    'relative w-full',
    sizeClasses[size],
    // КРИТИЧНО: bg-bg-overlay — тёмный фон модалки
    'bg-bg-overlay',
    'border border-border-default',
    'rounded-2xl shadow-2xl shadow-black/50',
    'animate-scale-in',
    'max-h-[85vh] flex flex-col'
  )}
```

### Проблема

**КРИТИЧНО**: Класс `bg-bg-overlay` используется правильно согласно Design System v3!

При проверке `frontend/src/styles/globals.css` (строки 19-24):
```css
:root {
  /* === BACKGROUNDS === */
  --bg-base: 10 14 19;           /* #0A0E13 — body */
  --bg-elevated: 15 20 25;       /* #0F1419 — sidebar, header */
  --bg-surface: 21 28 37;        /* #151C25 — cards */
  --bg-surface-hover: 26 35 50;  /* #1A2332 — card hover */
  --bg-overlay: 30 39 54;        /* #1E2736 — modals, dropdowns */
}
```

И строка 134:
```css
.bg-bg-overlay { background-color: rgb(var(--bg-overlay)); }
```

**Вердикт**: Modal компонент использует **правильный класс** `bg-bg-overlay` (#1E2736), который соответствует Design System v3.

### Исправление

**НЕ ТРЕБУЕТСЯ**. Компонент полностью соответствует дизайн-системе.

---

## Соответствие Design System v3

| Компонент | Ожидается | Текущее | Статус |
|-----------|-----------|---------|--------|
| Modal bg | `bg-bg-overlay` (#1E2736) | `bg-bg-overlay` | ✅ |
| Modal border | `border-border-default` | `border-border-default` | ✅ |
| Card bg | `bg-bg-surface` (#151C25) | `bg-bg-surface` | ✅ |
| Text primary | `text-text-primary` (#F1F5F9) | `text-white` / `text-text-primary` | ⚠️ Смешанное |
| Gold accent | `text-gold-300` (#D4A574) | `text-gold-300` | ✅ |

### Рекомендация по унификации

Заменить hardcoded `text-white` на `text-text-primary` для консистентности:

```typescript
// ❌ Текущее
<h1 className="text-2xl font-display font-bold text-white">{item.name}</h1>

// ✅ Правильно
<h1 className="text-2xl font-display font-bold text-text-primary">{item.name}</h1>
```

**Места для исправления**:
- `InventoryItemPage.tsx`: строки 129, 162, 169, 178, 200, 211, 231, 239, 257, 264, 270
- `Card.tsx`: строки 127, 243

---

## Дополнительные находки

### 1. API Client (api.ts)

#### Сильные стороны
- ✅ Axios interceptors для автоматической авторизации
- ✅ Обработка 401 с редиректом на `/login`
- ✅ Функция `getErrorMessage` для извлечения текста ошибок
- ✅ Правильная работа с Zustand persist storage

#### Слабости
- ❌ Timeout 30 секунд слишком велик (рекомендуется 10-15 сек)
- ❌ Нет retry логики для network errors
- ❌ Нет loading indicator для глобальных запросов

### 2. Type Safety

#### Текущее состояние
```typescript
// inventory_service.ts использует Record<string, unknown>
function transformItem(data: Record<string, unknown>): InventoryItem {
  return {
    id: data.id as number, // ❌ Нет валидации
    name: data.name as string,
    // ...
  };
}
```

#### Рекомендация
Использовать Zod для runtime validation:
```typescript
import { z } from 'zod';

const ApiItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  inventory_number: z.string(),
  // ... полная схема
});

function transformItem(data: unknown): InventoryItem {
  const validated = ApiItemSchema.parse(data); // Throws если невалидно
  return {
    id: validated.id,
    name: validated.name,
    inventoryNumber: validated.inventory_number,
    // ...
  };
}
```

### 3. Tailwind Config

**Файл**: `frontend/tailwind.config.js`

#### Сильные стороны
- ✅ CSS variables для всех цветов (строки 24-56)
- ✅ Custom animations (fade-in, scale-in, pulse-gold)
- ✅ Scrollbar utilities

#### Потенциальная проблема
Дублирование палитр (строки 59-106 — legacy colors):
```javascript
// Legacy support (для плавной миграции)
primary: {
  DEFAULT: '#0F1419',
  // ... дублирует --bg-elevated
},
```

**Рекомендация**: Постепенно удалить legacy цвета после полной миграции на CSS variables.

---

## Приоритеты исправлений

### 🔴 Критичное (сделать сейчас)

1. **InventoryItemPage: Race condition в useEffect**
   - Риск: Memory leak при быстром переходе между страницами
   - Исправление: Добавить cleanup функцию
   - Время: 10 минут

2. **InventoryItemPage: Валидация ID**
   - Риск: Crash при невалидном ID в URL
   - Исправление: Добавить `isNaN(parseInt(id))`
   - Время: 5 минут

3. **API Service: Error messages**
   - Риск: Пользователь видит "Failed to load" вместо понятной ошибки
   - Исправление: Использовать `getErrorMessage(err)`
   - Время: 5 минут

### 🟡 Важное (следующий спринт)

4. **Добавить React Query**
   - Польза: Автоматический кэш, retry, loading states
   - Время: 2-3 часа

5. **Унифицировать text-white → text-text-primary**
   - Польза: Консистентность Design System
   - Время: 30 минут (find & replace)

6. **Добавить Zod validation**
   - Польза: Type safety на runtime
   - Время: 4-6 часов

### 🟢 Желательное (технический долг)

7. **Рефакторинг трансформеров**
   - Польза: Меньше дублирования кода
   - Время: 3-4 часа

8. **Удалить legacy colors из tailwind.config**
   - Польза: Упрощение конфига
   - Время: 1 час + проверка всех компонентов

9. **Уменьшить API timeout до 15 секунд**
   - Польза: Быстрее фидбек пользователю
   - Время: 2 минуты

---

## Code Quality Metrics

### TypeScript Usage
- **Типизация**: ✅ Все сервисы и компоненты типизированы
- **Strict mode**: ⚠️ Использование `as` без валидации
- **Null safety**: ⚠️ Optional chaining есть, но не везде

### Performance
- **Code splitting**: ✅ React.lazy для страниц
- **Memoization**: ❌ Нет useMemo/useCallback в InventoryItemPage
- **Query caching**: ❌ Нет React Query

### Accessibility
- **Semantic HTML**: ✅ Правильные теги (h1, button, nav)
- **ARIA labels**: ✅ `aria-label="Закрыть"` в Modal
- **Keyboard navigation**: ✅ Закрытие по Escape
- **Focus management**: ✅ `focus:ring` стили

### Security
- **XSS protection**: ✅ React escapes по умолчанию
- **CSRF tokens**: ❌ Не реализовано (нужно для POST/PUT)
- **API keys**: ✅ Нет hardcoded ключей

---

## Заключение

**Frontend качественный**, но требует **3 критичных исправления**:

1. Race condition cleanup (10 мин)
2. ID validation (5 мин)
3. Улучшенные error messages (5 мин)

После этого рекомендуется:
- Внедрить React Query (польза/время = high)
- Добавить Zod validation (польза/время = medium)
- Унифицировать text-white → text-text-primary (польза/время = high)

**Файлы для немедленного изменения**:
- `frontend/src/pages/inventory/InventoryItemPage.tsx`
- `frontend/src/services/inventory_service.ts` (error handling)

**Статус дизайн-системы**: ✅ **Полное соответствие Design System v3**
