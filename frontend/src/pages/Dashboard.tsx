import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Clock,
  AlertCircle,
  Coins,
  ArrowRight,
  TrendingUp,
  BookmarkCheck,
  CheckCircle2,
  ArrowLeftRight,
} from 'lucide-react';
import { dashboardApi } from '../api/services';
import { formatDate, formatCurrency } from '../utils/formatters';
import { Spinner } from '../components/common/Spinner';
import { KpiCardSkeleton } from '../components/common/Skeleton';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const Dashboard: React.FC = () => {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: dashboardApi.getSummary,
  });

  const { data: recentLoans, isLoading: loansLoading } = useQuery({
    queryKey: ['recentLoans'],
    queryFn: () => dashboardApi.getRecentLoans(6),
  });

  const { data: popularBooks, isLoading: booksLoading } = useQuery({
    queryKey: ['popularBooks'],
    queryFn: () => dashboardApi.getPopularBooks(5),
  });

  if (summaryLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-200">
        <div className="h-28 bg-stone-200/60 rounded-2xl animate-pulse" />
        <KpiCardSkeleton />
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Catalog Titles',
      value: summary?.totalBooks ?? 0,
      subtext: `${summary?.totalCopies ?? 0} total physical copies`,
      icon: BookOpen,
      color: 'bg-brand-50 text-brand-700 border-brand-200/80',
    },
    {
      title: 'Available Copies',
      value: summary?.availableCopies ?? 0,
      subtext: `${summary?.borrowedCopies ?? 0} currently on loan`,
      icon: BookmarkCheck,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    },
    {
      title: 'Enrolled Patrons',
      value: summary?.totalStudents ?? 0,
      subtext: 'Active student accounts',
      icon: Users,
      color: 'bg-sky-50 text-sky-700 border-sky-200/80',
    },
    {
      title: 'Active Loans',
      value: summary?.activeLoans ?? 0,
      subtext: 'Books currently checked out',
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 border-amber-200/80',
    },
    {
      title: 'Overdue Loans',
      value: summary?.overdueLoans ?? 0,
      subtext: 'Past due return date',
      icon: AlertCircle,
      color: 'bg-rose-50 text-rose-700 border-rose-200/80',
      urgent: (summary?.overdueLoans ?? 0) > 0,
    },
    {
      title: 'Pending Fines',
      value: formatCurrency(summary?.unpaidFines ?? 0),
      subtext: 'Uncollected penalties',
      icon: Coins,
      color: 'bg-violet-50 text-violet-700 border-violet-200/80',
    },
  ];

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Top Academic Command Banner */}
      <div className="bg-[#0c1a2c] rounded-2xl p-6 text-white shadow-card border border-[#19304e] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-brand-500/10 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-brand-200 tracking-wider">CIRCULATION READY</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Daily Desk & Patron Operations</h2>
          <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed">
            Rapid student checkout, book returns, and instant fine reconciliation are primed for the active school session.
          </p>
        </div>
        <Link
          to="/circulation"
          className="relative z-10 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-card transition-all shrink-0 cursor-pointer active:scale-[0.98]"
        >
          <ArrowLeftRight className="w-4 h-4 stroke-[1.8]" />
          <span>Launch Circulation Desk</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[1.8]" />
        </Link>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`bg-white rounded-xl p-5 border shadow-soft hover:shadow-card transition-all duration-200 flex items-start justify-between ${
                kpi.urgent ? 'border-rose-300/80 bg-rose-50/20 ring-1 ring-rose-200/50' : 'border-stone-200/90'
              }`}
            >
              <div>
                <p className="text-[11px] font-semibold text-stone-500 tracking-tight">{kpi.title}</p>
                <h3 className="text-2xl font-bold text-stone-900 mt-1.5 font-mono tabular-nums tracking-tight">
                  {kpi.value}
                </h3>
                <p className="text-xs text-stone-500 mt-1">{kpi.subtext}</p>
              </div>
              <div className={`p-3 rounded-xl border ${kpi.color} shadow-soft`}>
                <Icon className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Popular Books Chart */}
        <div className="lg:col-span-6 bg-white rounded-xl p-6 border border-stone-200/90 shadow-soft flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-700 stroke-[1.8]" />
              <h3 className="text-sm font-bold text-stone-900 tracking-tight">Most Circulated Titles</h3>
            </div>
            <Link to="/reports" className="text-xs text-brand-700 hover:text-brand-900 font-semibold tracking-tight transition-colors">
              View Analytics &rarr;
            </Link>
          </div>

          <div className="flex-1 mt-4 min-h-[260px] flex items-center justify-center">
            {booksLoading ? (
              <Spinner size="sm" />
            ) : !popularBooks || popularBooks.length === 0 ? (
              <p className="text-xs text-stone-400">No circulation data recorded yet.</p>
            ) : (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={popularBooks.map(b => ({
                      name: b.title.length > 18 ? `${b.title.substring(0, 16)}...` : b.title,
                      loans: b.totalLoans,
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11, fill: '#78716c' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0c1a2c', borderColor: '#19304e', borderRadius: '10px', color: '#fff', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
                      itemStyle={{ color: '#95bede' }}
                    />
                    <Bar dataKey="loans" name="Total Loans" fill="#23649b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Recent Circulation Activity */}
        <div className="lg:col-span-6 bg-white rounded-xl p-6 border border-stone-200/90 shadow-soft flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[1.8]" />
              <h3 className="text-sm font-bold text-stone-900 tracking-tight">Recent Circulation Log</h3>
            </div>
            <Link to="/loans" className="text-xs text-brand-700 hover:text-brand-900 font-semibold tracking-tight transition-colors">
              View All Loans &rarr;
            </Link>
          </div>

          <div className="flex-1 mt-4">
            {loansLoading ? (
              <Spinner size="sm" />
            ) : !recentLoans || recentLoans.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-10">No recent loans found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-500 font-semibold tracking-tight">
                      <th className="pb-2.5 font-medium">Student</th>
                      <th className="pb-2.5 font-medium">Book</th>
                      <th className="pb-2.5 font-medium">Borrowed</th>
                      <th className="pb-2.5 font-medium">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {recentLoans.map((loan, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-2.5 font-semibold text-stone-900 truncate max-w-[130px]">
                          {loan.studentName}
                        </td>
                        <td className="py-2.5 text-stone-600 truncate max-w-[160px]">
                          {loan.bookTitle}
                        </td>
                        <td className="py-2.5 text-stone-500 whitespace-nowrap font-mono tabular-nums text-[11px]">
                          {formatDate(loan.borrowedDate)}
                        </td>
                        <td className="py-2.5 text-stone-500 whitespace-nowrap font-mono tabular-nums text-[11px]">
                          {formatDate(loan.dueDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
