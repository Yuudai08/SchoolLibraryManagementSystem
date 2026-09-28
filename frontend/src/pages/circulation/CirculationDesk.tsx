import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  BookOpen,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studentsApi, booksApi, loansApi } from '../../api/services';
import { Student, BookListItem, Loan } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
import { useDebounce } from '../../hooks/useDebounce';
import { getErrorMessage } from '../../api/client';

export const CirculationDesk: React.FC = () => {
  const queryClient = useQueryClient();

  // Student search state
  const [studentSearch, setStudentSearch] = useState('');
  const debouncedStudentSearch = useDebounce(studentSearch, 300);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Issue Book modal state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  const debouncedBookSearch = useDebounce(bookSearch, 300);
  const [selectedBook, setSelectedBook] = useState<BookListItem | null>(null);

  // Due Date (defaults to 14 days ahead)
  const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [dueDate, setDueDate] = useState(defaultDueDate);

  // Return Book modal state
  const [returningLoan, setReturningLoan] = useState<Loan | null>(null);

  // Query: Student Search Autocomplete
  const { data: studentResults, isFetching: isSearchingStudents } = useQuery({
    queryKey: ['studentsSearch', debouncedStudentSearch],
    queryFn: () => studentsApi.getStudents({ search: debouncedStudentSearch, pageSize: 6 }),
    enabled: debouncedStudentSearch.trim().length >= 1,
  });

  // Query: Fetch full details for selected student (to ensure fresh loan count and status)
  const { data: freshStudent } = useQuery({
    queryKey: ['studentDetail', selectedStudent?.studentId],
    queryFn: () => studentsApi.getStudent(selectedStudent!.studentId),
    enabled: !!selectedStudent,
  });

  const activeStudent = freshStudent || selectedStudent;

  // Query: Fetch selected student's active loans
  const { data: activeLoans, isLoading: isLoadingLoans } = useQuery({
    queryKey: ['studentActiveLoans', activeStudent?.studentId],
    queryFn: () => studentsApi.getActiveLoans(activeStudent!.studentId),
    enabled: !!activeStudent,
  });

  // Query: Book search for issuing
  const { data: bookResults, isFetching: isSearchingBooks } = useQuery({
    queryKey: ['booksSearch', debouncedBookSearch],
    queryFn: () => booksApi.getBooks({ search: debouncedBookSearch, pageSize: 6 }),
    enabled: isIssueModalOpen && debouncedBookSearch.trim().length >= 1,
  });

  // Mutation: Borrow Book
  const borrowMutation = useMutation({
    mutationFn: loansApi.borrowBook,
    onSuccess: (newLoan) => {
      toast.success(`Book "${newLoan.bookTitle}" issued successfully!`);
      setIsIssueModalOpen(false);
      setSelectedBook(null);
      setBookSearch('');
      queryClient.invalidateQueries({ queryKey: ['studentActiveLoans'] });
      queryClient.invalidateQueries({ queryKey: ['studentDetail'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Mutation: Return Book
  const returnMutation = useMutation({
    mutationFn: (loanId: number) => loansApi.returnBook(loanId),
    onSuccess: (result) => {
      if (result.hasFine) {
        toast(() => (
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-rose-600">Book Returned with Fine!</span>
            <span className="text-xs text-slate-600">
              Overdue by {result.overdueDays} days. Fine of {formatCurrency(result.fineAmount)} accrued.
            </span>
          </div>
        ), { icon: '⚠️', duration: 6000 });
      } else {
        toast.success('Book returned successfully on time!');
      }

      setReturningLoan(null);
      queryClient.invalidateQueries({ queryKey: ['studentActiveLoans'] });
      queryClient.invalidateQueries({ queryKey: ['studentDetail'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSelectStudent = (s: Student) => {
    setSelectedStudent(s);
    setStudentSearch('');
  };

  const handleOpenIssue = () => {
    setSelectedBook(null);
    setBookSearch('');
    setDueDate(defaultDueDate);
    setIsIssueModalOpen(true);
  };

  const handleConfirmIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !selectedBook) return;

    borrowMutation.mutate({
      bookId: selectedBook.bookId,
      studentId: activeStudent.studentId,
      dueDate: new Date(dueDate).toISOString(),
    });
  };

  const canStudentBorrow = activeStudent?.isActive && (activeStudent.activeLoanCount < 5);

  return (
    <div className="space-y-6">
      {/* Student Lookup Search Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Find Student Patron
        </label>
        <div className="relative">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by Student ID / Number (e.g. STU-2024-001) or Name..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
            {isSearchingStudents && (
              <div className="absolute right-3 top-3">
                <Spinner size="sm" />
              </div>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {debouncedStudentSearch.trim().length >= 1 && studentResults && studentResults.items.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {studentResults.items.map((stu) => (
                <div
                  key={stu.studentId}
                  onClick={() => handleSelectStudent(stu as unknown as Student)}
                  className="p-3 hover:bg-indigo-50/70 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {stu.firstName.charAt(0)}{stu.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{stu.fullName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{stu.studentNumber} &bull; {stu.department || 'General'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={stu.isActive ? 'success' : 'danger'} size="sm">
                      {stu.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                      {stu.activeLoanCount} / 5 loans
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Student Workspace */}
      {activeStudent ? (
        <div className="space-y-6">
          {/* Student Banner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-indigo-600/20">
                  {activeStudent.firstName?.charAt(0)}{activeStudent.lastName?.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{activeStudent.fullName}</h2>
                    <Badge variant={activeStudent.isActive ? 'success' : 'danger'}>
                      {activeStudent.isActive ? 'Active Patron' : 'Inactive Account'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    ID: {activeStudent.studentNumber} &bull; Dept: {activeStudent.department || 'N/A'} (Year {activeStudent.year || '—'})
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleOpenIssue}
                  disabled={!canStudentBorrow}
                  leftIcon={<ArrowUpRight className="w-4 h-4" />}
                >
                  Issue New Book
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setSelectedStudent(null)}
                >
                  Clear Selection
                </Button>
              </div>
            </div>

            {/* Borrowing Limit and Warnings */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700">Active Borrowing Quota:</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${
                        activeStudent.activeLoanCount >= 5 ? 'bg-rose-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${(activeStudent.activeLoanCount / 5) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold text-slate-900 font-mono">
                    {activeStudent.activeLoanCount} / 5
                  </span>
                </div>
              </div>

              {!activeStudent.isActive && (
                <div className="flex items-center gap-1.5 text-rose-600 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Student account is inactive. Checkout privileges suspended.</span>
                </div>
              )}

              {activeStudent.isActive && activeStudent.activeLoanCount >= 5 && (
                <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Maximum limit reached (5/5). Student must return a book before borrowing.</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Loans Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Currently Borrowed Books ({activeLoans?.length || 0})
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Click Return to check in a book
              </span>
            </div>

            {isLoadingLoans ? (
              <Spinner label="Loading active loans..." />
            ) : !activeLoans || activeLoans.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">No Active Loans</p>
                <p className="text-xs text-slate-400 mt-0.5">This student has returned all borrowed books.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Book Title</th>
                      <th className="px-5 py-3">Author</th>
                      <th className="px-5 py-3">Borrowed On</th>
                      <th className="px-5 py-3">Due Date</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Accrued Fine</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {activeLoans.map((loan) => {
                      const isOverdue = loan.status === 'Overdue' || (loan.daysOverdue && loan.daysOverdue > 0);
                      return (
                        <tr key={loan.loanId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            {loan.bookTitle}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">
                            {loan.bookAuthor}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {formatDate(loan.borrowedDate)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                              {formatDate(loan.dueDate)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant={isOverdue ? 'danger' : 'warning'}>
                              {isOverdue ? `Overdue (${loan.daysOverdue}d)` : 'Borrowed'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5">
                            {isOverdue ? (
                              <span className="font-semibold text-rose-600">
                                {formatCurrency(loan.currentFine || 0)}
                              </span>
                            ) : (
                              <span className="text-slate-400">Rs. 0.00</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReturningLoan(loan)}
                              leftIcon={<ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />}
                            >
                              Return Book
                            </Button>
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
      ) : (
        /* Empty Prompt */
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <User className="w-12 h-12 text-indigo-500/50 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">Select a Student to Begin Circulation</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Search by student number or name in the box above to manage their checked out books, process instant returns, and issue new books.
          </p>
        </div>
      )}

      {/* ISSUE BOOK MODAL */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue Book to Student"
        subtitle={`Borrower: ${activeStudent?.fullName} (${activeStudent?.studentNumber})`}
        maxWidth="lg"
      >
        <form onSubmit={handleConfirmIssue} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Search Book Catalog
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Type book title, author, or ISBN..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                autoFocus
              />
              {isSearchingBooks && (
                <div className="absolute right-3 top-3">
                  <Spinner size="sm" />
                </div>
              )}
            </div>

            {/* Book search results list */}
            {bookResults && bookResults.items.length > 0 && (
              <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {bookResults.items.map((b) => {
                  const isAvailable = b.availableCopies > 0;
                  const isSelected = selectedBook?.bookId === b.bookId;
                  return (
                    <div
                      key={b.bookId}
                      onClick={() => isAvailable && setSelectedBook(b)}
                      className={`p-3 flex items-center justify-between text-xs transition-colors ${
                        !isAvailable
                          ? 'opacity-50 bg-slate-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-indigo-50 border-l-4 border-indigo-600'
                          : 'hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{b.title}</p>
                        <p className="text-slate-500 mt-0.5">{b.author} &bull; {b.categoryName}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={isAvailable ? 'success' : 'danger'} size="sm">
                          {isAvailable ? `${b.availableCopies} available` : 'Out of Stock'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedBook && (
            <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-indigo-600 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-900">{selectedBook.title}</p>
                <p className="text-[11px] text-slate-600">{selectedBook.author} &bull; {selectedBook.categoryName}</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Selected
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Return Due Date
            </label>
            <Input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              leftIcon={<Calendar className="w-4 h-4" />}
            />
            <p className="text-[11px] text-slate-500 mt-1">Standard loan period is 14 days.</p>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsIssueModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!selectedBook}
              isLoading={borrowMutation.isPending}
            >
              Confirm & Issue Book
            </Button>
          </div>
        </form>
      </Modal>

      {/* RETURN BOOK CONFIRMATION MODAL */}
      <Modal
        isOpen={!!returningLoan}
        onClose={() => setReturningLoan(null)}
        title="Check-In / Return Book"
        subtitle={`Student: ${returningLoan?.studentName}`}
        maxWidth="md"
      >
        {returningLoan && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900">{returningLoan.bookTitle}</h4>
              <p className="text-xs text-slate-600 mt-0.5">{returningLoan.bookAuthor}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-slate-200 pt-2">
                <div>
                  <span className="text-slate-500">Borrowed:</span>{' '}
                  <span className="font-medium text-slate-800">{formatDate(returningLoan.borrowedDate)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Due Date:</span>{' '}
                  <span className="font-medium text-slate-800">{formatDate(returningLoan.dueDate)}</span>
                </div>
              </div>
            </div>

            {/* Overdue check preview */}
            {returningLoan.daysOverdue && returningLoan.daysOverdue > 0 ? (
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs">
                <div className="flex items-center gap-2 font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Late Return Penalty</span>
                </div>
                <p className="text-rose-600 mt-1">
                  This loan is overdue by <span className="font-bold">{returningLoan.daysOverdue} days</span>. A fine of{' '}
                  <span className="font-bold">{formatCurrency(returningLoan.currentFine || 0)}</span> will be recorded upon return.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center gap-2 text-emerald-700">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>On-time return. No penalty charges apply. Available copy will be restored.</span>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
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
