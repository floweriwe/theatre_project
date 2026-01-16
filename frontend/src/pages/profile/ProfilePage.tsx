/**
 * Страница профиля пользователя — Modern Theatre Elegance v3
 */

import { useState } from 'react';
import {
  Shield,
  Camera,
  Save,
  Key,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';

export function ProfilePage() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || 'Администратор',
    lastName: user?.lastName || '',
    email: user?.email || 'admin@theatre.test',
    phone: '+7 (999) 123-45-67',
  });

  const handleSave = () => {
    // TODO: Сохранение профиля
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-light to-surface p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gold/20 flex items-center justify-center">
              <span className="text-3xl font-bold text-gold">
                {formData.firstName[0]}
              </span>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gold flex items-center justify-center text-primary hover:bg-gold-light transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-text-primary mb-2">
              {formData.firstName} {formData.lastName}
            </h1>
            <p className="text-text-secondary mb-3">{formData.email}</p>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500/10 text-red-400">
                <Shield className="w-3 h-3 mr-1" />
                Администратор
              </Badge>
              <Badge className="bg-emerald-500/10 text-emerald-400">
                Активен
              </Badge>
            </div>
          </div>

          <Button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Отмена' : 'Редактировать'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-text-primary mb-4">Личная информация</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">Имя</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-2">Фамилия</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-2">Телефон</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Сохранить изменения
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-medium text-text-primary mb-4">Безопасность</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-text-muted" />
                  <div>
                    <p className="text-text-primary">Пароль</p>
                    <p className="text-sm text-text-muted">Последнее изменение: 30 дней назад</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Изменить</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-text-muted" />
                  <div>
                    <p className="text-text-primary">Двухфакторная аутентификация</p>
                    <p className="text-sm text-text-muted">Не настроена</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Настроить</Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-text-primary mb-4">Активность</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-text-muted" />
                <div>
                  <p className="text-sm text-text-muted">Последний вход</p>
                  <p className="text-text-primary">Сегодня, 10:30</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-text-muted" />
                <div>
                  <p className="text-sm text-text-muted">Дата регистрации</p>
                  <p className="text-text-primary">1 января 2024</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-medium text-text-primary mb-4">Уведомления</h2>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-text-secondary">Email-уведомления</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-gold" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-text-secondary">Push-уведомления</span>
                <input type="checkbox" className="w-4 h-4 accent-gold" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-text-secondary">Напоминания о событиях</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-gold" />
              </label>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
