/**
 * Страница аналитики и отчётов — Modern Theatre Elegance v3
 */

import { useState } from 'react';
import {
  BarChart3,
  FileText,
  Calendar,
  RefreshCw,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  PerformanceAnalyticsWidget,
  InventoryAnalyticsWidget,
  ReportTemplatesManager,
  ScheduledReportsManager,
} from '@/components/analytics';
import { useQueryClient } from '@tanstack/react-query';

type TabValue = 'overview' | 'templates' | 'scheduled';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['performance-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-light to-surface p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-purple-400 text-sm flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4" />
              Аналитика и статистика
            </p>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-text-primary mb-2">
              Отчёты
            </h1>
            <p className="text-text-secondary">
              Аналитика, отчёты и статистика работы театра
            </p>
          </div>

          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" value={activeTab} onChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Обзор
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="w-4 h-4 mr-2" />
            Шаблоны
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Calendar className="w-4 h-4 mr-2" />
            Расписание
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceAnalyticsWidget />
            <InventoryAnalyticsWidget />
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <ReportTemplatesManager />
        </TabsContent>

        {/* Scheduled Tab */}
        <TabsContent value="scheduled" className="mt-6">
          <ScheduledReportsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ReportsPage;
