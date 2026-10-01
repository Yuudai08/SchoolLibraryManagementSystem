import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Edit2, Trash2, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentsApi } from '../../api/services';
import { StudentListItem, Student } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import { Button } from '../../components/common/Button';
import { SearchInput } from '../../components/common/SearchInput';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Spinner } from '../../components/common/Spinner';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { StudentModal } from './StudentModal';
import { StudentDetailModal } from './StudentDetailModal';
import { getErrorMessage } from '../../api/client';

export const StudentList: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentListItem | null>(null);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);

  // Fetch students query
  const { data: pagedStudents, isLoading } = useQuery({
    queryKey: ['students', debouncedSearch, page],
    queryFn: () =>
      studentsApi.getStudents({
        search: debouncedSearch || undefined,
        page,
        pageSize,
      }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => studentsApi.deleteStudent(id),
    onSuccess: () => {
      toast.success('Student record deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setStudentToDelete(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleOpenAdd = () => {
    setStudentToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (item: StudentListItem) => {
    try {
      const full = await studentsApi.getStudent(item.studentId);
      setStudentToEdit(full);
      setIsModalOpen(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleOpenHistory = async (item: StudentListItem) => {
    try {
      const full = await studentsApi.getStudent(item.studentId);
      setSelectedStudentForHistory(full);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by student number, name..."
          className="max-w-md w-full"
        />

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Register New Student
        </Button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : !pagedStudents || pagedStudents.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Students Found"
            description={
              search
                ? 'No student patrons matched your search criteria.'
                : 'No student patrons registered yet. Add students to enable book checkouts.'
            }
            actionText="Register First Student"
            onAction={handleOpenAdd}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/70 text-stone-600 font-semibold tracking-tight border-b border-stone-200/80">
                  <tr>
                    <th className="px-5 py-3">Student ID</th>
                    <th className="px-5 py-3">Full Name</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Active Loans</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {pagedStudents.items.map((student) => (
                    <tr key={student.studentId} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono tabular-nums text-stone-900 font-semibold">
                        {student.studentNumber}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-stone-900 text-sm tracking-tight">
                        {student.fullName}
                      </td>
                      <td className="px-5 py-3.5 text-stone-600">
                        {student.department || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-stone-900 font-mono tabular-nums">
                          {student.activeLoanCount}
                        </span>
                        <span className="text-stone-400 font-mono tabular-nums"> / 5</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={student.isActive ? 'success' : 'danger'}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenHistory(student)}
                            className="p-1.5 text-stone-400 hover:text-brand-700 hover:bg-brand-50/70 rounded-lg transition-colors cursor-pointer"
                            title="View Loan History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 text-stone-400 hover:text-brand-700 hover:bg-brand-50/70 rounded-lg transition-colors cursor-pointer"
                            title="Edit Student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setStudentToDelete(student)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50/70 rounded-lg transition-colors cursor-pointer"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={pagedStudents.page}
              totalPages={pagedStudents.totalPages}
              totalCount={pagedStudents.totalCount}
              pageSize={pagedStudents.pageSize}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        studentToEdit={studentToEdit}
      />

      {/* Student History Modal */}
      <StudentDetailModal
        isOpen={!!selectedStudentForHistory}
        onClose={() => setSelectedStudentForHistory(null)}
        student={selectedStudentForHistory}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={() => studentToDelete && deleteMutation.mutate(studentToDelete.studentId)}
        title="Delete Student Record"
        message={`Are you sure you want to remove "${studentToDelete?.fullName}" (${studentToDelete?.studentNumber})? This can only be done if the student has no active loans.`}
        confirmText="Delete Record"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
