import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleDollarSign, CheckCircle, Coins, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { finesApi } from '../../api/services';
import { Fine } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { getErrorMessage } from '../../api/client';

export const FineList: React.FC = () => {
  const queryClient = useQueryClient();
  const [unpaidOnly, setUnpaidOnly] = useState(true);
  const [fineToPay, setFineToPay] = useState<Fine | null>(null);

  const { data: fines, isLoading } = useQuery({
    queryKey: ['fines', unpaidOnly],
    queryFn: () => finesApi.getFines(unpaidOnly ? true : undefined),
  });

  const payMutation = useMutation({
    mutationFn: (id: number) => finesApi.payFine(id),
    onSuccess: () => {
      toast.success('Fine marked as paid successfully!');
      setFineToPay(null);
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const totalOutstanding = fines?.filter(f => !f.isPaid).reduce((acc, f) => acc + f.amount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {unpaidOnly ? 'Current Unpaid Fines' : 'Total Outstanding in View'}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
              {formatCurrency(totalOutstanding)}
            </h3>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setUnpaidOnly(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              unpaidOnly ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unpaid Fines Only
          </button>
          <button
            onClick={() => setUnpaidOnly(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              !unpaidOnly ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Fines History
          </button>
        </div>
      </div>

      {/* Fines Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <Spinner size="lg" label="Loading fine records..." className="h-64" />
        ) : !fines || fines.length === 0 ? (
          <EmptyState
            icon={CircleDollarSign}
            title={unpaidOnly ? 'No Unpaid Fines' : 'No Fine Records Found'}
            description={
              unpaidOnly
                ? 'Great news! All library loans are in good standing with zero overdue penalties pending.'
                : 'No fine records exist in the system.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Fine ID</th>
                  <th className="px-5 py-3">Student Patron</th>
                  <th className="px-5 py-3">Book Title</th>
                  <th className="px-5 py-3">Penalty Amount</th>
                  <th className="px-5 py-3">Assessed On</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {fines.map((fine) => (
                  <tr key={fine.fineId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      #{fine.fineId}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{fine.studentName}</p>
                      <p className="text-slate-400 font-mono text-[11px]">{fine.studentNumber}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {fine.bookTitle}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {formatCurrency(fine.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatDate(fine.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={fine.isPaid ? 'success' : 'danger'}>
                        {fine.isPaid ? 'Paid' : 'Unpaid Penalty'}
                      </Badge>
                      {fine.paidDate && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
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
                        <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
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
        )}
      </div>

      {/* Pay Fine Modal */}
      <Modal
        isOpen={!!fineToPay}
        onClose={() => setFineToPay(null)}
        title="Collect Overdue Fine Payment"
        subtitle={`Receipt for: ${fineToPay?.studentName}`}
        maxWidth="sm"
      >
        {fineToPay && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Book Title:</span>
                <span className="font-semibold text-slate-800">{fineToPay.bookTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student ID:</span>
                <span className="font-mono text-slate-800">{fineToPay.studentNumber}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                <span className="font-bold text-slate-900">Total Due:</span>
                <span className="font-bold text-indigo-600">{formatCurrency(fineToPay.amount)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Confirm that you have received payment of <span className="font-bold text-slate-800">{formatCurrency(fineToPay.amount)}</span> from the student. This will clear the student's overdue record.
            </p>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
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
              >
                Mark as Paid
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
