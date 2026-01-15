/**
 * Основной layout приложения — Modern Theatre Elegance
 * 
 * Объединяет Header, Sidebar и область контента с элегантным дизайном.
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

/**
 * Основной layout для авторизованных страниц.
 * Использует Outlet для рендеринга вложенных роутов.
 */
export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - fixed, z-50 */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Основная область с отступом под sidebar */}
      <div className="lg:pl-[280px] min-h-screen flex flex-col">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Контент */}
        <main className="flex-1 p-6 lg:p-8">
          {/* Максимальная ширина контента для удобства чтения */}
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 lg:px-8 py-4 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-text-muted">
            <p>© 2025 Theatre Management System</p>
            <p>v1.0.0</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default MainLayout;
