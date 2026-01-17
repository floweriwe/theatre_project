# Спецификация: Управление документами спектакля

> **Цель**: Технический план реализации модуля документов в MVP
> **Источник данных**: Анализ 2 реальных спектаклей (1037 файлов)
> **Статус**: Спецификация для Phase 8-9

---

## 1. Архитектура хранения файлов

### MinIO как отдельный сервис

```yaml
# docker-compose.dev.yml - уже настроен
services:
  minio:
    image: minio/minio
    volumes:
      - minio_data:/data          # Persistent volume
    ports:
      - "9000:9000"               # API
      - "9001:9001"               # Console
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"

volumes:
  minio_data:                     # Данные сохраняются при остановке
```

### Структура бакетов

```
theatre-documents/
├── performances/
│   ├── {performance_id}/
│   │   ├── passport/           # 1.0 Общая часть
│   │   ├── production/         # 2.0 Производство
│   │   ├── operation/          # 3.0 Эксплуатация
│   │   └── appendix/           # 4.0 Приложение
│   │
├── templates/                   # Шаблоны документов
├── inventory/                   # Фото инвентаря
└── temp/                        # Временные файлы (превью, конвертации)
```

---

## 2. Модель данных (Backend)

### PerformanceDocument

```python
# backend/app/models/performance_document.py

class DocumentCategory(str, Enum):
    # 1.0 Общая часть
    PASSPORT = "passport"
    RECEPTION_ACT = "reception_act"
    FIRE_PROTECTION = "fire_protection"
    WELDING_ACTS = "welding_acts"
    MATERIAL_CERTS = "material_certs"

    # 2.0 Производство
    SKETCHES = "sketches"
    TECH_SPEC_DECOR = "tech_spec_decor"
    TECH_SPEC_LIGHT = "tech_spec_light"
    TECH_SPEC_COSTUME = "tech_spec_costume"
    TECH_SPEC_PROPS = "tech_spec_props"

    # 3.0 Эксплуатация
    DECOR_PHOTOS = "decor_photos"
    LAYOUTS = "layouts"
    MOUNT_LIST = "mount_list"
    LIGHT_PARTITION = "light_partition"
    SOUND_PARTITION = "sound_partition"
    VIDEO_PARTITION = "video_partition"
    MAKEUP_CARD = "makeup_card"

    # 4.0 Приложение
    RIDER = "rider"
    ESTIMATES = "estimates"
    DRAWINGS = "drawings"
    OTHER = "other"


class DocumentSection(str, Enum):
    """Раздел паспорта спектакля"""
    GENERAL = "1.0"           # Общая часть
    PRODUCTION = "2.0"        # Производство
    OPERATION = "3.0"         # Эксплуатация
    APPENDIX = "4.0"          # Приложение


class ReportInclusion(str, Enum):
    """Включение в отчёт по спектаклю"""
    FULL = "full"             # Полностью входит
    PARTIAL = "partial"       # Частично (ссылка/превью)
    EXCLUDED = "excluded"     # Не входит в отчёт


class PerformanceDocument(Base):
    __tablename__ = "performance_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    performance_id: Mapped[int] = mapped_column(ForeignKey("performances.id"))

    # Файл
    file_path: Mapped[str]                    # MinIO path
    file_name: Mapped[str]                    # Оригинальное имя
    file_size: Mapped[int]
    mime_type: Mapped[str]

    # Категоризация
    section: Mapped[DocumentSection]          # Раздел паспорта
    category: Mapped[DocumentCategory]        # Категория
    subcategory: Mapped[Optional[str]]        # Подкатегория (материал, цех)

    # Отображение
    display_name: Mapped[str]                 # Название для UI
    description: Mapped[Optional[str]]
    sort_order: Mapped[int] = mapped_column(default=0)

    # Связь с отчётом
    report_inclusion: Mapped[ReportInclusion] = mapped_column(
        default=ReportInclusion.FULL
    )
    report_page: Mapped[Optional[int]]        # Страница в отчёте

    # Версионирование
    version: Mapped[int] = mapped_column(default=1)
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("performance_documents.id")
    )
    is_current: Mapped[bool] = mapped_column(default=True)

    # Аудит
    uploaded_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    uploaded_at: Mapped[datetime]

    # Связи
    performance: Mapped["Performance"] = relationship(back_populates="documents")
    uploader: Mapped["User"] = relationship()
    versions: Mapped[List["PerformanceDocument"]] = relationship()
```

### DocumentTag (для гибкой категоризации)

```python
class DocumentTag(Base):
    __tablename__ = "document_tags"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    color: Mapped[str] = mapped_column(default="#64748B")


class PerformanceDocumentTag(Base):
    __tablename__ = "performance_document_tags"

    document_id: Mapped[int] = mapped_column(
        ForeignKey("performance_documents.id"), primary_key=True
    )
    tag_id: Mapped[int] = mapped_column(
        ForeignKey("document_tags.id"), primary_key=True
    )
```

---

## 3. Сервисы (Backend)

### DocumentStorageService

```python
# backend/app/services/document_storage_service.py

class DocumentStorageService:
    """Работа с MinIO"""

    async def upload_file(
        self,
        file: UploadFile,
        performance_id: int,
        section: DocumentSection,
        category: DocumentCategory,
    ) -> str:
        """Загрузка файла в MinIO"""

    async def download_file(self, file_path: str) -> StreamingResponse:
        """Скачивание файла"""

    async def get_presigned_url(
        self,
        file_path: str,
        expires: int = 3600
    ) -> str:
        """URL для прямого доступа (превью)"""

    async def delete_file(self, file_path: str) -> None:
        """Удаление файла"""

    async def copy_file(self, src: str, dst: str) -> str:
        """Копирование (для версий)"""
```

### DocumentCategorizationService

```python
# backend/app/services/document_categorization_service.py

class DocumentCategorizationService:
    """Автоопределение категории"""

    # Паттерны из анализа
    FILENAME_PATTERNS = {
        r'^1\.[0-7]': DocumentSection.GENERAL,
        r'^2\.[1-5]': DocumentSection.PRODUCTION,
        r'^3\.': DocumentSection.OPERATION,
        r'^4\.': DocumentSection.APPENDIX,
    }

    CATEGORY_KEYWORDS = {
        'паспорт': DocumentCategory.PASSPORT,
        'акт.*прием': DocumentCategory.RECEPTION_ACT,
        'огнезащит': DocumentCategory.FIRE_PROTECTION,
        'сварк': DocumentCategory.WELDING_ACTS,
        'сертификат': DocumentCategory.MATERIAL_CERTS,
        'эскиз': DocumentCategory.SKETCHES,
        'монтиров': DocumentCategory.MOUNT_LIST,
        'райдер': DocumentCategory.RIDER,
        'смет': DocumentCategory.ESTIMATES,
    }

    EXTENSION_MAP = {
        '.dwg': DocumentCategory.DRAWINGS,
        '.c2p': DocumentCategory.LIGHT_PARTITION,
        '.cues': DocumentCategory.SOUND_PARTITION,
        '.mp3': DocumentCategory.SOUND_PARTITION,
        '.wav': DocumentCategory.SOUND_PARTITION,
    }

    def suggest_category(
        self,
        filename: str,
        folder_path: Optional[str] = None
    ) -> Tuple[DocumentSection, DocumentCategory, float]:
        """
        Возвращает предложенную категорию и уверенность (0-1)
        Пользователь может переопределить
        """
```

### PerformanceReportService

```python
# backend/app/services/performance_report_service.py

class PerformanceReportService:
    """Генерация отчёта по спектаклю"""

    async def get_readiness_report(
        self,
        performance_id: int
    ) -> ReadinessReport:
        """Чеклист заполненности документов"""

    async def generate_passport_pdf(
        self,
        performance_id: int
    ) -> bytes:
        """Генерация полного паспорта спектакля в PDF"""

    async def get_document_tree(
        self,
        performance_id: int
    ) -> DocumentTree:
        """Иерархическая структура документов"""
```

---

## 4. API Endpoints

```python
# backend/app/api/v1/performance_documents.py

router = APIRouter(prefix="/performances/{performance_id}/documents", tags=["documents"])

# CRUD
@router.get("/")
async def list_documents(
    performance_id: int,
    section: Optional[DocumentSection] = None,
    category: Optional[DocumentCategory] = None,
) -> List[DocumentListItem]:
    """Список документов с фильтрацией"""

@router.post("/")
async def upload_document(
    performance_id: int,
    file: UploadFile,
    section: DocumentSection,
    category: DocumentCategory,
    display_name: Optional[str] = None,
    report_inclusion: ReportInclusion = ReportInclusion.FULL,
) -> DocumentResponse:
    """Загрузка нового документа"""

@router.post("/bulk")
async def upload_documents_bulk(
    performance_id: int,
    files: List[UploadFile],
    auto_categorize: bool = True,
) -> BulkUploadResult:
    """Массовая загрузка с автокатегоризацией"""

@router.put("/{document_id}")
async def update_document(
    document_id: int,
    data: DocumentUpdateData,
) -> DocumentResponse:
    """Обновление метаданных"""

@router.put("/{document_id}/file")
async def replace_document_file(
    document_id: int,
    file: UploadFile,
    create_version: bool = True,
) -> DocumentResponse:
    """Замена файла (с версионированием)"""

@router.delete("/{document_id}")
async def delete_document(document_id: int) -> None:
    """Удаление документа"""

# Файловые операции
@router.get("/{document_id}/download")
async def download_document(document_id: int) -> StreamingResponse:
    """Скачивание файла"""

@router.get("/{document_id}/preview")
async def get_preview_url(document_id: int) -> PreviewUrlResponse:
    """Presigned URL для превью"""

# Версии
@router.get("/{document_id}/versions")
async def list_versions(document_id: int) -> List[DocumentVersion]:
    """История версий документа"""

@router.post("/{document_id}/restore/{version_id}")
async def restore_version(document_id: int, version_id: int) -> DocumentResponse:
    """Восстановить версию"""

# Отчёты
@router.get("/tree")
async def get_document_tree(performance_id: int) -> DocumentTree:
    """Иерархическое дерево документов"""

@router.get("/readiness")
async def get_readiness_report(performance_id: int) -> ReadinessReport:
    """Отчёт о готовности документации"""

@router.post("/reorder")
async def reorder_documents(
    performance_id: int,
    orders: List[DocumentOrderItem],
) -> None:
    """Изменение порядка документов"""
```

---

## 5. Frontend: Типы и сервисы

### Типы

```typescript
// frontend/src/types/performance_document.ts

export type DocumentSection = '1.0' | '2.0' | '3.0' | '4.0';
export type ReportInclusion = 'full' | 'partial' | 'excluded';

export type DocumentCategory =
  | 'passport' | 'reception_act' | 'fire_protection' | 'welding_acts' | 'material_certs'
  | 'sketches' | 'tech_spec_decor' | 'tech_spec_light' | 'tech_spec_costume' | 'tech_spec_props'
  | 'decor_photos' | 'layouts' | 'mount_list' | 'light_partition' | 'sound_partition' | 'video_partition' | 'makeup_card'
  | 'rider' | 'estimates' | 'drawings' | 'other';

export interface PerformanceDocument {
  id: number;
  performance_id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  section: DocumentSection;
  category: DocumentCategory;
  subcategory?: string;
  display_name: string;
  description?: string;
  sort_order: number;
  report_inclusion: ReportInclusion;
  report_page?: number;
  version: number;
  is_current: boolean;
  uploaded_by: number;
  uploaded_at: string;
  tags: DocumentTag[];
}

export interface DocumentTreeNode {
  section: DocumentSection;
  section_name: string;
  categories: {
    category: DocumentCategory;
    category_name: string;
    documents: PerformanceDocument[];
    required: boolean;
    filled: boolean;
  }[];
}

export interface ReadinessReport {
  performance_id: number;
  total_percent: number;
  sections: {
    section: DocumentSection;
    name: string;
    percent: number;
    categories: {
      category: DocumentCategory;
      name: string;
      status: 'complete' | 'partial' | 'missing';
      required: boolean;
      count: number;
    }[];
  }[];
}
```

### Сервис

```typescript
// frontend/src/services/performance_document_service.ts

export const performanceDocumentService = {
  // CRUD
  async getDocuments(performanceId: number, params?: {
    section?: DocumentSection;
    category?: DocumentCategory;
  }): Promise<PerformanceDocument[]>,

  async uploadDocument(
    performanceId: number,
    file: File,
    metadata: DocumentUploadData
  ): Promise<PerformanceDocument>,

  async uploadBulk(
    performanceId: number,
    files: File[],
    autoCategorize?: boolean
  ): Promise<BulkUploadResult>,

  async updateDocument(
    documentId: number,
    data: DocumentUpdateData
  ): Promise<PerformanceDocument>,

  async replaceFile(
    documentId: number,
    file: File,
    createVersion?: boolean
  ): Promise<PerformanceDocument>,

  async deleteDocument(documentId: number): Promise<void>,

  // Файлы
  async getDownloadUrl(documentId: number): Promise<string>,
  async getPreviewUrl(documentId: number): Promise<string>,

  // Структура
  async getDocumentTree(performanceId: number): Promise<DocumentTreeNode[]>,
  async getReadinessReport(performanceId: number): Promise<ReadinessReport>,
  async reorderDocuments(performanceId: number, orders: DocumentOrderItem[]): Promise<void>,

  // Версии
  async getVersions(documentId: number): Promise<DocumentVersion[]>,
  async restoreVersion(documentId: number, versionId: number): Promise<PerformanceDocument>,
};
```

---

## 6. UI/UX Компоненты

### Структура компонентов

```
frontend/src/components/PerformanceDocuments/
├── index.ts
├── DocumentTree.tsx              # Иерархическое дерево
├── DocumentUploader.tsx          # Drag & drop загрузка
├── DocumentCard.tsx              # Карточка документа
├── DocumentPreview.tsx           # Превью по типу файла
├── DocumentCategoryPicker.tsx    # Выбор категории
├── ReadinessReport.tsx           # Визуализация готовности
├── BulkUploadModal.tsx           # Массовая загрузка
├── DocumentVersionHistory.tsx    # История версий
└── ReportInclusionToggle.tsx     # Переключатель включения в отчёт
```

### DocumentTree (главный компонент)

```tsx
interface DocumentTreeProps {
  performanceId: number;
  editable?: boolean;
  onDocumentSelect?: (doc: PerformanceDocument) => void;
}

// Отображает:
// └── 1.0 Общая часть
//     ├── ✅ Паспорт спектакля (1 файл)
//     ├── ✅ Акт приёмки (1 файл)
//     ├── ⚠️ Огнезащита (требуется)
//     └── Сертификаты материалов
//         ├── Краска (3 файла)
//         ├── Металл (5 файлов)
//         └── + Добавить категорию
```

### DocumentUploader

```tsx
interface DocumentUploaderProps {
  performanceId: number;
  section?: DocumentSection;           // Если известен раздел
  category?: DocumentCategory;         // Если известна категория
  onUploadComplete: (docs: PerformanceDocument[]) => void;
}

// Функции:
// - Drag & drop зона
// - Автоопределение категории с предложением
// - Редактирование display_name перед загрузкой
// - Выбор report_inclusion
// - Прогресс загрузки
// - Bulk режим (несколько файлов)
```

### DocumentPreview

```tsx
interface DocumentPreviewProps {
  document: PerformanceDocument;
  mode: 'inline' | 'modal';
}

// Рендерит по mime_type:
// - image/*     → <img> с зумом
// - application/pdf → PDF.js viewer
// - audio/*     → <audio> плеер
// - video/*     → <video> плеер
// - spreadsheet → таблица (xlsx preview)
// - default     → иконка + метаданные + скачать
```

### ReadinessReport

```tsx
interface ReadinessReportProps {
  performanceId: number;
  compact?: boolean;                   // Для sidebar
}

// Визуализация:
// ┌─────────────────────────────────┐
// │ Готовность: 78%  ████████░░     │
// ├─────────────────────────────────┤
// │ 1.0 Общая часть      ████ 100% │
// │ 2.0 Производство     ███░  80% │
// │ 3.0 Эксплуатация     ██░░  60% │
// │ 4.0 Приложение       ████ 100% │
// └─────────────────────────────────┘
```

### ReportInclusionToggle

```tsx
interface ReportInclusionToggleProps {
  value: ReportInclusion;
  onChange: (value: ReportInclusion) => void;
}

// Три состояния:
// [Полностью] [Частично] [Исключён]
//
// Полностью = документ целиком в отчёте
// Частично = только ссылка/превью
// Исключён = не входит в отчёт
```

---

## 7. Интерактивный отчёт по спектаклю

### Концепция

Отчёт = интерактивная страница с навигацией по разделам паспорта.
Пользователь может:
- Просматривать документы inline
- Скачивать отдельные документы или весь раздел
- Печатать выбранные разделы
- Экспортировать в PDF (с учётом report_inclusion)

### Структура страницы

```
┌──────────────────────────────────────────────────────────────┐
│ Паспорт спектакля: Бесприданница           [Экспорт PDF] [🖨️] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Навигация         │ Содержимое                              │
│ ───────────       │ ─────────────────────────────────────── │
│ □ 1.0 Общая часть │                                         │
│   □ Паспорт       │  1.1 Паспорт спектакля                  │
│   □ Акт приёмки   │  ┌─────────────────────────────────┐    │
│   □ Сертификаты   │  │ [PDF Preview inline]            │    │
│ □ 2.0 Производство│  │                                 │    │
│   □ Эскизы        │  └─────────────────────────────────┘    │
│   □ ТЗ декорация  │        [Скачать] [Открыть] [Печать]     │
│ □ 3.0 Эксплуатация│                                         │
│ □ 4.0 Приложение  │                                         │
│                   │                                         │
└───────────────────┴─────────────────────────────────────────┘
```

---

## 8. Миграция существующих документов

### Seed Script для MVP

```python
# backend/scripts/seed_performance_documents.py

"""
Импорт документов из внешней папки в MinIO + БД.
Запуск: python -m scripts.seed_performance_documents /path/to/docs_theatre_full
"""

import asyncio
from pathlib import Path

async def migrate_performance_folder(
    performance_name: str,
    folder_path: Path,
    performance_id: int,
):
    """Миграция папки спектакля"""

    for file_path in folder_path.rglob('*'):
        if file_path.is_file():
            # 1. Определить категорию по пути
            section, category = categorize_by_path(
                file_path.relative_to(folder_path)
            )

            # 2. Загрузить в MinIO
            minio_path = await storage.upload_file(
                file_path,
                performance_id,
                section,
                category,
            )

            # 3. Создать запись в БД
            await repository.create(
                PerformanceDocumentCreate(
                    performance_id=performance_id,
                    file_path=minio_path,
                    file_name=file_path.name,
                    section=section,
                    category=category,
                    display_name=generate_display_name(file_path),
                    # ... остальные поля
                )
            )

def categorize_by_path(relative_path: Path) -> Tuple[DocumentSection, DocumentCategory]:
    """Определение категории по структуре папок"""
    parts = relative_path.parts

    # "1.0 Общая часть/1.6 Акты сварки/file.pdf"
    if parts[0].startswith("1."):
        section = DocumentSection.GENERAL
        # Дальнейшая категоризация по подпапке...
```

### CLI команда

```bash
# Миграция всех документов
docker-compose exec backend python -m scripts.seed_performance_documents \
    --source /external/docs_theatre_full \
    --performance "Бесприданница" \
    --performance-id 1

# Только определённый раздел
docker-compose exec backend python -m scripts.seed_performance_documents \
    --source /external/docs_theatre_full/34\ Бесприданница/3.0\ Документация\ эксплуатации \
    --performance-id 1 \
    --section 3.0
```

---

## 9. Требуемые библиотеки

### Backend

```txt
# requirements.txt (уже есть или добавить)
minio>=7.2.0          # MinIO SDK (уже есть)
python-magic>=0.4.27  # MIME type detection
aiofiles>=23.0.0      # Async file operations
```

### Frontend

```json
// package.json
{
  "dependencies": {
    "react-dropzone": "^14.2.3",      // Drag & drop
    "pdfjs-dist": "^4.0.0",           // PDF preview
    "@tanstack/react-query": "^5.0.0" // Кэширование запросов (уже есть?)
  }
}
```

---

## 10. План реализации (Phase 8-9)

### Phase 8: Document Storage & Upload
1. Модели БД + миграция
2. DocumentStorageService (MinIO)
3. API endpoints (CRUD)
4. DocumentUploader компонент
5. DocumentCard + базовый preview

### Phase 9: Document Organization & Reports
1. DocumentCategorizationService
2. DocumentTree компонент
3. ReadinessReport
4. Интерактивный отчёт (PerformancePassportPage)
5. Seed script для миграции
6. Bulk upload

---

## 11. Примечания по дизайну

### Цвета категорий (по дизайн-системе)

```typescript
const SECTION_COLORS = {
  '1.0': '#3B82F6',  // blue - Общая часть
  '2.0': '#8B5CF6',  // purple - Производство
  '3.0': '#F59E0B',  // amber - Эксплуатация
  '4.0': '#10B981',  // emerald - Приложение
};
```

### Иконки по типу файла

```typescript
const FILE_ICONS = {
  'application/pdf': DocumentIcon,
  'image/*': PhotoIcon,
  'audio/*': MusicalNoteIcon,
  'video/*': VideoCameraIcon,
  'application/vnd.openxmlformats-officedocument.spreadsheetml': TableCellsIcon,
  'default': PaperClipIcon,
};
```
