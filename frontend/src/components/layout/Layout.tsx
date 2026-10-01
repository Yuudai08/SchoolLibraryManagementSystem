import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Map route pathname to friendly header title
  const getPageTitle = (path: string): string => {
    if (path === '/') return 'Overview & Circulation Pulse';
    if (path.startsWith('/circulation')) return 'Circulation Desk';
    if (path.startsWith('/books')) return 'Books Catalog';
    if (path.startsWith('/students')) return 'Student Registry';
    if (path.startsWith('/loans')) return 'Circulation Records';
    if (path.startsWith('/fines')) return 'Overdue Fines & Penalties';
    if (path.startsWith('/categories')) return 'Classification & Genres';
    if (path.startsWith('/reports')) return 'Analytics & Reports';
    return 'Library Portal';
  };

  const currentTitle = getPageTitle(location.pathname);

  return (
    <div className="min-h-[100dvh] bg-[#fbfbfa] text-stone-800 flex">
      {/* Skip to content accessible anchor */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-brand-900 text-white rounded-lg shadow-elevated font-medium text-xs tracking-tight"
      >
        Skip to main content
      </a>

      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title={currentTitle} />
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
