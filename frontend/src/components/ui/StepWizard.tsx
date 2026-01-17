/**
 * StepWizard — Пошаговый визард/мастер
 * Modern Theatre Elegance v3
 *
 * Горизонтальный stepper для многошаговых форм.
 */

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/helpers';

// =============================================================================
// Types
// =============================================================================

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface StepWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowClickPrevious?: boolean;
  allowClickNext?: boolean;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function StepWizard({
  steps,
  currentStep,
  onStepClick,
  allowClickPrevious = true,
  allowClickNext = false,
  className,
}: StepWizardProps) {
  const handleStepClick = (index: number) => {
    if (!onStepClick) return;

    if (index < currentStep && allowClickPrevious) {
      onStepClick(index);
    } else if (index > currentStep && allowClickNext) {
      onStepClick(index);
    }
  };

  const isClickable = (index: number) => {
    if (!onStepClick) return false;
    if (index < currentStep && allowClickPrevious) return true;
    if (index > currentStep && allowClickNext) return true;
    return false;
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;
          const clickable = isClickable(index);

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div
                className={cn(
                  'flex items-center',
                  clickable && 'cursor-pointer group'
                )}
                onClick={() => handleStepClick(index)}
              >
                {/* Circle */}
                <div
                  className={cn(
                    'relative flex items-center justify-center',
                    'w-10 h-10 rounded-full border-2 transition-all duration-300',
                    isCompleted && 'bg-gold-300 border-gold-300',
                    isCurrent && 'bg-gold-300/10 border-gold-300',
                    !isCompleted && !isCurrent && 'bg-bg-surface border-border-default',
                    clickable && 'group-hover:border-gold-300/50'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-bg-base" />
                  ) : step.icon ? (
                    <span className={cn(
                      isCurrent ? 'text-gold-300' : 'text-text-muted'
                    )}>
                      {step.icon}
                    </span>
                  ) : (
                    <span className={cn(
                      'text-sm font-semibold',
                      isCurrent ? 'text-gold-300' : 'text-text-muted'
                    )}>
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div className="ml-3">
                  <p className={cn(
                    'text-sm font-medium transition-colors',
                    isCurrent ? 'text-gold-300' : 'text-text-primary',
                    clickable && 'group-hover:text-gold-300'
                  )}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-4">
                  <div
                    className={cn(
                      'h-0.5 rounded-full transition-colors duration-300',
                      isCompleted ? 'bg-gold-300' : 'bg-border-default'
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Step Navigation Buttons
// =============================================================================

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onFinish?: () => void;
  previousLabel?: string;
  nextLabel?: string;
  finishLabel?: string;
  isNextDisabled?: boolean;
  isFinishDisabled?: boolean;
  className?: string;
}

export function StepNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onFinish,
  previousLabel = 'Назад',
  nextLabel = 'Далее',
  finishLabel = 'Завершить',
  isNextDisabled = false,
  isFinishDisabled = false,
  className,
}: StepNavigationProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstStep}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
          'border border-border-default text-text-primary',
          'hover:bg-bg-surface-hover hover:border-border-strong',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {previousLabel}
      </button>

      <div className="text-sm text-text-muted">
        Шаг {currentStep + 1} из {totalSteps}
      </div>

      {isLastStep && onFinish ? (
        <button
          type="button"
          onClick={onFinish}
          disabled={isFinishDisabled}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            'bg-gold-300 text-bg-base',
            'hover:bg-gold-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {finishLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            'bg-gold-300 text-bg-base',
            'hover:bg-gold-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}

export default StepWizard;
