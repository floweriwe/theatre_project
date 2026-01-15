import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input, Card, Alert } from '../../components/ui';

interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { id: 'length', label: 'Минимум 8 символов', test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'Заглавная буква (A-Z, А-Я)', test: (p) => /[A-ZА-ЯЁ]/.test(p) },
  { id: 'lowercase', label: 'Строчная буква (a-z, а-я)', test: (p) => /[a-zа-яё]/.test(p) },
  { id: 'number', label: 'Цифра (0-9)', test: (p) => /\d/.test(p) },
];

/**
 * Страница сброса пароля.
 * Пользователь создаёт новый пароль после перехода по ссылке из email.
 */
export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  // Проверка токена при загрузке
  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setIsTokenValid(false);
        setIsCheckingToken(false);
        return;
      }

      // Имитация проверки токена
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Для демонстрации: токен "expired" считается недействительным
      if (token === 'expired') {
        setIsTokenValid(false);
      }
      
      setIsCheckingToken(false);
    };

    checkToken();
  }, [token]);

  const allRequirementsMet = passwordRequirements.every(req => req.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!allRequirementsMet) {
      setError('Пароль не соответствует требованиям');
      return;
    }

    if (!passwordsMatch) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);

    // Имитация API запроса
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsLoading(false);
    setIsSuccess(true);

    // Перенаправление на страницу входа через 3 секунды
    setTimeout(() => {
      navigate('/login', { state: { message: 'Пароль успешно изменён. Войдите с новым паролем.' } });
    }, 3000);
  };

  // Проверка токена
  if (isCheckingToken) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #0f0a1a 0%, #1a1225 100%)' }}
      >
        <Card variant="elevated" className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-white/60">Проверка ссылки...</p>
        </Card>
      </div>
    );
  }

  // Недействительный токен
  if (!isTokenValid) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(180deg, #0f0a1a 0%, #1a1225 100%)' }}
      >
        <Card variant="elevated" className="p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            Ссылка недействительна
          </h2>
          
          <p className="text-white/60 mb-6">
            Ссылка для сброса пароля истекла или была использована ранее. 
            Запросите новую ссылку.
          </p>

          <div className="space-y-3">
            <Link to="/forgot-password">
              <Button className="w-full">
                Запросить новую ссылку
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" className="w-full">
                Вернуться к входу
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Декоративная левая панель */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1a1625 0%, #2d2640 50%, #3d3456 100%)'
          }}
        />
        
        {/* Декоративные элементы */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border border-amber-400 rounded-full" />
          <div className="absolute top-32 left-32 w-64 h-64 border border-amber-400/50 rounded-full" />
          <div className="absolute bottom-20 right-20 w-96 h-96 border border-amber-400/30 rounded-full" />
        </div>

        {/* Контент левой панели */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)' }}
              >
                🎭
              </div>
              <span className="text-2xl font-bold">Theatre</span>
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Создайте<br />
            <span className="text-amber-400">новый пароль</span>
          </h1>
          
          <p className="text-lg text-white/70 mb-8 max-w-md">
            Придумайте надёжный пароль, который вы будете использовать для входа в систему.
          </p>

          {/* Советы по паролю */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-white/60">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-sm">
                <div className="text-white">Используйте уникальный пароль</div>
                <div>Не используйте пароль от других сервисов</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-white/60">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-sm">
                <div className="text-white">Храните пароль в безопасности</div>
                <div>Используйте менеджер паролей</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Правая панель с формой */}
      <div 
        className="flex-1 flex items-center justify-center p-8"
        style={{ background: 'linear-gradient(180deg, #0f0a1a 0%, #1a1225 100%)' }}
      >
        <div className="w-full max-w-md">
          {/* Мобильный логотип */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)' }}
            >
              🎭
            </div>
            <span className="text-xl font-bold text-white">Theatre</span>
          </div>

          <Card variant="elevated" className="p-8">
            {!isSuccess ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Новый пароль
                  </h2>
                  <p className="text-white/60">
                    Создайте надёжный пароль для вашего аккаунта
                  </p>
                </div>

                {error && (
                  <Alert variant="error" className="mb-6">
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Новый пароль */}
                  <div>
                    <div className="relative">
                      <Input
                        label="Новый пароль"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-white/40 hover:text-white/60"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Требования к паролю */}
                    {password.length > 0 && (
                      <div className="mt-3 p-3 rounded-lg bg-white/5 space-y-2">
                        {passwordRequirements.map((req) => {
                          const passed = req.test(password);
                          return (
                            <div 
                              key={req.id}
                              className={`flex items-center gap-2 text-sm transition-colors ${
                                passed ? 'text-green-400' : 'text-white/40'
                              }`}
                            >
                              {passed ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M12 8v4m0 4h.01" />
                                </svg>
                              )}
                              {req.label}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Подтверждение пароля */}
                  <div className="relative">
                    <Input
                      label="Подтвердите пароль"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      error={
                        confirmPassword.length > 0 && !passwordsMatch 
                          ? 'Пароли не совпадают' 
                          : undefined
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-9 text-white/40 hover:text-white/60"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>

                    {/* Индикатор совпадения */}
                    {confirmPassword.length > 0 && passwordsMatch && (
                      <div className="absolute right-10 top-9 text-green-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={isLoading}
                    disabled={!allRequirementsMet || !passwordsMatch}
                  >
                    Сохранить новый пароль
                  </Button>
                </form>
              </>
            ) : (
              /* Успешная смена пароля */
              <div className="text-center py-4">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-3">
                  Пароль изменён!
                </h2>
                
                <p className="text-white/60 mb-6">
                  Ваш пароль успешно обновлён. Сейчас вы будете перенаправлены на страницу входа.
                </p>

                <div className="flex items-center justify-center gap-2 text-white/40">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Перенаправление...</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
