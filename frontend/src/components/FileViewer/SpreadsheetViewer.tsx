import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Spinner } from '@/components/ui/Spinner';

interface SpreadsheetViewerProps {
  fileUrl: string;
}

/**
 * SpreadsheetViewer Component
 *
 * Displays Excel (.xlsx, .xls) and CSV files in a read-only table format.
 * Uses SheetJS library for parsing spreadsheet files.
 *
 * Features:
 * - Parses first sheet of workbook
 * - Displays up to 1000 rows for performance
 * - Sticky table headers for easy navigation
 * - Dark theme styling matching theatre app design system
 *
 * Usage:
 * ```tsx
 * <SpreadsheetViewer fileUrl="/api/documents/budget_2024.xlsx" />
 * ```
 */
export function SpreadsheetViewer({ fileUrl }: SpreadsheetViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<string[][]>([]);
  const [totalRows, setTotalRows] = useState(0);

  const MAX_ROWS = 1000;

  useEffect(() => {
    const fetchAndParse = async () => {
      try {
        setLoading(true);
        const response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        // Parse spreadsheet using SheetJS
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
          throw new Error('Workbook has no sheets');
        }

        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to array of arrays (AOA format)
        const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
          header: 1,
          defval: '', // Default value for empty cells
          blankrows: true // Include blank rows
        });

        setTotalRows(jsonData.length);
        setData(jsonData.slice(0, MAX_ROWS));
        setLoading(false);
      } catch (err) {
        console.error('Spreadsheet parse error:', err);
        setError('Не удалось загрузить таблицу');
        setLoading(false);
      }
    };

    fetchAndParse();
  }, [fileUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="md" className="text-[#D4A574]" />
        <span className="ml-3 text-[#94A3B8]">Загрузка таблицы...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#64748B]">
        Таблица пуста
      </div>
    );
  }

  const headers = data[0] || [];
  const rows = data.slice(1);

  return (
    <div className="flex flex-col h-full">
      {/* Row count indicator */}
      {totalRows > MAX_ROWS && (
        <div className="text-sm text-[#D4A574] mb-2 px-4 py-2 bg-[#1A2332] rounded-lg">
          Показаны первые {MAX_ROWS.toLocaleString('ru-RU')} из {totalRows.toLocaleString('ru-RU')} строк
        </div>
      )}

      {/* Scrollable table container */}
      <div className="flex-1 overflow-auto border border-[#D4A574]/20 rounded-lg">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#1A2332]">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left font-medium text-[#F1F5F9] border-b border-[#D4A574]/20 whitespace-nowrap"
                >
                  {header || `Колонка ${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[#0F1419]">
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-[#243044] transition-colors"
              >
                {headers.map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 py-2 text-[#94A3B8] border-b border-[#D4A574]/10"
                  >
                    {row[colIndex] !== undefined ? String(row[colIndex]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SpreadsheetViewer;
