# Phase 7: Document Templates & Generation - Execution Plan

## Overview
**BrainGrid Requirement:** REQ-10
**Branch:** `feature/phase7-document-templates`
**Goal:** Система генерации документов из шаблонов с интерактивным заполнением

## User Requirements Summary

### Ключевые функции:
1. **Спектакль как главный объект** - все документы привязаны к спектаклю
2. **Шаблоны-заготовки** - предзаполненные документы в нужном формате
3. **Интерактивное заполнение** - модальное окно с полями для каждого документа
4. **Автоподсказки** - подтягивание сотрудников, актёров из БД
5. **Версионирование** - откат, замена файлов, архивирование
6. **Предпросмотр** - просмотр перед сохранением
7. **Медиа-файлы** - поддержка замены любых файлов
8. **Красивый UI** - анимации, интерактивность, интуитивность

## Task Breakdown (10 Tasks)

### Group 1: Backend Foundation (Parallel)
| Task | Description | Agent | Dependencies |
|------|-------------|-------|--------------|
| 1 | DB Models: DocumentTemplate, DocumentTemplateVariable | backend-architect | None |
| 2 | Template CRUD API | backend-architect | Task 1 |
| 3 | TemplateVariable CRUD API | backend-architect | Task 1 |

### Group 2: Backend Services (Sequential after Group 1)
| Task | Description | Agent | Dependencies |
|------|-------------|-------|--------------|
| 4 | TemplateGenerationService (variable resolution + DOCX) | python-pro | Tasks 1-3 |
| 5 | Generate Document API (preview + generate) | backend-architect | Task 4 |
| 6 | PDF Conversion Service (LibreOffice headless) | python-pro | Task 4 |

### Group 3: Frontend (Parallel after Group 2)
| Task | Description | Agent | Dependencies |
|------|-------------|-------|--------------|
| 7 | Template Management UI (Admin) | frontend-developer | Tasks 2-3 |
| 8 | Document Generation UI (Users) - Modal with fields | frontend-developer | Task 5 |
| 10 | Integration with Performance Documents Tab | frontend-developer | Tasks 7-8 |

### Group 4: Seed Data (After Group 1)
| Task | Description | Agent | Dependencies |
|------|-------------|-------|--------------|
| 9 | Migration + Seed Data (2 default templates) | database-architect | Task 1 |

## Execution Order

```
Phase 7.1 (Parallel - Backend Models):
├── Task 1: DocumentTemplate + DocumentTemplateVariable models
├── Task 9: Migration with seed data (depends on Task 1)
└── Wait for completion

Phase 7.2 (Parallel - CRUD APIs):
├── Task 2: Template CRUD API
├── Task 3: TemplateVariable CRUD API
└── Wait for completion

Phase 7.3 (Parallel - Services):
├── Task 4: TemplateGenerationService
├── Task 6: PDF Conversion Service
└── Wait for completion

Phase 7.4 (Sequential - Generate API):
└── Task 5: Generate Document API

Phase 7.5 (Parallel - Frontend):
├── Task 7: Template Management UI (Admin)
├── Task 8: Document Generation UI (Modal)
├── Task 10: Performance Documents Integration
└── Wait for completion
```

## Technical Specifications

### Database Models

```python
# DocumentTemplate
class DocumentTemplate(Base):
    __tablename__ = "document_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    code: Mapped[str] = mapped_column(String(50), unique=True)  # PASSPORT, CONTRACT
    description: Mapped[str | None] = mapped_column(Text)
    file_path: Mapped[str] = mapped_column(String(500))  # MinIO path
    template_type: Mapped[TemplateType] = mapped_column(
        Enum(TemplateType, values_callable=lambda x: [e.value for e in x])
    )
    theater_id: Mapped[int] = mapped_column(ForeignKey("theaters.id"))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())

    # Relationships
    variables: Mapped[list["DocumentTemplateVariable"]] = relationship(back_populates="template")

# DocumentTemplateVariable
class DocumentTemplateVariable(Base):
    __tablename__ = "document_template_variables"

    id: Mapped[int] = mapped_column(primary_key=True)
    template_id: Mapped[int] = mapped_column(ForeignKey("document_templates.id"))
    name: Mapped[str] = mapped_column(String(100))  # placeholder: performance_title
    label: Mapped[str] = mapped_column(String(255))  # UI label: "Название спектакля"
    variable_type: Mapped[VariableType] = mapped_column(
        Enum(VariableType, values_callable=lambda x: [e.value for e in x])
    )
    default_value: Mapped[str | None] = mapped_column(Text)
    is_required: Mapped[bool] = mapped_column(default=True)
    source_field: Mapped[str | None] = mapped_column(String(255))  # auto-fill from DB
    order: Mapped[int] = mapped_column(default=0)

    # Relationships
    template: Mapped["DocumentTemplate"] = relationship(back_populates="variables")

# Enums
class TemplateType(str, Enum):
    PASSPORT = "passport"
    CONTRACT = "contract"
    SCHEDULE = "schedule"
    REPORT = "report"
    CHECKLIST = "checklist"
    CUSTOM = "custom"

class VariableType(str, Enum):
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    CHOICE = "choice"
    PERFORMANCE_FIELD = "performance_field"  # Auto from Performance
    USER_FIELD = "user_field"  # Auto from User/Staff
    ACTOR_LIST = "actor_list"  # Multi-select actors
```

### API Endpoints

```
# Templates
GET    /api/v1/templates                    # List all templates
POST   /api/v1/templates                    # Create template (admin)
GET    /api/v1/templates/{id}               # Get template details
PUT    /api/v1/templates/{id}               # Update template (admin)
DELETE /api/v1/templates/{id}               # Delete template (admin)

# Template Variables
GET    /api/v1/templates/{id}/variables     # List variables
POST   /api/v1/templates/{id}/variables     # Add variable
PUT    /api/v1/templates/{id}/variables/{var_id}  # Update variable
DELETE /api/v1/templates/{id}/variables/{var_id}  # Delete variable

# Document Generation
POST   /api/v1/templates/{id}/preview       # Preview with data
POST   /api/v1/templates/{id}/generate      # Generate document
GET    /api/v1/templates/{id}/suggestions   # Get autocomplete data

# Performance Documents
GET    /api/v1/performances/{id}/documents  # List documents
POST   /api/v1/performances/{id}/documents/from-template  # Create from template
```

### Frontend Components

```
components/
├── Templates/
│   ├── TemplateList.tsx           # Admin: list all templates
│   ├── TemplateEditor.tsx         # Admin: edit template
│   └── TemplateVariableEditor.tsx # Admin: manage variables
├── DocumentGeneration/
│   ├── GenerateDocumentModal.tsx  # User: main generation modal
│   ├── VariableForm.tsx           # Dynamic form for variables
│   ├── AutocompleteField.tsx      # Field with suggestions
│   ├── ActorSelector.tsx          # Multi-select for actors
│   └── DocumentPreview.tsx        # Preview before save
└── Documents/
    ├── DocumentVersionHistory.tsx # Version list with rollback
    ├── DocumentReplaceModal.tsx   # Upload replacement file
    └── PerformanceDocuments.tsx   # Documents tab in Performance
```

### UI/UX Requirements

1. **Animations:**
   - Framer Motion для модалок и переходов
   - Skeleton loading states
   - Smooth transitions на hover

2. **Интерактивность:**
   - Drag-n-drop для сортировки переменных
   - Inline editing где возможно
   - Real-time preview при изменении полей

3. **Автоподсказки:**
   - Debounced search
   - Recent selections first
   - Keyboard navigation

## Agent Prompts

### Task 1: Database Models
```
Create SQLAlchemy 2.0 async models for document templates:
1. DocumentTemplate model with fields: id, name, code (unique), description, file_path, template_type (enum), theater_id (FK), is_active, timestamps
2. DocumentTemplateVariable model with fields: id, template_id (FK), name, label, variable_type (enum), default_value, is_required, source_field, order
3. Create enums: TemplateType (passport, contract, schedule, report, checklist, custom), VariableType (text, number, date, choice, performance_field, user_field, actor_list)
4. Follow existing patterns from backend/app/models/
5. Use values_callable for Enum columns
```

### Task 2-3: CRUD APIs
```
Create FastAPI CRUD endpoints for DocumentTemplate/DocumentTemplateVariable:
- Follow existing patterns from backend/app/api/v1/
- Include proper validation, error handling
- Add pagination for list endpoints
- Include filtering by theater_id, is_active
```

### Task 4: TemplateGenerationService
```
Create service for document generation:
1. Load DOCX template from MinIO
2. Parse {{variable_name}} placeholders
3. Resolve variables from Performance/User data
4. Replace placeholders with values using python-docx
5. Support actor lists, dates formatting
6. Return generated DOCX bytes
```

### Task 5: Generate Document API
```
Create endpoints:
1. POST /templates/{id}/preview - return preview data
2. POST /templates/{id}/generate - create document, save to MinIO, create Document record
3. GET /templates/{id}/suggestions - return autocomplete data for fields
```

### Task 6: PDF Conversion
```
Add PDF conversion to existing conversion service:
1. Use LibreOffice headless (soffice --headless --convert-to pdf)
2. Convert generated DOCX to PDF
3. Support preview in PDF format
4. Handle errors gracefully
```

### Task 7: Template Management UI
```
Create admin interface for template management:
1. TemplateList - grid of templates with edit/delete
2. TemplateEditor - form for template details, file upload
3. VariableEditor - sortable list of variables
4. Follow theatre design system (dark theme, gold accents)
5. Use Framer Motion for animations
```

### Task 8: Document Generation UI
```
Create user interface for generating documents:
1. GenerateDocumentModal - main modal with steps
2. VariableForm - dynamic form based on template variables
3. AutocompleteField - with debounced search, suggestions
4. ActorSelector - multi-select with search
5. DocumentPreview - embedded preview of result
6. Beautiful UI with animations
```

### Task 9: Migration + Seed Data
```
Create Alembic migration:
1. Create tables: document_templates, document_template_variables
2. Create enums with DO $$ BEGIN ... EXCEPTION block
3. Add seed data: "Паспорт спектакля", "Договор с артистом"
4. Include realistic variables for each template
```

### Task 10: Performance Documents Integration
```
Integrate document generation into Performance page:
1. Add "Создать из шаблона" button to Documents tab
2. List available templates
3. Open GenerateDocumentModal
4. Show generated documents in list
5. Add version history, replace functionality
```

## Success Criteria

- [ ] All models created and migrated
- [ ] CRUD APIs working with tests
- [ ] Document generation from template works
- [ ] PDF preview available
- [ ] Admin can manage templates
- [ ] Users can generate documents from Performance page
- [ ] Version history with rollback works
- [ ] Autocomplete suggestions working
- [ ] Beautiful UI with animations
- [ ] TypeScript check passes
- [ ] Build successful

## Estimated Complexity

| Task | Complexity | Est. Tokens |
|------|------------|-------------|
| 1 | Medium | 3000 |
| 2 | Medium | 2500 |
| 3 | Low | 2000 |
| 4 | High | 4000 |
| 5 | Medium | 3000 |
| 6 | Low | 1500 |
| 7 | High | 4500 |
| 8 | High | 5000 |
| 9 | Low | 2000 |
| 10 | Medium | 3500 |

**Total:** ~31,000 tokens estimated
