/**
 * Секция физических характеристик предмета инвентаря.
 *
 * Отображает габариты, вес и состояние.
 */

import { Ruler, Scale, Wrench } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { InventoryCondition } from '@/types';
import { CONDITION_LABELS, CONDITION_VARIANTS } from '@/types';

interface PhysicalSpecsSectionProps {
  /** Габариты (например, '2x3x1м') */
  dimensions: string | null;
  /** Вес в кг */
  weight: number | null;
  /** Физическое состояние */
  condition: InventoryCondition | null;
}

/**
 * Компонент секции физических характеристик.
 */
export function PhysicalSpecsSection({
  dimensions,
  weight,
  condition,
}: PhysicalSpecsSectionProps) {
  // Если все поля пустые, не показываем секцию
  if (!dimensions && !weight && !condition) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Ruler className="w-5 h-5 text-text-muted" />
        <h2 className="text-lg font-medium text-text-primary">
          Физические характеристики
        </h2>
      </div>

      <div className="space-y-4">
        {/* Габариты */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center">
            <Ruler className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Габариты</p>
            <p className="text-text-primary font-medium">
              {dimensions || 'Не указаны'}
            </p>
          </div>
        </div>

        {/* Вес */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center">
            <Scale className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Вес</p>
            <p className="text-text-primary font-medium">
              {weight !== null ? `${weight} кг` : 'Не указан'}
            </p>
          </div>
        </div>

        {/* Состояние */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center">
            <Wrench className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-text-muted mb-1">Состояние</p>
            {condition ? (
              <Badge variant={CONDITION_VARIANTS[condition]}>
                {CONDITION_LABELS[condition]}
              </Badge>
            ) : (
              <p className="text-text-primary font-medium">Не указано</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default PhysicalSpecsSection;
