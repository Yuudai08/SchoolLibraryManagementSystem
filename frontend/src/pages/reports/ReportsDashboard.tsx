import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  Printer,
  BookOpen,
  Clock,
  AlertTriangle,
  Coins,
  TrendingUp,
} from 'lucide-react';
import { reportsApi } from '../../api/services';
import { formatDate, formatCurrency, exportToCsv } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

export const ReportsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'borrowing' | 'overdue' | 'fines' | 'popular'>('inventory');

  // Queries for each report
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['reportInventory'],
    queryFn: reportsApi.getInventory,
    enabled: activeTab === 'inventory',
  });

  const { data: borrowingData, isLoading: borrowingLoading } = useQuery({
    queryKey: ['reportBorrowing'],
    queryFn: reportsApi.getBorrowing,
    enabled: activeTab === 'borrowing',
  });

  const { data: overdueData, isLoading: overdueLoading } = useQuery({
    queryKey: ['reportOverdue'],
    queryFn: reportsApi.getOverdue,
    enabled: activeTab === 'overdue',
  });

  const { data: finesData, isLoading: finesLoading } = useQuery({
    queryKey: ['reportFines'],
    queryFn: reportsApi.getFines,
    enabled: activeTab === 'fines',
  });

  const { data: popularData, isLoading: popularLoading } = useQuery({
    queryKey: ['reportPopular'],
    queryFn: () => reportsApi.getPopularBooks(15),
    enabled: activeTab === 'popular',
  });

  const handleExportCsv = () => {
    if (activeTab === 'inventory' && inventoryData) {
      exportToCsv('library_inventory_report', inventoryData);
    } else if (activeTab === 'borrowing' && borrowingData) {
      exportToCsv('library_borrowing_report', borrowingData);
    } else if (activeTab === 'overdue' && overdueData) {
      exportToCsv('library_overdue_report', overdueData);
    } else if (activeTab === 'fines' && finesData) {
      exportToCsv('library_fines_report', finesData);
    } else if (activeTab === 'popular' && popularData) {
      exportToCsv('library_popular_books_report', popularData);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs = [
    { id: 'inventory', label: 'Inventory Report', icon: BookOpen },
    { id: 'borrowing', label: 'Borrowing Activity', icon: Clock },
    { id: 'overdue', label: 'Overdue Penalties', icon: AlertTriangle },
    { id: 'fines', label: 'Fines & Revenue', icon: Coins },
    { id: 'popular', label: 'Popular Books', icon: TrendingUp },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Action Bar (hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-900 text-white shadow-soft'
                    : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/90'
                }`}
              >
                <Icon className="w-3.5 h-3.5 stroke-[1.8]" />
                <span className="tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Export & Print */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print
          </Button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print-only mb-6">
        <h1 className="text-xl font-bold text-stone-900">Triyog High School &bull; Library Information System</h1>
        <p className="text-xs text-stone-500 font-mono mt-1">
          Official Report: {tabs.find((t) => t.id === activeTab)?.label} &bull; Generated {new Date().toLocaleString()}
        </p>
      </div>

      {/* TAB 1: INVENTORY REPORT */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-card overflow-hidden">
            <div className="p-5 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900 tracking-tight">Catalog Inventory & Circulation Availability</h3>
              <p className="text-xs text-stone-500 mt-0.5">Physical copies, borrowed balances, and on-shelf percentage</p>
            </div>

            {inventoryLoading ? (
              <TableSkeleton rows={8} cols={7} />
            ) : !inventoryData || inventoryData.length === 0 ? (
              <EmptyState icon={BookOpen} title="No Inventory Data" description="No books in library database." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50/70 text-stone-600 font-semibold tracking-tight border-b border-stone-200/80">
                    <tr>
                      <th className="px-5 py-3">Book Title</th>
                      <th className="px-5 py-3">Author</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3 text-center">Total Copies</th>
                      <th className="px-5 py-3 text-center">Available</th>
                      <th className="px-5 py-3 text-center">Borrowed</th>
                      <th className="px-5 py-3">Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {inventoryData.map((item, idx) => {
                      const availPct = Math.round((item.availableCopies / (item.totalCopies || 1)) * 100);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3 font-semibold text-slate-900">{item.title}</td>
                          <td className="px-5 py-3 text-slate-500">{item.author}</td>
                          <td className="px-5 py-3">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                              {item.categoryName}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center font-bold text-slate-900">{item.totalCopies}</td>
                          <td className="px-5 py-3 text-center font-bold text-emerald-600">{item.availableCopies}</td>
                          <td className="px-5 py-3 text-center font-bold text-amber-600">{item.borrowedCopies}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full ${availPct === 0 ? 'bg-rose-500' : availPct < 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${availPct}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] text-slate-500">{availPct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BORROWING ACTIVITY REPORT */}
      {activeTab === 'borrowing' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Borrowing History & Circulation Log</h3>
            <p className="text-xs text-slate-500 mt-0.5">Comprehensive audit trail of book checkouts and returns</p>
          </div>

          {borrowingLoading ? (
            <Spinner size="lg" label="Loading borrowing records..." className="h-64" />
          ) : !borrowingData || borrowingData.length === 0 ? (
            <EmptyState icon={Clock} title="No Borrowing Activity" description="No loans recorded in the system yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Student Name</th>
                    <th className="px-5 py-3">Student ID</th>
                    <th className="px-5 py-3">Book Title</th>
                    <th className="px-5 py-3">Borrowed On</th>
                    <th className="px-5 py-3">Due Date</th>
                    <th className="px-5 py-3">Returned On</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {borrowingData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-semibold text-slate-900">{item.studentName}</td>
                      <td className="px-5 py-3 font-mono text-slate-500">{item.studentNumber}</td>
                      <td className="px-5 py-3 text-slate-800">{item.bookTitle}</td>
                      <td className="px-5 py-3 text-slate-600">{formatDate(item.borrowedDate)}</td>
                      <td className="px-5 py-3 text-slate-600">{formatDate(item.dueDate)}</td>
                      <td className="px-5 py-3 text-slate-500">{item.returnedDate ? formatDate(item.returnedDate) : '—'}</td>
                      <td className="px-5 py-3">
                        <Badge
                          variant={
                            item.status === 'Returned' ? 'success' :
                            item.status === 'Overdue' ? 'danger' : 'warning'
                          }
                          size="sm"
                        >
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OVERDUE REPORT */}
      {activeTab === 'overdue' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Current Overdue Loans & Accruing Fines</h3>
            <p className="text-xs text-slate-500 mt-0.5">Students with unreturned loans past their specified due dates</p>
          </div>

          {overdueLoading ? (
            <Spinner size="lg" label="Loading overdue report..." className="h-64" />
          ) : !overdueData || overdueData.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="Zero Overdue Loans" description="No active loans are overdue at this time." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Student Name</th>
                    <th className="px-5 py-3">Student ID</th>
                    <th className="px-5 py-3">Book Title</th>
                    <th className="px-5 py-3">Due Date</th>
                    <th className="px-5 py-3">Days Overdue</th>
                    <th className="px-5 py-3">Accrued Fine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {overdueData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-semibold text-slate-900">{item.studentName}</td>
                      <td className="px-5 py-3 font-mono text-slate-500">{item.studentNumber}</td>
                      <td className="px-5 py-3 text-slate-800">{item.bookTitle}</td>
                      <td className="px-5 py-3 font-medium text-rose-600">{formatDate(item.dueDate)}</td>
                      <td className="px-5 py-3">
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-bold">
                          {item.daysOverdue} days
                        </span>
                      </td>
                      <td className="px-5 py-3 font-bold text-rose-600">
                        {formatCurrency(item.currentFine)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FINES REPORT */}
      {activeTab === 'fines' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Fines Collection & Revenue Statement</h3>
            <p className="text-xs text-slate-500 mt-0.5">Penalties levied on late returns and settlement status</p>
          </div>

          {finesLoading ? (
            <Spinner size="lg" label="Loading fine report..." className="h-64" />
          ) : !finesData || finesData.length === 0 ? (
            <EmptyState icon={Coins} title="No Fines Assessed" description="No fine records generated." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Student Name</th>
                    <th className="px-5 py-3">Student ID</th>
                    <th className="px-5 py-3">Book Title</th>
                    <th className="px-5 py-3">Fine Amount</th>
                    <th className="px-5 py-3">Payment Status</th>
                    <th className="px-5 py-3">Settlement Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {finesData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-semibold text-slate-900">{item.studentName}</td>
                      <td className="px-5 py-3 font-mono text-slate-500">{item.studentNumber}</td>
                      <td className="px-5 py-3 text-slate-800">{item.bookTitle}</td>
                      <td className="px-5 py-3 font-bold text-slate-900">{formatCurrency(item.fineAmount)}</td>
                      <td className="px-5 py-3">
                        <Badge variant={item.isPaid ? 'success' : 'danger'} size="sm">
                          {item.isPaid ? 'Paid' : 'Unpaid Penalty'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {item.paidDate ? formatDate(item.paidDate) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: POPULAR BOOKS REPORT */}
      {activeTab === 'popular' && (
        <div className="space-y-6">
          {/* Chart View */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Most Borrowed Titles Ranking</h3>
            <p className="text-xs text-slate-500 mb-6">Top circulated books by lifetime loan count</p>

            {popularLoading ? (
              <Spinner size="lg" label="Loading popular books chart..." className="h-64" />
            ) : !popularData || popularData.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No Borrowing Statistics" description="Books must be circulated to generate rankings." />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={popularData.map(b => ({
                      title: b.title.length > 20 ? `${b.title.substring(0, 18)}...` : b.title,
                      loans: b.totalLoans,
                    }))}
                    margin={{ top: 10, right: 20, left: 0, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="title" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      itemStyle={{ color: '#818cf8' }}
                    />
                    <Bar dataKey="loans" name="Times Borrowed" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                      {popularData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#4338ca' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Tabular Ranking */}
          {popularData && popularData.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 w-16">Rank</th>
                    <th className="px-5 py-3">Book Title</th>
                    <th className="px-5 py-3">Author</th>
                    <th className="px-5 py-3 text-right">Lifetime Checkouts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {popularData.map((book, idx) => (
                    <tr key={book.bookId} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-bold text-slate-500 font-mono">
                        #{idx + 1}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{book.title}</td>
                      <td className="px-5 py-3 text-slate-500">{book.author}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                          {book.totalLoans} loans
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
