import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Map route pathname to friendly header title
  const getPageTitle = (path: string): string => {
    if (path === '/') return 'Library Overview & Metrics';
    if (path.startsWith('/circulation')) return 'Circulation Desk (Borrow & Return)';
    if (path.startsWith('/books')) return 'Books Catalog Management';
    if (path.startsWith('/students')) return 'Students Registry & Status';
    if (path.startsWith('/loans')) return 'Circulation Loans Record';
    if (path.startsWith('/fines')) return 'Overdue Fines & Penalties';
    if (path.startsWith('/categories')) return 'Book Categories';
    if (path.startsWith('/reports')) return 'Reports & Library Analytics';
    return 'Library Portal';
  };

  const currentTitle = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title={currentTitle} />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
