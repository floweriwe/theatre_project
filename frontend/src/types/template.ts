/**
 * Types for Document Templates
 */

export type TemplateType = 'passport' | 'contract' | 'schedule' | 'report' | 'checklist' | 'custom';

export type VariableType =
  | 'text'
  | 'number'
  | 'date'
  | 'choice'
  | 'performance_field'
  | 'user_field'
  | 'actor_list'
  | 'staff_list';

export interface TemplateVariable {
  id: number;
  template_id: number;
  name: string;
  label: string;
  description?: string;
  variable_type: VariableType;
  default_value?: string;
  is_required: boolean;
  source_field?: string;
  choices?: string[];
  sort_order: number;
  group_name?: string;
  validation_rules?: Record<string, unknown>;
}

export interface DocumentTemplate {
  id: number;
  name: string;
  code: string;
  description?: string;
  file_path: string;
  file_name: string;
  template_type: TemplateType;
  is_active: boolean;
  is_system: boolean;
  default_output_format: 'docx' | 'pdf';
  settings?: Record<string, unknown>;
  theater_id?: number;
  created_at: string;
  updated_at: string;
  variables: TemplateVariable[];
}

export interface TemplateListItem {
  id: number;
  name: string;
  code: string;
  template_type: TemplateType;
  description?: string;
  is_active: boolean;
  is_system: boolean;
  default_output_format: string;
  variables_count: number;
  created_at: string;
}

export interface TemplateCreateData {
  name: string;
  code: string;
  template_type: TemplateType;
  description?: string;
  default_output_format?: 'docx' | 'pdf';
}

export interface TemplateUpdateData {
  name?: string;
  description?: string;
  template_type?: TemplateType;
  default_output_format?: 'docx' | 'pdf';
  is_active?: boolean;
  settings?: Record<string, unknown>;
}

export interface VariableCreateData {
  name: string;
  label: string;
  description?: string;
  variable_type: VariableType;
  default_value?: string;
  is_required: boolean;
  source_field?: string;
  choices?: string[];
  sort_order?: number;
  group_name?: string;
}

export interface VariableUpdateData {
  name?: string;
  label?: string;
  description?: string;
  variable_type?: VariableType;
  default_value?: string;
  is_required?: boolean;
  source_field?: string;
  choices?: string[];
  sort_order?: number;
  group_name?: string;
}

// Generation types
export interface VariableValue {
  name: string;
  value: string | number | string[];
}

export interface GenerateDocumentRequest {
  template_id: number;
  performance_id?: number;
  variables: VariableValue[];
  output_format: 'docx' | 'pdf';
  document_name?: string;
}

export interface GeneratedDocumentResponse {
  document_id: number;
  document_name: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  download_url: string;
}

export interface AutocompleteOption {
  id: number | string;
  label: string;
  description?: string;
  data?: Record<string, unknown>;
}

export interface AutocompleteSuggestions {
  variable_name: string;
  options: AutocompleteOption[];
}

export interface TemplateAutocompleteResponse {
  template_id: number;
  performance_id?: number;
  suggestions: AutocompleteSuggestions[];
  auto_filled_values: VariableValue[];
}

// Template type labels for UI
export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  passport: 'Паспорт спектакля',
  contract: 'Договор',
  schedule: 'Расписание',
  report: 'Отчёт',
  checklist: 'Чеклист',
  custom: 'Пользовательский',
};

export const VARIABLE_TYPE_LABELS: Record<VariableType, string> = {
  text: 'Текст',
  number: 'Число',
  date: 'Дата',
  choice: 'Выбор из списка',
  performance_field: 'Поле спектакля',
  user_field: 'Поле пользователя',
  actor_list: 'Список актёров',
  staff_list: 'Список сотрудников',
};
