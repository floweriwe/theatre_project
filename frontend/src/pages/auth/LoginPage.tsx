/**
 * Страница входа в систему — Modern Theatre Elegance
 * 
 * Элегантная страница авторизации с театральной атмосферой.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/services/api';
import { Button, Input, Alert, Card } from '@/components/ui';
import { ROUTES } from '@/utils/constants';
import type { LoginRequest } from '@/types';

// Схема валидации формы
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Введите email')
    .email('Некорректный формат email'),
  password: z
    .string()
    .min(1, 'Введите пароль')
    .min(6, 'Пароль должен быть не менее 6 символов'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await login(data as LoginRequest);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Левая сторона — декоративная панель */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-primary relative overflow-hidden">
        {/* Фоновый паттерн */}
        <div className="absolute inset-0 pattern-curtain opacity-50" />
        
        {/* Градиентный overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-800 to-primary" />
        
        {/* Декоративные элементы */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />
        
        {/* Контент */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 max-w-2xl">
          {/* Логотип */}
          <div className="flex items-center gap-4 mb-12">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold-lg">
                <svg
                  viewBox="0 0 24 24"
                  className="w-10 h-10 text-primary-900"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M8 14.5c0 1.5 1.5 3 4 3s4-1.5 4-3" />
                  <path d="M9 10h.01M15 10h.01" />
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3c-1.5 2-2 4-2 6 0-2-.5-4-2-6" />
                  <path d="M12 3c1.5 2 2 4 2 6 0-2 .5-4 2-6" />
                </svg>
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-gold animate-pulse-gold" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-bold text-text-primary">
                Theatre
              </h1>
              <p className="text-sm uppercase tracking-widest text-white/40">
                Management System
              </p>
            </div>
          </div>
          
          {/* Описание */}
          <div className="space-y-6">
            <h2 className="font-display text-3xl xl:text-4xl font-semibold text-text-primary leading-tight">
              Современная платформа<br />
              управления театром
            </h2>
            
            <p className="text-lg text-white/60 leading-relaxed">
              Единая система для документооборота, инвентаризации, 
              управления спектаклями и расписанием.
            </p>
            
            {/* Фичи */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              {[
                { title: 'Инвентарь', desc: 'Учёт реквизита и костюмов' },
                { title: 'Документы', desc: 'Централизованный архив' },
                { title: 'Спектакли', desc: 'Паспорта постановок' },
                { title: 'Расписание', desc: 'Календарь событий' },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <h3 className="font-medium text-text-primary mb-1">{feature.title}</h3>
                  <p className="text-sm text-white/50">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Декоративная линия */}
          <div className="absolute bottom-12 left-12 right-12">
            <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          </div>
        </div>
        
        {/* Декоративные театральные занавесы (абстрактно) */}
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-gold/5 to-transparent" />
      </div>

      {/* Правая сторона — форма входа */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-primary">
        {/* Декоративные элементы на правой стороне */}
        <div className="absolute inset-0 lg:left-1/2 xl:left-[55%]">
          <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-gold/5 blur-3xl" />
          <div className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full bg-gold/5 blur-3xl" />
        </div>
        
        <div className="w-full max-w-md relative z-10">
          {/* Мобильный логотип */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                <svg
                  viewBox="0 0 24 24"
                  className="w-7 h-7 text-primary-900"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M8 14.5c0 1.5 1.5 3 4 3s4-1.5 4-3" />
                  <path d="M9 10h.01M15 10h.01" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <div className="text-left">
                <h1 className="font-display text-2xl font-bold text-text-primary">
                  Theatre
                </h1>
              </div>
            </div>
          </div>

          {/* Заголовок */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-text-primary mb-2">
              Добро пожаловать
            </h2>
            <p className="text-white/60">
              Войдите в свой аккаунт для продолжения
            </p>
          </div>

          {/* Карточка формы */}
          <Card variant="elevated" className="p-6 sm:p-8 !bg-surface border-gold/20">
            {/* Ошибка */}
            {error && (
              <Alert
                variant="error"
                onClose={() => setError(null)}
                className="mb-6"
              >
                {error}
              </Alert>
            )}

            {/* Форма */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="example@theatre.ru"
                error={errors.email?.message}
                {...register('email')}
              />

              {/* Пароль */}
              <Input
                label="Пароль"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />

              {/* Запомнить + Забыли пароль */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-surface-300 text-gold focus:ring-gold/30"
                  />
                  <span className="text-text-secondary">Запомнить меня</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-gold hover:text-gold-500 font-medium"
                >
                  Забыли пароль?
                </Link>
              </div>

              {/* Кнопка входа */}
              <Button
                type="submit"
                loading={isLoading}
                fullWidth
                size="lg"
                leftIcon={<LogIn className="w-4 h-4" />}
              >
                Войти в систему
              </Button>
            </form>

            {/* Разделитель */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-sm text-text-muted bg-surface">или</span>
              </div>
            </div>

            {/* Ссылка на регистрацию */}
            <p className="text-center text-sm text-white/60">
              Нет аккаунта?{' '}
              <Link
                to={ROUTES.REGISTER}
                className="text-gold hover:text-gold-light font-medium"
              >
                Создать аккаунт
              </Link>
            </p>
          </Card>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-xl bg-surface border border-gold/20">
            <p className="text-sm text-white/60 mb-2">
              <span className="font-medium text-gold">Демо-доступ:</span>
            </p>
            <p className="text-sm text-white/40 font-mono">
              admin@theatre.test / admin123
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-white/30 mt-8">
            © 2025 Theatre Management System. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  );
}
