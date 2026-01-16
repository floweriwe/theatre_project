/**
 * Страница справки и помощи — Modern Theatre Elegance v3
 */

import { useState } from 'react';
import {
  HelpCircle,
  Search,
  Book,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Package,
  FileText,
  Calendar,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export function HelpPage() {
  const [search, setSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      id: 1,
      question: 'Как добавить новый предмет в инвентарь?',
      answer: 'Перейдите в раздел "Инвентарь" и нажмите кнопку "Добавить". Заполните необходимые поля: название, категорию, местоположение и количество. После сохранения предмет появится в общем списке.',
      category: 'inventory',
    },
    {
      id: 2,
      question: 'Как создать документ?',
      answer: 'В разделе "Документы" нажмите "Добавить документ". Выберите файл для загрузки, укажите категорию и при необходимости привяжите к спектаклю. Поддерживаются форматы PDF, DOCX, XLSX и изображения.',
      category: 'documents',
    },
    {
      id: 3,
      question: 'Как добавить событие в расписание?',
      answer: 'Откройте раздел "Расписание" и нажмите на нужную дату в календаре или кнопку "Добавить событие". Укажите тип события (спектакль, репетиция, техническая работа), время и место проведения.',
      category: 'schedule',
    },
    {
      id: 4,
      question: 'Как изменить права доступа пользователя?',
      answer: 'Перейдите в раздел "Администрирование" → "Пользователи". Найдите нужного пользователя и откройте его профиль. В разделе "Роль" выберите соответствующий уровень доступа.',
      category: 'users',
    },
    {
      id: 5,
      question: 'Как зарезервировать инвентарь для спектакля?',
      answer: 'Откройте карточку предмета инвентаря и нажмите "Зарезервировать". Выберите спектакль и даты использования. Зарезервированные предметы будут отмечены соответствующим статусом.',
      category: 'inventory',
    },
    {
      id: 6,
      question: 'Как экспортировать отчёт?',
      answer: 'В разделе "Отчёты" выберите нужный период и тип данных. Нажмите кнопку "Экспорт" и выберите формат (PDF или Excel). Файл будет автоматически загружен.',
      category: 'reports',
    },
  ];

  const quickLinks = [
    { icon: Package, title: 'Инвентарь', description: 'Управление реквизитом и костюмами', href: '/inventory' },
    { icon: FileText, title: 'Документы', description: 'Документооборот театра', href: '/documents' },
    { icon: Calendar, title: 'Расписание', description: 'Календарь событий', href: '/schedule' },
    { icon: Users, title: 'Пользователи', description: 'Управление доступом', href: '/admin/users' },
  ];

  const filteredFaq = faqItems.filter(item =>
    item.question.toLowerCase().includes(search.toLowerCase()) ||
    item.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-light to-surface p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-4">
            Центр помощи
          </h1>
          <p className="text-text-secondary mb-6">
            Найдите ответы на часто задаваемые вопросы или свяжитесь с поддержкой
          </p>
          
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <Input
              placeholder="Поиск по справке..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 py-3"
            />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <a key={link.href} href={link.href}>
            <Card className="p-4 hover:border-gold/30 transition-colors cursor-pointer h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <link.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">{link.title}</h3>
                  <p className="text-sm text-text-muted">{link.description}</p>
                </div>
              </div>
            </Card>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQ */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Book className="w-5 h-5 text-text-muted" />
              Часто задаваемые вопросы
            </h2>
            
            <div className="space-y-2">
              {filteredFaq.length === 0 ? (
                <div className="text-center py-8">
                  <HelpCircle className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-muted">Ничего не найдено</p>
                </div>
              ) : (
                filteredFaq.map((item) => (
                  <div
                    key={item.id}
                    className="border border-white/5 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                    >
                      <span className="font-medium text-white pr-4">{item.question}</span>
                      {expandedFaq === item.id ? (
                        <ChevronUp className="w-5 h-5 text-text-muted flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-text-muted flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === item.id && (
                      <div className="px-4 pb-4">
                        <p className="text-text-secondary">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Contact */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-text-muted" />
              Связаться с нами
            </h2>
            
            <div className="space-y-4">
              <a
                href="mailto:support@theatre.test"
                className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-white/5 transition-colors"
              >
                <Mail className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white">Email поддержки</p>
                  <p className="text-sm text-text-muted">support@theatre.test</p>
                </div>
              </a>
              
              <a
                href="tel:+74951234567"
                className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-white/5 transition-colors"
              >
                <Phone className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-white">Телефон</p>
                  <p className="text-sm text-text-muted">+7 (495) 123-45-67</p>
                </div>
              </a>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">Полезные ссылки</h2>
            
            <div className="space-y-2">
              <a
                href="#"
                className="flex items-center justify-between p-2 text-text-secondary hover:text-white transition-colors"
              >
                <span>Документация API</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="flex items-center justify-between p-2 text-text-secondary hover:text-white transition-colors"
              >
                <span>Руководство пользователя</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="flex items-center justify-between p-2 text-text-secondary hover:text-white transition-colors"
              >
                <span>Обновления системы</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default HelpPage;
