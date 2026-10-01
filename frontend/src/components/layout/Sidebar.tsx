import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BookOpen,
  Users,
  Clock,
  CircleDollarSign,
  Tags,
  BarChart3,
  LogOut,
  Library,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Circulation Desk', path: '/circulation', icon: ArrowLeftRight, highlight: true },
    { label: 'Books Catalog', path: '/books', icon: BookOpen },
    { label: 'Students', path: '/students', icon: Users },
    { label: 'Loans Record', path: '/loans', icon: Clock },
    { label: 'Fines & Penalties', path: '/fines', icon: CircleDollarSign },
    { label: 'Categories', path: '/categories', icon: Tags },
    { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white text-stone-700 flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-stone-200 shadow-soft`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-stone-200 bg-white">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white shadow-soft ring-1 ring-brand-700/20">
            <Library className="w-4.5 h-4.5" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-xs font-bold text-stone-900 tracking-tight leading-none">Oakridge Academy</h1>
            <p className="text-[10px] text-stone-500 mt-1 font-mono tracking-wide">Library System</p>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
            Catalog & Circulation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-soft font-semibold'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-4 h-4 shrink-0 stroke-[1.8]" />
                    <span className="tracking-tight">{item.label}</span>
                    {item.highlight && (
                      <span
                        className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-semibold border tracking-wider ${
                          isActive
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-amber-50 text-amber-700 border-amber-200/80'
                        }`}
                      >
                        Desk
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Librarian Profile and Logout */}
        <div className="p-3 border-t border-stone-200 bg-stone-50/60">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white mb-2 border border-stone-200 shadow-soft">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs border border-brand-200">
              {user?.fullName?.charAt(0) || 'L'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-stone-800 truncate tracking-tight">{user?.fullName || 'Librarian'}</p>
              <p className="text-[10px] text-stone-500 truncate font-mono">{user?.email || 'admin@oakridge'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
