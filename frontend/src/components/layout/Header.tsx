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
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-stone-200/90 sticky top-0 z-20 flex items-center justify-between px-4 lg:px-8 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 lg:hidden focus:outline-none cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-bold text-stone-900 tracking-tight">{title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Academic Session indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] font-medium text-stone-600 bg-stone-100/80 px-2.5 py-1 rounded-md border border-stone-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Session &bull; Fall 2026</span>
        </div>

        {/* Date chip */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-600 bg-stone-100/60 px-3 py-1.5 rounded-md border border-stone-200/80 tabular-nums">
          <Calendar className="w-3.5 h-3.5 text-stone-400 stroke-[1.8]" />
          <span>{today}</span>
        </div>

        {/* User status */}
        <div className="flex items-center gap-2 pl-2 border-l border-stone-200/80">
          <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-800 flex items-center justify-center border border-brand-200/80 shadow-soft">
            <UserCheck className="w-4 h-4 stroke-[1.8]" />
          </div>
          <span className="text-xs font-semibold text-stone-800 hidden md:inline tracking-tight">
            {user?.fullName || 'Librarian'}
          </span>
        </div>
      </div>
    </header>
  );
};
