import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, ArrowDownLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { loansApi } from '../../api/services';
import { Loan } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { getErrorMessage } from '../../api/client';

export const LoanList: React.FC = () => {
  const queryClient = useQueryClient();

  // Tab filter: 'all' | 'borrowed' | 'overdue' | 'returned'
  const [activeTab, setActiveTab] = useState<'all' | 'borrowed' | 'overdue' | 'returned'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Return modal
  const [returningLoan, setReturningLoan] = useState<Loan | null>(null);

  // Map activeTab to API params:
  // LoanStatus: 0 = Borrowed, 1 = Returned, 2 = Overdue
  const getFilterParams = () => {
    if (activeTab === 'borrowed') return { status: 0, page, pageSize };
    if (activeTab === 'returned') return { status: 1, page, pageSize };
    if (activeTab === 'overdue') return { overdueOnly: true, page, pageSize };
    return { page, pageSize };
  };

  const { data: pagedLoans, isLoading } = useQuery({
    queryKey: ['loans', activeTab, page],
    queryFn: () => loansApi.getLoans(getFilterParams()),
  });

  // Return Mutation
  const returnMutation = useMutation({
    mutationFn: (loanId: number) => loansApi.returnBook(loanId),
    onSuccess: (result) => {
      if (result.hasFine) {
        toast.error(`Book returned with overdue fine of ${formatCurrency(result.fineAmount)} (${result.overdueDays} days late).`);
      } else {
        toast.success('Book successfully returned on time!');
      }
      setReturningLoan(null);
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['fines'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const tabs = [
    { id: 'all', label: 'All Circulation Loans' },
    { id: 'borrowed', label: 'Active Borrowed' },
    { id: 'overdue', label: 'Overdue Loans' },
    { id: 'returned', label: 'Returned Records' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tabs navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`pb-3 px-1 border-b-2 font-medium text-xs tracking-tight transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <Spinner size="lg" label="Loading loan records..." className="h-64" />
        ) : !pagedLoans || !pagedLoans.items || pagedLoans.items.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No Loan Records"
            description="No loan records found under this filter criteria."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Book Info</th>
                    <th className="px-5 py-3">Student Patron</th>
                    <th className="px-5 py-3">Borrowed On</th>
                    <th className="px-5 py-3">Due Date</th>
                    <th className="px-5 py-3">Returned On</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Fine Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pagedLoans.items.map((loan) => {
                    const isOverdue = loan.status === 'Overdue' || (typeof loan.daysOverdue === 'number' && loan.daysOverdue > 0);
                    const canReturn = loan.status !== 'Returned';

                    return (
                      <tr key={loan.loanId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900 text-sm">{loan.bookTitle}</p>
                          <p className="text-slate-500 text-xs">{loan.bookAuthor}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-900">{loan.studentName}</p>
                          <p className="text-slate-400 font-mono text-[11px]">{loan.studentNumber}</p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {formatDate(loan.borrowedDate)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                            {formatDate(loan.dueDate)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {loan.returnedDate ? formatDate(loan.returnedDate) : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={
                              loan.status === 'Returned' ? 'success' :
                              isOverdue ? 'danger' : 'warning'
                            }
                          >
                            {isOverdue ? `Overdue (${loan.daysOverdue ?? 0}d)` : loan.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          {loan.currentFine && loan.currentFine > 0 ? (
                            <span className="font-semibold text-rose-600">
                              {formatCurrency(loan.currentFine)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {canReturn ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReturningLoan(loan)}
                              leftIcon={<ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />}
                            >
                              Return
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={pagedLoans.page}
              totalPages={pagedLoans.totalPages}
              totalCount={pagedLoans.totalCount}
              pageSize={pagedLoans.pageSize}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>

      {/* Return confirmation modal */}
      <Modal
        isOpen={!!returningLoan}
        onClose={() => setReturningLoan(null)}
        title="Check-In Book"
        subtitle={returningLoan ? `Student: ${returningLoan.studentName}` : undefined}
        maxWidth="sm"
      >
        {returningLoan && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Confirm return for <span className="font-semibold text-slate-900">"{returningLoan.bookTitle}"</span>.
            </p>

            {typeof returningLoan.daysOverdue === 'number' && returningLoan.daysOverdue > 0 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                <span className="font-bold">Overdue Return:</span> Late by {returningLoan.daysOverdue} days. A penalty of{' '}
                <span className="font-bold">{formatCurrency(returningLoan.currentFine || 0)}</span> will be charged.
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
                On-time return with zero fines.
              </div>
            )}

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReturningLoan(null)}
                disabled={returnMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => returnMutation.mutate(returningLoan.loanId)}
                isLoading={returnMutation.isPending}
              >
                Confirm Return
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
