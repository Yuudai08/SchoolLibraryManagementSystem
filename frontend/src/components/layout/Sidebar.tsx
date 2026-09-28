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
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide leading-none">School Library</h1>
            <p className="text-[11px] text-slate-400 mt-1">Management Portal</p>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Main Menu
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
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : item.highlight
                      ? 'text-indigo-400 hover:bg-slate-800/80 hover:text-indigo-300'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-400/30">
                    Desk
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Librarian Profile and Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/60 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
              {user?.fullName?.charAt(0) || 'L'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-medium text-white truncate">{user?.fullName || 'Librarian'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@library'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
