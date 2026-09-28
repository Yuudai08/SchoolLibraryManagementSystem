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
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <Spinner size="lg" label="Loading student directory..." className="h-64" />
        ) : !pagedStudents || pagedStudents.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Students Found"
            description={
              search
                ? 'No students matched your search criteria.'
                : 'No student patrons registered yet. Add students to enable book checkouts.'
            }
            actionText="Register First Student"
            onAction={handleOpenAdd}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Student ID</th>
                    <th className="px-5 py-3">Full Name</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Active Loans</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pagedStudents.items.map((student) => (
                    <tr key={student.studentId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-slate-800 font-medium">
                        {student.studentNumber}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 text-sm">
                        {student.fullName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {student.department || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-900 font-mono">
                          {student.activeLoanCount}
                        </span>
                        <span className="text-slate-400 font-mono"> / 5</span>
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
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Loan History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setStudentToDelete(student)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
