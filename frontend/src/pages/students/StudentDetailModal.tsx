import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, BookOpen } from 'lucide-react';
import { studentsApi } from '../../api/services';
import { Student } from '../../types';
import { formatDate } from '../../utils/formatters';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const { data: loanHistory, isLoading } = useQuery({
    queryKey: ['studentHistory', student?.studentId],
    queryFn: () => studentsApi.getLoanHistory(student!.studentId),
    enabled: isOpen && !!student,
  });

  if (!student) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={student.fullName}
      subtitle={`Student ID: ${student.studentNumber}`}
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Profile Card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Department</span>
            <span className="font-semibold text-slate-800">{student.department || 'General'}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Academic Year</span>
            <span className="font-semibold text-slate-800">Year {student.year || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Status</span>
            <Badge variant={student.isActive ? 'success' : 'danger'} size="sm">
              {student.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Current Loans</span>
            <span className="font-bold text-indigo-700">{student.activeLoanCount} / 5</span>
          </div>
        </div>

        {/* Loan History Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Circulation History ({loanHistory?.length || 0})
            </h4>
          </div>

          {isLoading ? (
            <Spinner label="Loading loan records..." />
          ) : !loanHistory || loanHistory.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <BookOpen className="w-6 h-6 text-slate-300 mx-auto mb-1" />
              <p className="text-xs text-slate-500">No borrowing records on file for this student.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Book Title</th>
                    <th className="px-3.5 py-2.5">Borrowed</th>
                    <th className="px-3.5 py-2.5">Due Date</th>
                    <th className="px-3.5 py-2.5">Returned</th>
                    <th className="px-3.5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loanHistory.map((l) => (
                    <tr key={l.loanId} className="hover:bg-slate-50/50">
                      <td className="px-3.5 py-2.5 font-medium text-slate-900">{l.bookTitle}</td>
                      <td className="px-3.5 py-2.5 text-slate-500">{formatDate(l.borrowedDate)}</td>
                      <td className="px-3.5 py-2.5 text-slate-500">{formatDate(l.dueDate)}</td>
                      <td className="px-3.5 py-2.5 text-slate-500">{l.returnedDate ? formatDate(l.returnedDate) : '—'}</td>
                      <td className="px-3.5 py-2.5">
                        <Badge
                          variant={
                            l.status === 'Returned' ? 'success' :
                            l.status === 'Overdue' ? 'danger' : 'warning'
                          }
                          size="sm"
                        >
                          {l.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
