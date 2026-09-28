import React from 'react';
import { Menu, Calendar, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatters';

interface HeaderProps {
  onToggleSidebar: () => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title }) => {
  const { user } = useAuth();
  const today = formatDate(new Date().toISOString());

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold text-slate-800 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Date chip */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/70 px-3 py-1.5 rounded-full border border-slate-200/60">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{today}</span>
        </div>

        {/* User status */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <UserCheck className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-700 hidden md:inline">
            {user?.fullName || 'Librarian'}
          </span>
        </div>
      </div>
    </header>
  );
};
