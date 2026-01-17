/**
 * Типы для документов спектакля.
 */

// Разделы паспорта спектакля
export type DocumentSection = '1.0' | '2.0' | '3.0' | '4.0';

// Категории документов
export type PerformanceDocumentCategory =
  | 'passport' | 'reception_act' | 'fire_protection' | 'welding_acts'
  | 'material_certs' | 'calculations'
  | 'sketches' | 'tech_spec_decor' | 'tech_spec_light' | 'tech_spec_costume'
  | 'tech_spec_props' | 'tech_spec_sound'
  | 'decor_photos' | 'layouts' | 'mount_list' | 'hanging_list'
  | 'mount_instruction' | 'light_partition' | 'sound_partition'
  | 'video_partition' | 'costume_list' | 'makeup_card'
  | 'rider' | 'estimates' | 'drawings'
  | 'other';

// Включение в отчёт
export type ReportInclusion = 'full' | 'partial' | 'excluded';

// Документ спектакля
export interface PerformanceDocument {
  id: number;
  performance_id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  section: DocumentSection;
  category: PerformanceDocumentCategory;
  subcategory?: string;
  display_name: string;
  description?: string;
  sort_order: number;
  report_inclusion: ReportInclusion;
  version: number;
  is_current: boolean;
  uploaded_by_id?: number;
  uploaded_at: string;
  download_url?: string;
}

// Элемент списка документов
export interface PerformanceDocumentListItem {
  id: number;
  file_name: string;
  file_size: number;
  mime_type: string;
  section: DocumentSection;
  category: PerformanceDocumentCategory;
  display_name: string;
  uploaded_at: string;
  download_url?: string;
}

// Категория в дереве
export interface DocumentTreeCategory {
  category: PerformanceDocumentCategory;
  category_name: string;
  documents: PerformanceDocumentListItem[];
  count: number;
}

// Раздел в дереве
export interface DocumentTreeSection {
  section: DocumentSection;
  section_name: string;
  categories: DocumentTreeCategory[];
  total_count: number;
}

// Дерево документов
export interface PerformanceDocumentsTree {
  performance_id: number;
  sections: DocumentTreeSection[];
  total_documents: number;
}

// Обновление документа
export interface PerformanceDocumentUpdate {
  display_name?: string;
  description?: string;
  section?: DocumentSection;
  category?: PerformanceDocumentCategory;
  subcategory?: string;
  report_inclusion?: ReportInclusion;
  sort_order?: number;
}

// Готовность раздела паспорта
export interface PassportSectionReadiness {
  section: string;
  section_name: string;
  progress: number;
  status: 'EMPTY' | 'IN_PROGRESS' | 'COMPLETE';
  filled_categories: number;
  total_categories: number;
}

// Готовность паспорта спектакля
export interface PassportReadiness {
  overall_progress: number;
  sections: PassportSectionReadiness[];
}

// Детализированная готовность раздела
export interface SectionDetailedReadiness {
  section: string;
  section_name: string;
  progress: number;
  filled_categories: number;
  total_categories: number;
  categories: {
    category: PerformanceDocumentCategory;
    category_name: string;
    required: boolean;
    filled: boolean;
    documents_count: number;
  }[];
}

// Названия разделов
export const SECTION_NAMES: Record<DocumentSection, string> = {
  '1.0': '1.0 Общая часть',
  '2.0': '2.0 Производство',
  '3.0': '3.0 Эксплуатация',
  '4.0': '4.0 Приложение',
};

// Названия категорий
export const CATEGORY_NAMES: Record<PerformanceDocumentCategory, string> = {
  passport: 'Паспорт спектакля',
  reception_act: 'Акт приёмки декораций',
  fire_protection: 'Огнезащитная обработка',
  welding_acts: 'Акты сварочных работ',
  material_certs: 'Сертификаты материалов',
  calculations: 'Расчёты конструкций',
  sketches: 'Эскизы',
  tech_spec_decor: 'ТЗ декорация',
  tech_spec_light: 'ТЗ свет',
  tech_spec_costume: 'ТЗ костюм',
  tech_spec_props: 'ТЗ реквизит',
  tech_spec_sound: 'ТЗ звук',
  decor_photos: 'Фото декораций',
  layouts: 'Планировки',
  mount_list: 'Монтировочная опись',
  hanging_list: 'Ведомость развески',
  mount_instruction: 'Инструкция монтажа',
  light_partition: 'Партитура света',
  sound_partition: 'Партитура звука',
  video_partition: 'Партитура видео',
  costume_list: 'Опись костюмов',
  makeup_card: 'Грим-карта',
  rider: 'Райдер',
  estimates: 'Сметы',
  drawings: 'Чертежи',
  other: 'Прочее',
};

// Цвета разделов
export const SECTION_COLORS: Record<DocumentSection, string> = {
  '1.0': '#3B82F6',  // blue
  '2.0': '#8B5CF6',  // purple
  '3.0': '#F59E0B',  // amber
  '4.0': '#10B981',  // emerald
};

// Иконки по MIME типу
export const FILE_TYPE_ICONS: Record<string, string> = {
  'application/pdf': 'document',
  'image/': 'photo',
  'audio/': 'music',
  'video/': 'video',
  'application/vnd.openxmlformats-officedocument.spreadsheetml': 'table',
  'application/vnd.ms-excel': 'table',
  'default': 'paper-clip',
};

// Форматирование размера файла
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Определение иконки по MIME типу
export function getFileIcon(mimeType: string): string {
  for (const [key, icon] of Object.entries(FILE_TYPE_ICONS)) {
    if (mimeType.startsWith(key) || mimeType === key) {
      return icon;
    }
  }
  return FILE_TYPE_ICONS['default'];
}
