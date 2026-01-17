/**
 * Карточка готовности паспорта спектакля.
 *
 * Отображает:
 * - Общий прогресс заполнения паспорта (круговой индикатор)
 * - Прогресс по каждому разделу (1.0-4.0)
 * - Статусы разделов (EMPTY, IN_PROGRESS, COMPLETE)
 * - Количество заполненных категорий
 */

interface PassportReadinessSectionData {
  section: string;
  section_name: string;
  progress: number;
  status: 'EMPTY' | 'IN_PROGRESS' | 'COMPLETE';
  filled_categories: number;
  total_categories: number;
}

export interface PassportReadiness {
  overall_progress: number;
  sections: PassportReadinessSectionData[];
}

interface PassportReadinessCardProps {
  performanceId: number;
  readiness: PassportReadiness | null;
  isLoading?: boolean;
  onSectionClick?: (section: string) => void;
}

// Статус-индикатор с цветовой кодировкой
function StatusIndicator({ status }: { status: PassportReadinessSectionData['status'] }) {
  const colors = {
    EMPTY: 'bg-[#64748B]',
    IN_PROGRESS: 'bg-[#D4A574]',
    COMPLETE: 'bg-emerald-500',
  };

  const labels = {
    EMPTY: 'Не начат',
    IN_PROGRESS: 'В процессе',
    COMPLETE: 'Завершён',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
      <span className="text-xs text-[#94A3B8]">{labels[status]}</span>
    </div>
  );
}

// Круговой индикатор прогресса
function CircularProgress({ progress }: { progress: number }) {
  const radius = 60;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        {/* Фоновый круг */}
        <circle
          stroke="#243044"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Прогресс */}
        <circle
          stroke="#D4A574"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-500"
        />
      </svg>
      {/* Процент в центре */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-[#D4A574] font-['Inter']">
          {Math.round(progress)}%
        </span>
        <span className="text-xs text-[#64748B] mt-1">готовности</span>
      </div>
    </div>
  );
}

// Горизонтальный прогресс-бар
function ProgressBar({ progress, status }: { progress: number; status: PassportReadinessSectionData['status'] }) {
  const colors = {
    EMPTY: 'bg-[#64748B]/30',
    IN_PROGRESS: 'bg-[#D4A574]',
    COMPLETE: 'bg-emerald-500',
  };

  return (
    <div className="w-full h-2 bg-[#1A2332] rounded-full overflow-hidden">
      <div
        className={`h-full ${colors[status]} transition-all duration-500`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Скелетон загрузки
function LoadingSkeleton() {
  return (
    <div className="bg-[#1A2332] rounded-lg p-6 border border-[#D4A574]/20">
      <div className="flex flex-col items-center mb-6">
        <div className="w-32 h-32 bg-[#243044] rounded-full animate-pulse mb-4" />
        <div className="w-32 h-6 bg-[#243044] rounded animate-pulse" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-40 h-4 bg-[#243044] rounded animate-pulse" />
              <div className="w-24 h-4 bg-[#243044] rounded animate-pulse" />
            </div>
            <div className="w-full h-2 bg-[#243044] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className="bg-[#1A2332] rounded-lg p-6 border border-[#D4A574]/20">
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#243044] flex items-center justify-center">
          <svg
            className="w-10 h-10 text-[#64748B]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[#F1F5F9] mb-2 font-['Cormorant_Garamond']">
          Нет данных о готовности
        </h3>
        <p className="text-sm text-[#94A3B8]">
          Паспорт спектакля ещё не создан
        </p>
      </div>
    </div>
  );
}

export function PassportReadinessCard({
  readiness,
  isLoading = false,
  onSectionClick,
}: PassportReadinessCardProps) {
  // Загрузка
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Нет данных
  if (!readiness) {
    return <EmptyState />;
  }

  return (
    <div className="bg-[#1A2332] rounded-lg p-6 border border-[#D4A574]/20">
      {/* Заголовок */}
      <h3 className="text-xl font-bold text-[#F1F5F9] mb-6 font-['Cormorant_Garamond']">
        Готовность паспорта
      </h3>

      {/* Общий прогресс */}
      <div className="flex flex-col items-center mb-8">
        <CircularProgress progress={readiness.overall_progress} />
      </div>

      {/* Прогресс по разделам */}
      <div className="space-y-4">
        {readiness.sections.map((section) => (
          <div
            key={section.section}
            className={`p-4 bg-[#243044] rounded-lg ${
              onSectionClick ? 'cursor-pointer hover:bg-[#2d3a4f] transition-colors' : ''
            }`}
            onClick={() => onSectionClick?.(section.section)}
          >
            {/* Заголовок раздела */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-[#F1F5F9] mb-1">
                  {section.section_name}
                </h4>
                <StatusIndicator status={section.status} />
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-[#D4A574]">
                  {Math.round(section.progress)}%
                </span>
              </div>
            </div>

            {/* Прогресс-бар */}
            <ProgressBar progress={section.progress} status={section.status} />

            {/* Счётчик категорий */}
            <div className="mt-2 text-xs text-[#94A3B8]">
              {section.filled_categories} из {section.total_categories} категорий заполнено
            </div>
          </div>
        ))}
      </div>

      {/* Подсказка */}
      {onSectionClick && (
        <div className="mt-4 pt-4 border-t border-[#D4A574]/20">
          <p className="text-xs text-[#64748B] text-center">
            Нажмите на раздел, чтобы перейти к его заполнению
          </p>
        </div>
      )}
    </div>
  );
}

export default PassportReadinessCard;
