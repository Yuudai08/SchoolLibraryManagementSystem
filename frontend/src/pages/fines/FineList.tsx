import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CircleDollarSign,
  CheckCircle,
  Coins,
  CreditCard,
  Download,
  Printer,
  AlertTriangle,
  TrendingUp,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { finesApi } from '../../api/services';
import { Fine } from '../../types';
import { formatDate, formatCurrency, exportToCsv } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { SearchInput } from '../../components/common/SearchInput';
import { Pagination } from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { getErrorMessage } from '../../api/client';

export const FineList: React.FC = () => {
  const queryClient = useQueryClient();

  // Active filter tab: 'all' | 'unpaid' | 'paid'
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Pay fine modal state
  const [fineToPay, setFineToPay] = useState<Fine | null>(null);

  // Fetch all fines to enable rich KPI computations and instant search/filter
  const { data: fines, isLoading } = useQuery({
    queryKey: ['fines'],
    queryFn: () => finesApi.getFines(),
  });

  // Pay mutation
  const payMutation = useMutation({
    mutationFn: (id: number) => finesApi.payFine(id),
    onSuccess: () => {
      toast.success('Fine marked as settled and cleared successfully!');
      setFineToPay(null);
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['reportFines'] });
      queryClient.invalidateQueries({ queryKey: ['reportOverdue'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // KPI Calculations
  const stats = useMemo(() => {
    if (!fines) {
      return {
        totalOutstanding: 0,
        unpaidCount: 0,
        totalCollected: 0,
        paidCount: 0,
        totalAssessed: 0,
        totalCount: 0,
        recoveryRate: 0,
      };
    }

    const unpaid = fines.filter((f) => !f.isPaid);
    const paid = fines.filter((f) => f.isPaid);

    const totalOutstanding = unpaid.reduce((sum, f) => sum + f.amount, 0);
    const totalCollected = paid.reduce((sum, f) => sum + f.amount, 0);
    const totalAssessed = totalOutstanding + totalCollected;
    const recoveryRate = totalAssessed > 0 ? (totalCollected / totalAssessed) * 100 : 100;

    return {
      totalOutstanding,
      unpaidCount: unpaid.length,
      totalCollected,
      paidCount: paid.length,
      totalAssessed,
      totalCount: fines.length,
      recoveryRate,
    };
  }, [fines]);

  // Tab definitions with dynamic badge counts
  const tabs = [
    { id: 'all', label: 'All Citations', count: stats.totalCount },
    { id: 'unpaid', label: 'Pending Unpaid', count: stats.unpaidCount },
    { id: 'paid', label: 'Settled & Paid', count: stats.paidCount },
  ] as const;

  // Filtered & Searched Data
  const filteredFines = useMemo(() => {
    if (!fines) return [];

    let result = fines;

    // Filter by tab
    if (activeTab === 'unpaid') {
      result = result.filter((f) => !f.isPaid);
    } else if (activeTab === 'paid') {
      result = result.filter((f) => f.isPaid);
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.studentName.toLowerCase().includes(q) ||
          f.studentNumber.toLowerCase().includes(q) ||
          f.bookTitle.toLowerCase().includes(q) ||
          f.fineId.toString().includes(q) ||
          f.loanId.toString().includes(q)
      );
    }

    return result;
  }, [fines, activeTab, search]);

  // Pagination slice
  const totalPages = Math.ceil(filteredFines.length / pageSize) || 1;
  const paginatedFines = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredFines.slice(start, start + pageSize);
  }, [filteredFines, page, pageSize]);

  // CSV Export
  const handleExportCsv = () => {
    if (!filteredFines.length) {
      toast.error('No fine records to export.');
      return;
    }

    const exportRows = filteredFines.map((f) => ({
      'Citation ID': f.fineId,
      'Loan Reference': f.loanId,
      'Student Name': f.studentName,
      'Student ID': f.studentNumber,
      'Book Title': f.bookTitle,
      'Penalty Amount': f.amount,
      'Due Date': formatDate(f.dueDate || f.createdAt),
      Status: f.isPaid ? 'Settled / Paid' : 'Unpaid Penalty',
      'Settled Date': f.paidDate ? formatDate(f.paidDate) : 'Pending',
    }));

    exportToCsv(`library_fines_penalties_${activeTab}`, exportRows);
    toast.success('Fines ledger exported to CSV.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Printable Report Header */}
      <div className="hidden print-only mb-6">
        <h1 className="text-xl font-bold text-stone-900">Triyog High School &bull; Library Information System</h1>
        <p className="text-xs text-stone-500 font-mono mt-1">
          Official Report: Overdue Fines & Penalties Ledger &bull; View: {tabs.find((t) => t.id === activeTab)?.label} &bull; Generated {new Date().toLocaleString()}
        </p>
      </div>

      {/* KPI Overview Cards (Matching Reports & Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 no-print">
        {/* Card 1: Unpaid Fines */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 tracking-tight">Unpaid Fines</p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1 font-mono tabular-nums tracking-tight">
              {formatCurrency(stats.totalOutstanding)}
            </h3>
            <p className="text-[11px] text-rose-600 font-medium mt-1">
              {stats.unpaidCount} unresolved {stats.unpaidCount === 1 ? 'penalty' : 'penalties'}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/80 shadow-soft">
            <AlertTriangle className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>

        {/* Card 2: Paid Fines */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 tracking-tight">Paid Fines</p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1 font-mono tabular-nums tracking-tight">
              {formatCurrency(stats.totalCollected)}
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              {stats.paidCount} cleared {stats.paidCount === 1 ? 'citation' : 'citations'}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-soft">
            <Coins className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>

        {/* Card 3: Total Fines */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 tracking-tight">Total Fines</p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1 font-mono tabular-nums tracking-tight">
              {formatCurrency(stats.totalAssessed)}
            </h3>
            <p className="text-[11px] text-stone-500 font-medium mt-1">
              {stats.totalCount} lifetime citations
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-brand-50 text-brand-700 border border-brand-200/80 shadow-soft">
            <Receipt className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>

        {/* Card 4: Collection Rate */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 tracking-tight">Collection Rate</p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1 font-mono tabular-nums tracking-tight">
              {stats.recoveryRate.toFixed(1)}%
            </h3>
            <p className="text-[11px] text-sky-700 font-medium mt-1">Penalties recovered</p>
          </div>
          <div className="p-3.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/80 shadow-soft">
            <TrendingUp className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Matching Loans Record) */}
      <div className="border-b border-stone-200/90 no-print">
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`pb-3 px-1 border-b-2 font-semibold text-xs tracking-tight transition-colors cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'border-brand-700 text-brand-700'
                    : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${
                    isActive
                      ? 'bg-brand-100 text-brand-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Action Bar: Search Input & Export / Print Buttons (Matching Reports & Loans) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search by student, ID, book title, or citation #..."
            className="w-full"
          />
        </div>

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

      {/* Fines Table Card (Matching Loans Record) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : filteredFines.length === 0 ? (
          <EmptyState
            icon={CircleDollarSign}
            title={
              search
                ? 'No Citations Found'
                : activeTab === 'unpaid'
                ? 'No Unpaid Fines'
                : 'No Fine Records Found'
            }
            description={
              search
                ? `No fine citations matched your search query "${search}".`
                : activeTab === 'unpaid'
                ? 'All library patrons are currently in good standing with zero overdue penalties pending.'
                : 'No fine records exist in the system under this category.'
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/70 text-stone-600 font-semibold tracking-tight border-b border-stone-200/80">
                  <tr>
                    <th className="px-5 py-3">Citation ID</th>
                    <th className="px-5 py-3">Student Patron</th>
                    <th className="px-5 py-3">Book Title</th>
                    <th className="px-5 py-3">Penalty Amount</th>
                    <th className="px-5 py-3">Due Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {paginatedFines.map((fine) => (
                    <tr key={fine.fineId} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono tabular-nums text-stone-400">
                        #{fine.fineId}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-stone-900 tracking-tight">{fine.studentName}</p>
                        <p className="text-stone-400 font-mono tabular-nums text-[11px]">{fine.studentNumber}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-stone-900 tracking-tight text-sm">{fine.bookTitle}</p>
                        <p className="text-stone-500 font-mono tabular-nums text-[11px] mt-0.5">Loan #{fine.loanId}</p>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-stone-900 font-mono tabular-nums text-sm">
                        {formatCurrency(fine.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-stone-600 font-mono tabular-nums text-[11px]">
                        {formatDate(fine.dueDate || fine.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={fine.isPaid ? 'success' : 'danger'}>
                          {fine.isPaid ? 'Settled' : 'Unpaid Penalty'}
                        </Badge>
                        {fine.paidDate && (
                          <p className="text-[10px] text-stone-400 mt-1 font-mono tabular-nums">
                            Paid on {formatDate(fine.paidDate)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {!fine.isPaid ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setFineToPay(fine)}
                            leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                          >
                            Collect Payment
                          </Button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={filteredFines.length}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>

      {/* Collect Fine Payment Modal */}
      <Modal
        isOpen={!!fineToPay}
        onClose={() => setFineToPay(null)}
        title="Collect Overdue Penalty Payment"
        subtitle={fineToPay ? `Receipt for Patron: ${fineToPay.studentName} (${fineToPay.studentNumber})` : undefined}
        maxWidth="sm"
      >
        {fineToPay && (
          <div className="space-y-4">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/90 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Book Title:</span>
                <span className="font-semibold text-stone-900 text-right max-w-[200px] truncate">{fineToPay.bookTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Patron Number:</span>
                <span className="font-mono text-stone-900">{fineToPay.studentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Loan Reference:</span>
                <span className="font-mono text-stone-900">#{fineToPay.loanId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Loan Due Date:</span>
                <span className="font-mono text-stone-900">{formatDate(fineToPay.dueDate || fineToPay.createdAt)}</span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2 text-sm">
                <span className="font-bold text-stone-900">Total Due:</span>
                <span className="font-bold text-rose-600 font-mono tabular-nums">{formatCurrency(fineToPay.amount)}</span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Confirm receipt of <span className="font-bold text-stone-900">{formatCurrency(fineToPay.amount)}</span> from the student. Once settled, this citation will be marked paid and the patron's overdue penalty will be resolved.
            </p>

            <div className="pt-3 flex justify-end gap-3 border-t border-stone-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFineToPay(null)}
                disabled={payMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => payMutation.mutate(fineToPay.fineId)}
                isLoading={payMutation.isPending}
                leftIcon={<CreditCard className="w-3.5 h-3.5" />}
              >
                Confirm Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};