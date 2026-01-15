import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card, Alert } from '../../components/ui';

/**
 * Страница запроса восстановления пароля.
 * Пользователь вводит email для получения ссылки сброса.
 */
export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Введите email');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError('Некорректный формат email');
      return;
    }

    setIsLoading(true);
    
    // Имитация API запроса
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setIsSubmitted(true);
  };

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
            Забыли пароль?<br />
            <span className="text-amber-400">Не беда!</span>
          </h1>
          
          <p className="text-lg text-white/70 mb-8 max-w-md">
            Мы поможем вам восстановить доступ к аккаунту. 
            Просто введите email, и мы отправим инструкции.
          </p>

          {/* Иконка ключа */}
          <div className="flex items-center gap-4 text-white/60">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-medium">Безопасный сброс</div>
              <div className="text-sm">Ссылка действует 1 час</div>
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
            {!isSubmitted ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Восстановление пароля
                  </h2>
                  <p className="text-white/60">
                    Введите email, указанный при регистрации
                  </p>
                </div>

                {error && (
                  <Alert variant="error" className="mb-6">
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    }
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={isLoading}
                  >
                    Отправить инструкции
                  </Button>
                </form>

                <div className="mt-8 text-center">
                  <Link 
                    to="/login" 
                    className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Вернуться к входу
                  </Link>
                </div>
              </>
            ) : (
              /* Успешная отправка */
              <div className="text-center py-4">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-3">
                  Проверьте почту
                </h2>
                
                <p className="text-white/60 mb-2">
                  Мы отправили инструкции на:
                </p>
                <p className="text-amber-400 font-medium mb-6">
                  {email}
                </p>
                
                <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                  <h4 className="text-white font-medium mb-2">Что делать дальше:</h4>
                  <ul className="text-white/60 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">1.</span>
                      Откройте письмо от Theatre
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">2.</span>
                      Нажмите на ссылку восстановления
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">3.</span>
                      Создайте новый пароль
                    </li>
                  </ul>
                </div>

                <p className="text-white/40 text-sm mb-6">
                  Не получили письмо? Проверьте папку «Спам» или{' '}
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="text-amber-400 hover:text-amber-300"
                  >
                    попробуйте снова
                  </button>
                </p>

                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Вернуться к входу
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
