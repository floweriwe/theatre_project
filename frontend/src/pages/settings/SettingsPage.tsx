/**
 * Страница настроек — Modern Theatre Elegance v3.
 * 
 * Персонализация приложения с элегантным дизайном.
 * Тёмная тема.
 */

import React, { useState } from 'react';
import { 
  Palette,
  Globe,
  Bell,
  Shield,
  Database,
  Monitor,
  Moon,
  Sun,
  Check,
  Info,
  Volume2,
  VolumeX,
  Mail,
  Smartphone,
  Settings,
} from 'lucide-react';
import { Card, Badge, Alert, Button } from '@/components/ui';
import { cn } from '@/utils/helpers';

// =============================================================================
// Types and Data
// =============================================================================

interface SettingSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const sections: SettingSection[] = [
  { id: 'appearance', title: 'Внешний вид', icon: <Palette className="w-5 h-5" />, description: 'Тема, цвета, шрифты' },
  { id: 'language', title: 'Язык и регион', icon: <Globe className="w-5 h-5" />, description: 'Локализация и форматы' },
  { id: 'notifications', title: 'Уведомления', icon: <Bell className="w-5 h-5" />, description: 'Настройки оповещений' },
  { id: 'privacy', title: 'Конфиденциальность', icon: <Shield className="w-5 h-5" />, description: 'Безопасность данных' },
  { id: 'data', title: 'Данные', icon: <Database className="w-5 h-5" />, description: 'Экспорт и хранилище' },
];

const themes = [
  { id: 'dark', name: 'Тёмная', icon: <Moon className="w-5 h-5" />, current: true },
  { id: 'light', name: 'Светлая', icon: <Sun className="w-5 h-5" />, current: false, badge: 'скоро' },
  { id: 'system', name: 'Системная', icon: <Monitor className="w-5 h-5" />, current: false, badge: 'скоро' },
];

const languages = [
  { id: 'ru', name: 'Русский', flag: '🇷🇺', current: true },
  { id: 'en', name: 'English', flag: '🇬🇧', current: false },
  { id: 'de', name: 'Deutsch', flag: '🇩🇪', current: false },
];

// =============================================================================
// Toggle Component
// =============================================================================

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors',
        checked ? 'bg-gold-300' : 'bg-bg-surface-hover',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div
        className={cn(
          'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

// =============================================================================
// Setting Item Component
// =============================================================================

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingItem({ icon, title, description, children }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-bg-surface-hover">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-gold-300/10 flex items-center justify-center text-gold-300">
          {icon}
        </div>
        <div>
          <p className="font-medium text-white">{title}</p>
          <p className="text-sm text-text-muted">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState('appearance');
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [currentLanguage, setCurrentLanguage] = useState('ru');
  const [showSavedAlert, setShowSavedAlert] = useState(false);
  
  // Notification settings
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [soundNotifs, setSoundNotifs] = useState(true);
  const [scheduleNotifs, setScheduleNotifs] = useState(true);
  const [documentNotifs, setDocumentNotifs] = useState(true);

  const handleSave = () => {
    setShowSavedAlert(true);
    setTimeout(() => setShowSavedAlert(false), 3000);
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="space-y-8">
            {/* Тема */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Moon className="w-5 h-5 text-gold-300" />
                Тема оформления
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {themes.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => !theme.badge && setCurrentTheme(theme.id)}
                    disabled={!!theme.badge}
                    className={cn(
                      'relative p-5 rounded-xl border-2 transition-all',
                      currentTheme === theme.id
                        ? 'border-gold-300 bg-gold-300/10'
                        : theme.badge 
                          ? 'border-border-subtle bg-bg-surface opacity-60 cursor-not-allowed'
                          : 'border-border-subtle bg-bg-surface hover:border-border-default'
                    )}
                  >
                    {/* Чекмарк */}
                    {currentTheme === theme.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gold-300 flex items-center justify-center">
                        <Check className="w-4 h-4 text-bg-base" />
                      </div>
                    )}
                    
                    {/* Badge для недоступных */}
                    {theme.badge && (
                      <Badge variant="default" size="sm" className="absolute top-3 right-3">
                        {theme.badge}
                      </Badge>
                    )}
                    
                    <div className="flex flex-col items-center gap-3">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        currentTheme === theme.id 
                          ? 'bg-gold-300/20 text-gold-300' 
                          : 'bg-bg-surface-hover text-text-secondary'
                      )}>
                        {theme.icon}
                      </div>
                      <span className={cn(
                        'font-medium',
                        currentTheme === theme.id ? 'text-gold-300' : 'text-white'
                      )}>
                        {theme.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Акцентный цвет */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-gold-300" />
                Акцентный цвет
              </h3>
              <div className="flex gap-3">
                {['#D4A574', '#F59E0B', '#8B5CF6', '#10B981', '#3B82F6'].map(color => (
                  <button
                    key={color}
                    className={cn(
                      'w-10 h-10 rounded-xl transition-transform hover:scale-110',
                      color === '#D4A574' && 'ring-2 ring-white ring-offset-2 ring-offset-bg-surface'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="text-sm text-text-muted mt-2">
                <Info className="w-4 h-4 inline mr-1" />
                Изменение акцентного цвета будет доступно в следующем обновлении
              </p>
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-gold-300" />
              Язык интерфейса
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {languages.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setCurrentLanguage(lang.id)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-left',
                    currentLanguage === lang.id
                      ? 'border-gold-300 bg-gold-300/10'
                      : 'border-border-subtle bg-bg-surface hover:border-border-default'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <p className={cn(
                        'font-medium',
                        currentLanguage === lang.id ? 'text-gold-300' : 'text-white'
                      )}>
                        {lang.name}
                      </p>
                      {currentLanguage === lang.id && (
                        <p className="text-xs text-text-muted">Текущий язык</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-gold-300" />
              Каналы уведомлений
            </h3>
            
            <SettingItem
              icon={<Mail className="w-5 h-5" />}
              title="Email уведомления"
              description="Получать важные оповещения на почту"
            >
              <Toggle checked={emailNotifs} onChange={setEmailNotifs} />
            </SettingItem>

            <SettingItem
              icon={<Smartphone className="w-5 h-5" />}
              title="Push уведомления"
              description="Уведомления в браузере"
            >
              <Toggle checked={pushNotifs} onChange={setPushNotifs} />
            </SettingItem>

            <SettingItem
              icon={soundNotifs ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              title="Звуковые уведомления"
              description="Звуковой сигнал при новых событиях"
            >
              <Toggle checked={soundNotifs} onChange={setSoundNotifs} />
            </SettingItem>

            <div className="border-t border-border-subtle my-6" />

            <h3 className="text-lg font-semibold text-white mb-4">Типы уведомлений</h3>

            <SettingItem
              icon={<Bell className="w-5 h-5" />}
              title="Изменения в расписании"
              description="Репетиции и спектакли"
            >
              <Toggle checked={scheduleNotifs} onChange={setScheduleNotifs} />
            </SettingItem>

            <SettingItem
              icon={<Database className="w-5 h-5" />}
              title="Новые документы"
              description="Загрузка и обновление файлов"
            >
              <Toggle checked={documentNotifs} onChange={setDocumentNotifs} />
            </SettingItem>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-gold-300" />
              Безопасность
            </h3>
            
            <div className="p-4 rounded-xl bg-bg-surface-hover border border-border-subtle">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-white">Двухфакторная аутентификация</p>
                  <p className="text-sm text-text-muted">Дополнительный уровень защиты аккаунта</p>
                </div>
                <Badge variant="warning">Отключено</Badge>
              </div>
              <Button variant="secondary" size="sm">Настроить</Button>
            </div>

            <div className="p-4 rounded-xl bg-bg-surface-hover border border-border-subtle">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-white">Активные сессии</p>
                  <p className="text-sm text-text-muted">1 активная сессия (текущая)</p>
                </div>
              </div>
              <Button variant="secondary" size="sm">Управление сессиями</Button>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-gold-300" />
              Управление данными
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-bg-surface-hover border border-border-subtle">
                <h4 className="font-medium text-white mb-2">Экспорт данных</h4>
                <p className="text-sm text-text-muted mb-4">
                  Скачать все ваши данные в формате JSON
                </p>
                <Button variant="secondary" size="sm">Экспортировать</Button>
              </div>

              <div className="p-4 rounded-xl bg-bg-surface-hover border border-border-subtle">
                <h4 className="font-medium text-white mb-2">Очистить кэш</h4>
                <p className="text-sm text-text-muted mb-4">
                  Освободить локальное хранилище браузера
                </p>
                <Button variant="secondary" size="sm">Очистить</Button>
              </div>
            </div>

            <Alert variant="info">
              Использовано 45 МБ из 100 МБ доступного хранилища
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Уведомление об успешном сохранении */}
      {showSavedAlert && (
        <Alert variant="success" onClose={() => setShowSavedAlert(false)}>
          Настройки успешно сохранены
        </Alert>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-elevated via-bg-elevated to-bg-surface p-8 lg:p-10">
        {/* Декоративные элементы */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold-300/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold-300/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5 text-gold-300" />
            <span className="text-sm text-gold-300 font-medium">Персонализация</span>
          </div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-white mb-2">
            Настройки
          </h1>
          <p className="text-text-secondary text-lg">
            Настройте приложение под себя
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Боковое меню */}
        <Card noPadding className="lg:col-span-1 h-fit">
          <nav className="p-2">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left',
                  activeSection === section.id
                    ? 'bg-gold-300/10 text-gold-300'
                    : 'text-text-secondary hover:bg-bg-surface-hover hover:text-white'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  activeSection === section.id 
                    ? 'bg-gold-300/10' 
                    : 'bg-bg-surface-hover'
                )}>
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{section.title}</p>
                  <p className="text-xs text-text-muted truncate">{section.description}</p>
                </div>
              </button>
            ))}
          </nav>
        </Card>

        {/* Контент */}
        <Card className="lg:col-span-3">
          {renderSectionContent()}
          
          {/* Кнопка сохранения */}
          <div className="flex justify-end mt-8 pt-6 border-t border-border-subtle">
            <Button variant="primary" onClick={handleSave}>
              Сохранить изменения
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default SettingsPage;
