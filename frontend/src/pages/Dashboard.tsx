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
    return <Spinner size="lg" label="Loading dashboard metrics..." className="h-96" />;
  }

  const kpis = [
    {
      title: 'Total Book Titles',
      value: summary?.totalBooks ?? 0,
      subtext: `${summary?.totalCopies ?? 0} total copies in library`,
      icon: BookOpen,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      title: 'Available Copies',
      value: summary?.availableCopies ?? 0,
      subtext: `${summary?.borrowedCopies ?? 0} copies currently borrowed`,
      icon: BookmarkCheck,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Registered Students',
      value: summary?.totalStudents ?? 0,
      subtext: 'Active student patrons',
      icon: Users,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Active Loans',
      value: summary?.activeLoans ?? 0,
      subtext: 'Books currently checked out',
      icon: Clock,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      title: 'Overdue Loans',
      value: summary?.overdueLoans ?? 0,
      subtext: 'Past due return date',
      icon: AlertCircle,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    {
      title: 'Unpaid Fines',
      value: formatCurrency(summary?.unpaidFines ?? 0),
      subtext: 'Pending collection',
      icon: Coins,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Quick Action Bar */}
      <div className="bg-linear-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Circulation Desk Ready</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Quickly lookup students, check out books, process returns with instant overdue fine calculation.
          </p>
        </div>
        <Link
          to="/circulation"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all shrink-0"
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Open Circulation Desk</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex items-start justify-between"
            >
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{kpi.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1.5">{kpi.value}</h3>
                <p className="text-xs text-slate-500 mt-1">{kpi.subtext}</p>
              </div>
              <div className={`p-3 rounded-xl border ${kpi.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Popular Books Chart */}
        <div className="lg:col-span-6 bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">Most Popular Books</h3>
            </div>
            <Link to="/reports" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View Analytics &rarr;
            </Link>
          </div>

          <div className="flex-1 mt-4 min-h-[260px] flex items-center justify-center">
            {booksLoading ? (
              <Spinner size="sm" />
            ) : !popularBooks || popularBooks.length === 0 ? (
              <p className="text-xs text-slate-400">No circulation data recorded yet.</p>
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      itemStyle={{ color: '#818cf8' }}
                    />
                    <Bar dataKey="loans" name="Total Loans" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Recent Circulation Activity */}
        <div className="lg:col-span-6 bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">Recent Borrowing Activity</h3>
            </div>
            <Link to="/loans" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View All Loans &rarr;
            </Link>
          </div>

          <div className="flex-1 mt-4">
            {loansLoading ? (
              <Spinner size="sm" />
            ) : !recentLoans || recentLoans.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No recent loans found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-2.5 font-medium">Student</th>
                      <th className="pb-2.5 font-medium">Book</th>
                      <th className="pb-2.5 font-medium">Borrowed</th>
                      <th className="pb-2.5 font-medium">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentLoans.map((loan, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 font-medium text-slate-900 truncate max-w-[130px]">
                          {loan.studentName}
                        </td>
                        <td className="py-2.5 text-slate-600 truncate max-w-[160px]">
                          {loan.bookTitle}
                        </td>
                        <td className="py-2.5 text-slate-500 whitespace-nowrap">
                          {formatDate(loan.borrowedDate)}
                        </td>
                        <td className="py-2.5 text-slate-500 whitespace-nowrap">
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
