/**
 * SpreadsheetViewer Usage Examples
 *
 * This file demonstrates various use cases for the SpreadsheetViewer component.
 * NOT imported in production - for reference only.
 */

import { SpreadsheetViewer } from './SpreadsheetViewer';

/**
 * Example 1: Basic Usage - Budget File
 * Display an Excel budget file with default settings
 */
export function BudgetPreviewExample() {
  return (
    <div className="h-[600px] bg-[#0F1419] p-4 rounded-lg">
      <h2 className="text-xl font-['Cormorant_Garamond'] text-[#F1F5F9] mb-4">
        Бюджет спектакля "Гамлет"
      </h2>
      <SpreadsheetViewer fileUrl="/api/documents/budget_hamlet_2024.xlsx" />
    </div>
  );
}

/**
 * Example 2: CSV Schedule
 * Display a CSV schedule file
 */
export function SchedulePreviewExample() {
  return (
    <div className="h-[500px] bg-[#0F1419] p-4 rounded-lg">
      <h2 className="text-xl font-['Cormorant_Garamond'] text-[#F1F5F9] mb-4">
        Репетиционное расписание
      </h2>
      <SpreadsheetViewer fileUrl="/api/documents/rehearsal_schedule.csv" />
    </div>
  );
}

/**
 * Example 3: Full Height Container
 * Use with full viewport height
 */
export function FullHeightSpreadsheetExample() {
  return (
    <div className="h-screen bg-[#0F1419] flex flex-col p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-['Cormorant_Garamond'] text-[#F1F5F9] mb-2">
          Инвентарь - Реквизит
        </h1>
        <p className="text-[#94A3B8]">
          Полный список реквизита по цехам
        </p>
      </div>

      {/* Spreadsheet fills remaining space */}
      <div className="flex-1 min-h-0">
        <SpreadsheetViewer fileUrl="/api/documents/inventory_props.xlsx" />
      </div>
    </div>
  );
}

/**
 * Example 4: Modal with Spreadsheet
 * Display spreadsheet in a modal dialog
 */
export function SpreadsheetModalExample() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1A2332] rounded-lg shadow-xl w-[90vw] h-[80vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#D4A574]/20">
          <h2 className="text-xl font-['Cormorant_Garamond'] text-[#F1F5F9]">
            Финансовый отчет
          </h2>
          <button
            className="text-[#94A3B8] hover:text-[#F1F5F9]"
            aria-label="Закрыть"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-6 overflow-hidden">
          <SpreadsheetViewer fileUrl="/api/documents/financial_report_q1.xlsx" />
        </div>
      </div>
    </div>
  );
}

/**
 * Example 5: With Download Button
 * Combine preview with download option
 */
export function SpreadsheetWithDownloadExample() {
  const fileUrl = '/api/documents/costume_inventory.xlsx';

  return (
    <div className="bg-[#0F1419] p-6 rounded-lg">
      {/* Header with download button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-['Cormorant_Garamond'] text-[#F1F5F9]">
          Инвентарь костюмов
        </h2>
        <a
          href={fileUrl}
          download
          className="flex items-center gap-2 px-4 py-2 bg-[#D4A574] text-[#0F1419] rounded-lg hover:bg-[#E8C297] transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Скачать
        </a>
      </div>

      {/* Spreadsheet viewer */}
      <div className="h-[500px]">
        <SpreadsheetViewer fileUrl={fileUrl} />
      </div>
    </div>
  );
}

/**
 * Example 6: Side-by-side comparison
 * Compare two spreadsheets side by side
 */
export function SpreadsheetComparisonExample() {
  return (
    <div className="bg-[#0F1419] p-6 rounded-lg">
      <h1 className="text-2xl font-['Cormorant_Garamond'] text-[#F1F5F9] mb-6">
        Сравнение бюджетов
      </h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Left spreadsheet */}
        <div className="flex flex-col">
          <h3 className="text-lg text-[#D4A574] mb-3">2023 год</h3>
          <div className="h-[500px]">
            <SpreadsheetViewer fileUrl="/api/documents/budget_2023.xlsx" />
          </div>
        </div>

        {/* Right spreadsheet */}
        <div className="flex flex-col">
          <h3 className="text-lg text-[#D4A574] mb-3">2024 год</h3>
          <div className="h-[500px]">
            <SpreadsheetViewer fileUrl="/api/documents/budget_2024.xlsx" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 7: Responsive Layout
 * Adapt to different screen sizes
 */
export function ResponsiveSpreadsheetExample() {
  return (
    <div className="bg-[#0F1419] p-4 md:p-6 lg:p-8 rounded-lg">
      <h2 className="text-lg md:text-xl lg:text-2xl font-['Cormorant_Garamond'] text-[#F1F5F9] mb-4">
        Смета проекта
      </h2>

      {/* Responsive height */}
      <div className="h-[400px] md:h-[500px] lg:h-[600px]">
        <SpreadsheetViewer fileUrl="/api/documents/project_estimate.xlsx" />
      </div>

      {/* Responsive help text */}
      <p className="mt-3 text-xs md:text-sm text-[#64748B]">
        Используйте прокрутку для просмотра всех данных
      </p>
    </div>
  );
}

/**
 * Example 8: Integration with Document Management
 * Real-world usage in document viewer
 */
interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
}

export function DocumentPreviewExample({ document }: { document: Document }) {
  // Check if document is spreadsheet
  const isSpreadsheet = document.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                        document.type === 'application/vnd.ms-excel' ||
                        document.type === 'text/csv';

  if (!isSpreadsheet) {
    return <div className="text-[#64748B]">Неподдерживаемый формат</div>;
  }

  return (
    <div className="bg-[#1A2332] rounded-lg p-6">
      {/* Document metadata */}
      <div className="mb-4 pb-4 border-b border-[#D4A574]/20">
        <h3 className="text-lg font-medium text-[#F1F5F9] mb-1">
          {document.name}
        </h3>
        <p className="text-sm text-[#94A3B8]">
          Тип: {document.type === 'text/csv' ? 'CSV' : 'Excel'}
        </p>
      </div>

      {/* Spreadsheet preview */}
      <div className="h-[600px]">
        <SpreadsheetViewer fileUrl={document.url} />
      </div>
    </div>
  );
}
