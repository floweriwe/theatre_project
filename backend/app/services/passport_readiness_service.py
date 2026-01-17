"""
Сервис готовности паспорта спектакля.

Рассчитывает процент заполненности документации спектакля
на основе обязательных категорий для каждого раздела.
"""
from sqlalchemy import select, func, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.performance_document import (
    PerformanceDocument,
    DocumentSection,
    PerformanceDocumentCategory,
)


class PassportReadinessService:
    """
    Сервис расчёта готовности паспорта спектакля.

    Определяет процент заполненности документации
    на основе обязательных категорий для каждого раздела.
    """

    # Маппинг обязательных категорий для каждого раздела
    SECTION_REQUIRED_CATEGORIES = {
        DocumentSection.GENERAL: {
            PerformanceDocumentCategory.PASSPORT,
            PerformanceDocumentCategory.RECEPTION_ACT,
            PerformanceDocumentCategory.FIRE_PROTECTION,
            PerformanceDocumentCategory.WELDING_ACTS,
            PerformanceDocumentCategory.MATERIAL_CERTS,
            PerformanceDocumentCategory.CALCULATIONS,
        },
        DocumentSection.PRODUCTION: {
            PerformanceDocumentCategory.SKETCHES,
            PerformanceDocumentCategory.TECH_SPEC_DECOR,
            PerformanceDocumentCategory.TECH_SPEC_LIGHT,
            PerformanceDocumentCategory.TECH_SPEC_COSTUME,
            PerformanceDocumentCategory.TECH_SPEC_PROPS,
            PerformanceDocumentCategory.TECH_SPEC_SOUND,
        },
        DocumentSection.OPERATION: {
            PerformanceDocumentCategory.DECOR_PHOTOS,
            PerformanceDocumentCategory.LAYOUTS,
            PerformanceDocumentCategory.MOUNT_LIST,
            PerformanceDocumentCategory.HANGING_LIST,
            PerformanceDocumentCategory.MOUNT_INSTRUCTION,
            PerformanceDocumentCategory.LIGHT_PARTITION,
            PerformanceDocumentCategory.SOUND_PARTITION,
            PerformanceDocumentCategory.COSTUME_LIST,
            PerformanceDocumentCategory.MAKEUP_CARD,
        },
        DocumentSection.APPENDIX: {
            PerformanceDocumentCategory.RIDER,
            PerformanceDocumentCategory.ESTIMATES,
            PerformanceDocumentCategory.DRAWINGS,
        },
    }

    # Названия разделов на русском
    SECTION_NAMES = {
        DocumentSection.GENERAL: "Общая часть",
        DocumentSection.PRODUCTION: "Производство сценического оформления",
        DocumentSection.OPERATION: "Эксплуатация спектакля",
        DocumentSection.APPENDIX: "Приложение",
    }

    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_passport_readiness(
        self,
        performance_id: int,
    ) -> dict:
        """
        Рассчитать готовность паспорта спектакля.

        Args:
            performance_id: ID спектакля

        Returns:
            dict: Структура с общим прогрессом и детализацией по разделам
            {
                "overall_progress": 75,
                "sections": [
                    {
                        "section": "1.0",
                        "section_name": "Общая часть",
                        "progress": 100,
                        "status": "COMPLETE",
                        "filled_categories": 6,
                        "total_categories": 6
                    },
                    ...
                ]
            }
        """
        # Получаем все уникальные категории документов для спектакля
        # Группируем по разделам
        result = await self._session.execute(
            select(
                PerformanceDocument.section,
                PerformanceDocument.category,
            )
            .where(PerformanceDocument.performance_id == performance_id)
            .where(PerformanceDocument.is_current == True)
            .distinct()
        )

        documents = result.all()

        # Группируем документы по разделам
        filled_by_section = {}
        for row in documents:
            section = row.section
            category = row.category

            if section not in filled_by_section:
                filled_by_section[section] = set()

            filled_by_section[section].add(category)

        # Рассчитываем прогресс для каждого раздела
        sections = []
        total_filled = 0
        total_required = 0

        for section, required_categories in self.SECTION_REQUIRED_CATEGORIES.items():
            filled_categories = filled_by_section.get(section, set())

            # Определяем, какие обязательные категории заполнены
            filled_required = filled_categories & required_categories

            filled_count = len(filled_required)
            total_count = len(required_categories)

            # Прогресс раздела
            progress = round((filled_count / total_count * 100) if total_count > 0 else 0)

            # Статус раздела
            if filled_count == 0:
                status = "EMPTY"
            elif filled_count == total_count:
                status = "COMPLETE"
            else:
                status = "IN_PROGRESS"

            sections.append({
                "section": section.value,
                "section_name": self.SECTION_NAMES[section],
                "progress": progress,
                "status": status,
                "filled_categories": filled_count,
                "total_categories": total_count,
            })

            total_filled += filled_count
            total_required += total_count

        # Общий прогресс
        overall_progress = round((total_filled / total_required * 100) if total_required > 0 else 0)

        return {
            "overall_progress": overall_progress,
            "sections": sections,
        }

    async def get_section_readiness(
        self,
        performance_id: int,
        section: DocumentSection,
    ) -> dict:
        """
        Получить детализированную готовность раздела.

        Args:
            performance_id: ID спектакля
            section: Раздел паспорта

        Returns:
            dict: Детализация по категориям внутри раздела
            {
                "section": "1.0",
                "section_name": "Общая часть",
                "progress": 83,
                "categories": [
                    {
                        "category": "passport",
                        "category_name": "Паспорт спектакля",
                        "required": true,
                        "filled": true,
                        "documents_count": 1
                    },
                    ...
                ]
            }
        """
        # Получаем категории из требуемых для раздела
        required_categories = self.SECTION_REQUIRED_CATEGORIES.get(section, set())

        # Получаем количество документов для каждой категории в разделе
        result = await self._session.execute(
            select(
                PerformanceDocument.category,
                func.count(PerformanceDocument.id).label('count')
            )
            .where(PerformanceDocument.performance_id == performance_id)
            .where(PerformanceDocument.section == section)
            .where(PerformanceDocument.is_current == True)
            .group_by(PerformanceDocument.category)
        )

        categories_data = {row.category: row.count for row in result.all()}

        # Формируем детализацию по категориям
        categories = []
        filled_count = 0

        for category in required_categories:
            doc_count = categories_data.get(category, 0)
            is_filled = doc_count > 0

            if is_filled:
                filled_count += 1

            categories.append({
                "category": category.value,
                "category_name": self._get_category_name(category),
                "required": True,
                "filled": is_filled,
                "documents_count": doc_count,
            })

        # Сортируем по category value для стабильного порядка
        categories.sort(key=lambda x: x["category"])

        # Прогресс раздела
        total_count = len(required_categories)
        progress = round((filled_count / total_count * 100) if total_count > 0 else 0)

        return {
            "section": section.value,
            "section_name": self.SECTION_NAMES.get(section, section.value),
            "progress": progress,
            "filled_categories": filled_count,
            "total_categories": total_count,
            "categories": categories,
        }

    def _get_category_name(self, category: PerformanceDocumentCategory) -> str:
        """Получить название категории на русском."""
        category_names = {
            # 1.0 Общая часть
            PerformanceDocumentCategory.PASSPORT: "Паспорт спектакля",
            PerformanceDocumentCategory.RECEPTION_ACT: "Акт приёмки декораций",
            PerformanceDocumentCategory.FIRE_PROTECTION: "Огнезащитная обработка",
            PerformanceDocumentCategory.WELDING_ACTS: "Акты сварочных работ",
            PerformanceDocumentCategory.MATERIAL_CERTS: "Сертификаты материалов",
            PerformanceDocumentCategory.CALCULATIONS: "Расчёты конструкций",

            # 2.0 Производство
            PerformanceDocumentCategory.SKETCHES: "Эскизы к спектаклю",
            PerformanceDocumentCategory.TECH_SPEC_DECOR: "ТЗ декорация",
            PerformanceDocumentCategory.TECH_SPEC_LIGHT: "ТЗ свет",
            PerformanceDocumentCategory.TECH_SPEC_COSTUME: "ТЗ костюм",
            PerformanceDocumentCategory.TECH_SPEC_PROPS: "ТЗ реквизит",
            PerformanceDocumentCategory.TECH_SPEC_SOUND: "ТЗ звук",

            # 3.0 Эксплуатация
            PerformanceDocumentCategory.DECOR_PHOTOS: "Фото декораций",
            PerformanceDocumentCategory.LAYOUTS: "Планировки",
            PerformanceDocumentCategory.MOUNT_LIST: "Монтировочная опись",
            PerformanceDocumentCategory.HANGING_LIST: "Ведомость развески",
            PerformanceDocumentCategory.MOUNT_INSTRUCTION: "Инструкция монтажа",
            PerformanceDocumentCategory.LIGHT_PARTITION: "Партитура света",
            PerformanceDocumentCategory.SOUND_PARTITION: "Партитура звука",
            PerformanceDocumentCategory.VIDEO_PARTITION: "Партитура видео",
            PerformanceDocumentCategory.COSTUME_LIST: "Опись костюмов",
            PerformanceDocumentCategory.MAKEUP_CARD: "Грим-карта",

            # 4.0 Приложение
            PerformanceDocumentCategory.RIDER: "Райдер спектакля",
            PerformanceDocumentCategory.ESTIMATES: "Сметы",
            PerformanceDocumentCategory.DRAWINGS: "Чертежи",

            # Общее
            PerformanceDocumentCategory.OTHER: "Прочее",
        }

        return category_names.get(category, category.value)
