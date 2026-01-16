import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Card } from '../../components/ui';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired';

/**
 * Страница верификации email.
 * Пользователь переходит сюда по ссылке из письма для подтверждения email.
 */
export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        return;
      }

      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Для демонстрации: разные токены = разные статусы
      if (token === 'expired') {
        setStatus('expired');
      } else if (token === 'invalid') {
        setStatus('error');
      } else {
        setStatus('success');
      }
    };

    verifyEmail();
  }, [token]);

  const handleResendEmail = async () => {
    setResendLoading(true);
    
    // Имитация API запроса
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setResendLoading(false);
    setResendSuccess(true);
  };

  const handleGoToLogin = () => {
    navigate('/login', { state: { message: 'Email успешно подтверждён! Войдите в систему.' } });
  };

  // Состояние загрузки
  if (status === 'loading') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #0f0a1a 0%, #1a1225 100%)' }}
      >
        <Card variant="elevated" className="p-12 text-center max-w-md w-full mx-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-text-primary mb-3">
            Проверяем ссылку...
          </h2>
          <p className="text-white/60">
            Пожалуйста, подождите
          </p>
        </Card>
      </div>
    );
  }

  // Успешная верификация
  if (status === 'success') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #0f0a1a 0%, #1a1225 100%)' }}
      >
        <Card variant="elevated" className="p-12 text-center max-w-md w-full mx-4">
          {/* Анимированная галочка */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full border-2 border-green-400/30 animate-ping" />
            <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-text-primary mb-3">
            Email подтверждён!
          </h2>
          
          <p className="text-white/60 mb-8">
            Спасибо за подтверждение. Теперь вы можете войти в систему и начать работу.
          </p>

          {/* Что доступно */}
          <div className="bg-white/5 rounded-xl p-4 mb-8 text-left">
            <h4 className="text-text-primary font-medium mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Теперь вам доступно:
            </h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Полный доступ к системе
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Уведомления на email
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Восстановление пароля
              </li>
            </ul>
          </div>

          <Button onClick={handleGoToLogin} className="w-full" size="lg">
            Войти в систему
          </Button>
        </Card>
      </div>
    );
  }

  // Истёкшая ссылка
  if (status === 'expired') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #0f0a1a 0%, #1a1225 100%)' }}
      >
        <Card variant="elevated" className="p-12 text-center max-w-md w-full mx-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-text-primary mb-3">
            Ссылка устарела
          </h2>
          
          <p className="text-white/60 mb-6">
            Срок действия ссылки истёк. Ссылки для подтверждения действительны 24 часа.
          </p>

          {resendSuccess ? (
            <div className="bg-green-500/10 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-green-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Письмо отправлено!</span>
              </div>
              <p className="text-white/60 text-sm mt-2">
                Проверьте вашу почту для подтверждения
              </p>
            </div>
          ) : (
            <Button 
              onClick={handleResendEmail} 
              className="w-full mb-4"
              loading={resendLoading}
            >
              Отправить новую ссылку
            </Button>
          )}

          <Link to="/login">
            <Button variant="ghost" className="w-full">
              Вернуться к входу
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Ошибка верификации
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0f0a1a 0%, #1a1225 100%)' }}
    >
      <Card variant="elevated" className="p-12 text-center max-w-md w-full mx-4">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-text-primary mb-3">
          Ошибка подтверждения
        </h2>
        
        <p className="text-white/60 mb-6">
          Не удалось подтвердить email. Ссылка недействительна или была использована ранее.
        </p>

        <div className="space-y-3">
          {resendSuccess ? (
            <div className="bg-green-500/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Новое письмо отправлено!</span>
              </div>
            </div>
          ) : (
            <Button 
              onClick={handleResendEmail} 
              className="w-full"
              loading={resendLoading}
            >
              Отправить повторно
            </Button>
          )}
          
          <Link to="/login">
            <Button variant="outline" className="w-full">
              Вернуться к входу
            </Button>
          </Link>
          
          <Link to="/support" className="block text-center">
            <span className="text-amber-400 hover:text-amber-300 text-sm">
              Связаться с поддержкой
            </span>
          </Link>
        </div>
      </Card>
    </div>
  );
};

/**
 * Страница ожидания подтверждения email.
 * Показывается после регистрации до подтверждения email.
 */
export const EmailVerificationPendingPage: React.FC = () => {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Cooldown таймер
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [resendCooldown]);

  const handleResend = async () => {
    setResendLoading(true);
    
    // Имитация API запроса
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setResendLoading(false);
    setResendSuccess(true);
    setResendCooldown(60); // 60 секунд до следующей отправки
    
    // Сбросить успех через 3 секунды
    setTimeout(() => setResendSuccess(false), 3000);
  };

  // Получаем email из localStorage (в реальном приложении - из контекста/состояния)
  const userEmail = localStorage.getItem('pendingVerificationEmail') || 'your@email.com';

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(180deg, #0f0a1a 0%, #1a1225 100%)' }}
    >
      <Card variant="elevated" className="p-8 max-w-lg w-full">
        <div className="text-center">
          {/* Иконка письма */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center relative">
            <svg className="w-12 h-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
            {/* Бейдж */}
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-3">
            Подтвердите email
          </h1>
          
          <p className="text-white/60 mb-2">
            Мы отправили письмо на адрес:
          </p>
          <p className="text-amber-400 font-medium text-lg mb-6">
            {userEmail}
          </p>

          {/* Инструкции */}
          <div className="bg-white/5 rounded-xl p-5 mb-6 text-left">
            <h4 className="text-text-primary font-medium mb-3">Что делать:</h4>
            <ol className="space-y-3 text-white/60">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-medium">
                  1
                </span>
                <span>Откройте письмо от Theatre в вашей почте</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-medium">
                  2
                </span>
                <span>Нажмите кнопку «Подтвердить email»</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-medium">
                  3
                </span>
                <span>Войдите в систему и начните работу</span>
              </li>
            </ol>
          </div>

          {/* Статус повторной отправки */}
          {resendSuccess && (
            <div className="bg-green-500/10 rounded-lg p-3 mb-4 flex items-center gap-2 justify-center text-green-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Письмо отправлено повторно!</span>
            </div>
          )}

          {/* Кнопка повторной отправки */}
          <Button 
            variant="outline" 
            className="w-full mb-4"
            onClick={handleResend}
            loading={resendLoading}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0 
              ? `Отправить повторно (${resendCooldown}с)` 
              : 'Отправить письмо повторно'
            }
          </Button>

          {/* Подсказка */}
          <p className="text-white/40 text-sm mb-6">
            Не видите письмо? Проверьте папку «Спам»
          </p>

          {/* Ссылки */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <button 
              onClick={() => {
                // В реальном приложении - открыть модал смены email
                alert('Функция смены email');
              }}
              className="text-amber-400 hover:text-amber-300"
            >
              Изменить email
            </button>
            <span className="text-white/20">•</span>
            <Link to="/login" className="text-white/60 hover:text-text-primary">
              Войти в другой аккаунт
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
