/**
 * Технический паспорт спектакля.
 *
 * Аккордеон с разделами для каждого цеха: декорации, свет, звук, костюмы.
 * Каждая секция содержит редактируемое текстовое поле.
 */

import { useState, useEffect } from 'react';
import { Lightbulb, Volume2, Box, Shirt, AlertCircle } from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionContent,
} from '@/components/ui/Accordion';
import { Skeleton } from '@/components/ui/Skeleton';
import { performanceService } from '@/services/performance_service';
import type { PerformanceSection } from '@/types';

interface TechnicalPassportProps {
  /** ID спектакля */
  performanceId: number;
  /** Режим редактирования */
  editable?: boolean;
  /** Callback при изменении секции */
  onSectionUpdate?: (sectionId: number, content: string) => void;
}

/** Структура секций технического паспорта */
const PASSPORT_SECTIONS = [
  {
    type: 'scenery' as const,
    title: 'Декорации',
    icon: Box,
    placeholder: 'Описание декораций, конструкций, софитов...',
  },
  {
    type: 'lighting' as const,
    title: 'Свет',
    icon: Lightbulb,
    placeholder: 'Схема освещения, партитура света, световые эффекты...',
  },
  {
    type: 'sound' as const,
    title: 'Звук',
    icon: Volume2,
    placeholder: 'Звуковое оформление, музыка, фонограммы...',
  },
  {
    type: 'costumes' as const,
    title: 'Костюмы',
    icon: Shirt,
    placeholder: 'Описание костюмов по персонажам и сценам...',
  },
];

export function TechnicalPassport({
  performanceId,
  editable = false,
  onSectionUpdate,
}: TechnicalPassportProps) {
  const [sections, setSections] = useState<PerformanceSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<Record<number, string>>({});

  useEffect(() => {
    loadSections();
  }, [performanceId]);

  const loadSections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await performanceService.getSections(performanceId);
      setSections(data);

      // Инициализируем editingContent текущими значениями
      const contentMap: Record<number, string> = {};
      data.forEach((section) => {
        contentMap[section.id] = section.content || '';
      });
      setEditingContent(contentMap);
    } catch (err) {
      console.error('Failed to load sections:', err);
      setError('Не удалось загрузить разделы паспорта');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (sectionId: number, content: string) => {
    setEditingContent((prev) => ({
      ...prev,
      [sectionId]: content,
    }));
  };

  const handleContentBlur = async (sectionId: number) => {
    const newContent = editingContent[sectionId] || '';
    const section = sections.find((s) => s.id === sectionId);

    if (!section || section.content === newContent) {
      return;
    }

    try {
      await performanceService.updateSection(sectionId, { content: newContent });
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, content: newContent } : s))
      );
      onSectionUpdate?.(sectionId, newContent);
    } catch (err) {
      console.error('Failed to update section:', err);
      // Восстанавливаем предыдущее значение
      setEditingContent((prev) => ({
        ...prev,
        [sectionId]: section.content || '',
      }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-lg text-red-400">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  // Группируем секции по типу для быстрого доступа
  const sectionsByType = sections.reduce((acc, section) => {
    acc[section.sectionType] = section;
    return acc;
  }, {} as Record<string, PerformanceSection>);

  return (
    <div className="relative">
      {/* Фиолетовый blur эффект для модуля спектаклей */}
      <div className="absolute inset-0 bg-purple-500/5 blur-3xl rounded-3xl -z-10" />

      <Accordion defaultValue={['scenery']}>
        {PASSPORT_SECTIONS.map((config) => {
          const section = sectionsByType[config.type];
          const Icon = config.icon;

          return (
            <AccordionItem key={config.type} value={config.type}>
              <AccordionHeader icon={<Icon className="w-5 h-5" />}>
                {config.title}
              </AccordionHeader>
              <AccordionContent>
                {section ? (
                  editable ? (
                    <textarea
                      value={editingContent[section.id] ?? section.content ?? ''}
                      onChange={(e) => handleContentChange(section.id, e.target.value)}
                      onBlur={() => handleContentBlur(section.id)}
                      placeholder={config.placeholder}
                      rows={6}
                      className={`
                        w-full px-4 py-3 rounded-lg
                        bg-[#0F1419] border border-[#D4A574]/20
                        text-[#F1F5F9] placeholder:text-[#64748B]
                        font-['Inter'] text-sm
                        focus:outline-none focus:ring-2 focus:ring-[#D4A574]/50 focus:border-[#D4A574]
                        transition-colors resize-none
                      `}
                    />
                  ) : (
                    <div className="p-4 bg-[#0F1419] rounded-lg border border-[#D4A574]/10">
                      <p className="text-[#94A3B8] text-sm whitespace-pre-wrap">
                        {section.content || (
                          <span className="text-[#64748B] italic">
                            Содержимое не заполнено
                          </span>
                        )}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="p-4 bg-[#0F1419] rounded-lg border border-[#D4A574]/10">
                    <p className="text-[#64748B] text-sm italic">
                      Раздел не создан. Обратитесь к администратору.
                    </p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

export default TechnicalPassport;
