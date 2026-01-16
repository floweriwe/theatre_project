/**
 * Страница 404 — Modern Theatre Elegance v3.
 * 
 * Элегантная страница ошибки с театральной тематикой.
 * Тёмная тема.
 */

import { Link } from 'react-router-dom';
import {
  Home,
  ArrowLeft,
  Theater,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { ROUTES } from '@/utils/constants';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Декоративные элементы */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 bg-gold-300/5 rounded-full blur-3xl" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 bg-purple-500/5 rounded-full blur-2xl translate-x-12 -translate-y-8" />
          </div>
          
          {/* 404 Number */}
          <div className="relative">
            <h1 className="font-display text-[10rem] md:text-[14rem] font-bold text-transparent bg-clip-text bg-gradient-to-b from-gold-300/30 to-gold-300/5 leading-none select-none">
              404
            </h1>
            
            {/* Theater Mask Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-6 bg-bg-elevated/80 backdrop-blur-sm rounded-full border border-border-subtle shadow-2xl">
                <Theater className="w-16 h-16 text-gold-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-4 mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
            Занавес опущен
          </h2>
          <p className="text-text-secondary text-lg max-w-md mx-auto">
            Кажется, этой сцены нет в нашем репертуаре. 
            Страница, которую вы ищете, не существует или была перемещена.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <Link to={ROUTES.DASHBOARD}>
            <Button variant="primary" size="lg" leftIcon={<Home className="w-5 h-5" />}>
              На главную
            </Button>
          </Link>
          
          <Button 
            variant="secondary" 
            size="lg" 
            leftIcon={<ArrowLeft className="w-5 h-5" />}
            onClick={() => window.history.back()}
          >
            Назад
          </Button>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t border-border-subtle">
          <p className="text-sm text-text-muted mb-4">Возможно, вы искали:</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link 
              to={ROUTES.INVENTORY}
              className="px-4 py-2 bg-bg-surface hover:bg-bg-surface-hover border border-border-subtle rounded-lg text-text-secondary hover:text-white transition-colors text-sm"
            >
              Инвентарь
            </Link>
            <Link 
              to={ROUTES.DOCUMENTS}
              className="px-4 py-2 bg-bg-surface hover:bg-bg-surface-hover border border-border-subtle rounded-lg text-text-secondary hover:text-white transition-colors text-sm"
            >
              Документы
            </Link>
            <Link 
              to={ROUTES.PERFORMANCES}
              className="px-4 py-2 bg-bg-surface hover:bg-bg-surface-hover border border-border-subtle rounded-lg text-text-secondary hover:text-white transition-colors text-sm"
            >
              Спектакли
            </Link>
            <Link 
              to={ROUTES.SCHEDULE}
              className="px-4 py-2 bg-bg-surface hover:bg-bg-surface-hover border border-border-subtle rounded-lg text-text-secondary hover:text-white transition-colors text-sm"
            >
              Расписание
            </Link>
            <Link 
              to={ROUTES.HELP}
              className="px-4 py-2 bg-bg-surface hover:bg-bg-surface-hover border border-border-subtle rounded-lg text-text-secondary hover:text-white transition-colors text-sm flex items-center gap-1"
            >
              <HelpCircle className="w-4 h-4" />
              Помощь
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-text-muted">
          Если вы считаете, что это ошибка, пожалуйста, 
          <Link to={ROUTES.HELP} className="text-gold-300 hover:underline ml-1">
            свяжитесь с поддержкой
          </Link>
        </p>
      </div>
    </div>
  );
}

export default NotFoundPage;
