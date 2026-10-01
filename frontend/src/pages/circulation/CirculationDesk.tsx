import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  BookOpen,
  User,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Command,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studentsApi, booksApi, loansApi } from '../../api/services';
import { Student, StudentListItem, BookListItem, Loan } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
import { TableSkeleton } from '../../components/common/Skeleton';
import { Pagination } from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { getErrorMessage } from '../../api/client';

export const CirculationDesk: React.FC = () => {
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Student search state
  const [studentSearch, setStudentSearch] = useState('');
  const debouncedStudentSearch = useDebounce(studentSearch, 300);
  const [studentPage, setStudentPage] = useState(1);
  const studentPageSize = 10;
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener: Press '/' to focus student search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsDropdownOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Query: Student directory & search (fetches all students before searching, filters when searching)
  const {
    data: pagedStudents,
    isLoading: isLoadingStudents,
    isFetching: isFetchingStudents,
  } = useQuery({
    queryKey: ['circulationStudents', debouncedStudentSearch, studentPage],
    queryFn: () =>
      studentsApi.getStudents({
        search: debouncedStudentSearch.trim() || undefined,
        page: studentPage,
        pageSize: studentPageSize,
      }),
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
      queryClient.invalidateQueries({ queryKey: ['circulationStudents'] });
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
      queryClient.invalidateQueries({ queryKey: ['circulationStudents'] });
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

  const handleSelectStudent = (s: Student | StudentListItem) => {
    setSelectedStudent(s as unknown as Student);
    setStudentSearch('');
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClearSearch = () => {
    setStudentSearch('');
    setStudentPage(1);
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
    searchInputRef.current?.focus();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      return;
    }

    if (activeStudent) {
      if (!pagedStudents?.items?.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIsDropdownOpen(true);
        setHighlightedIndex((prev) => (prev < pagedStudents.items.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIsDropdownOpen(true);
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : pagedStudents.items.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const targetIndex = highlightedIndex >= 0 ? highlightedIndex : 0;
        const targetStudent = pagedStudents.items[targetIndex];
        if (targetStudent) {
          handleSelectStudent(targetStudent);
        }
      }
    } else {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (pagedStudents?.items && pagedStudents.items.length > 0) {
          handleSelectStudent(pagedStudents.items[0]);
        }
      }
    }
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Student Lookup Search Bar */}
      <div ref={searchContainerRef} className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-soft">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-stone-700 tracking-tight">
            Lookup Student Patron
          </label>
          <div className="flex items-center gap-1 text-[11px] font-mono text-stone-400 bg-stone-100/80 px-2 py-0.5 rounded border border-stone-200/80">
            <span>Press</span>
            <kbd className="font-semibold text-stone-700">/</kbd>
            <span>to focus</span>
          </div>
        </div>
        <div className="relative">
          <div className="relative">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search by Student ID (e.g. STU-2024-001) or Student Name..."
              value={studentSearch}
              onChange={(e) => {
                setStudentSearch(e.target.value);
                setStudentPage(1);
                if (activeStudent) {
                  setIsDropdownOpen(true);
                  setHighlightedIndex(-1);
                }
              }}
              onFocus={() => {
                if (activeStudent && studentSearch.trim().length >= 1) setIsDropdownOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
              leftIcon={<Search className="w-4 h-4" />}
            />
            <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
              {isFetchingStudents && <Spinner size="sm" />}
              {studentSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 text-stone-400 hover:text-stone-600 rounded-md hover:bg-stone-100 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Autocomplete Dropdown (visible when a student is currently active to quickly switch patron) */}
          {activeStudent && isDropdownOpen && debouncedStudentSearch.trim().length >= 1 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-stone-200/90 rounded-xl shadow-elevated z-30 overflow-hidden divide-y divide-stone-100 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              {isFetchingStudents && (!pagedStudents || pagedStudents.items.length === 0) ? (
                <div className="p-4 flex items-center justify-center gap-2 text-xs text-stone-500">
                  <Spinner size="sm" />
                  <span>Searching patrons...</span>
                </div>
              ) : pagedStudents && pagedStudents.items.length > 0 ? (
                <>
                  <div className="px-3.5 py-1.5 bg-stone-50/90 text-[10px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between border-b border-stone-100">
                    <span>Switch Patron ({pagedStudents.totalCount})</span>
                    <span className="font-normal font-sans text-stone-400">Press Enter to select &bull; ↑↓ to navigate</span>
                  </div>
                  {pagedStudents.items.map((stu, index) => {
                    const isHighlighted = highlightedIndex === index;
                    return (
                      <div
                        key={stu.studentId}
                        onClick={() => handleSelectStudent(stu)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`p-3.5 cursor-pointer flex items-center justify-between transition-colors ${
                          isHighlighted ? 'bg-brand-50/80 ring-1 ring-inset ring-brand-200' : 'hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-800 flex items-center justify-center font-bold text-xs border border-brand-200/80">
                            {stu.firstName.charAt(0)}{stu.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-900 tracking-tight">{stu.fullName}</p>
                            <p className="text-[11px] text-stone-500 font-mono tabular-nums">{stu.studentNumber} &bull; {stu.department || 'General'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={stu.isActive ? 'success' : 'danger'} size="sm">
                            {stu.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <span className="text-[11px] text-stone-600 bg-stone-100/90 px-2 py-0.5 rounded font-mono tabular-nums">
                            {stu.activeLoanCount} / 5 loans
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="p-5 text-center">
                  <p className="text-xs font-semibold text-stone-700">No student patron found</p>
                  <p className="text-[11px] text-stone-500 mt-1 max-w-sm mx-auto">
                    No matches for &ldquo;{debouncedStudentSearch}&rdquo;. Try searching by student ID (e.g. STU-2024-001) or patron name.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Student Workspace */}
      {activeStudent ? (
        <div className="space-y-6">
          {/* Student Banner */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white flex items-center justify-center text-lg font-bold shadow-soft ring-1 ring-brand-400/20">
                  {activeStudent.firstName?.charAt(0)}{activeStudent.lastName?.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-stone-900 tracking-tight">{activeStudent.fullName}</h2>
                    <Badge variant={activeStudent.isActive ? 'success' : 'danger'}>
                      {activeStudent.isActive ? 'Active Patron' : 'Inactive Account'}
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-500 font-mono tabular-nums mt-0.5">
                    ID: {activeStudent.studentNumber} &bull; Dept: {activeStudent.department || 'General'} (Year {activeStudent.year || '—'})
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
                  Issue Book
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setSelectedStudent(null)}
                  leftIcon={<Users className="w-4 h-4" />}
                >
                  Change Patron
                </Button>
              </div>
            </div>

            {/* Borrowing Limit and Warnings */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-stone-700 tracking-tight">Active Borrowing Quota:</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-stone-200/80 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        activeStudent.activeLoanCount >= 5 ? 'bg-rose-500' : 'bg-brand-600'
                      }`}
                      style={{ width: `${(activeStudent.activeLoanCount / 5) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold text-stone-900 font-mono tabular-nums">
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
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-card overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-700 stroke-[1.8]" />
                <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                  Currently Checked Out Books ({activeLoans?.length || 0})
                </h3>
              </div>
              <span className="text-xs text-stone-500">
                Click Return to process instant return
              </span>
            </div>

            {isLoadingLoans ? (
              <TableSkeleton rows={3} cols={6} />
            ) : !activeLoans || activeLoans.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2 stroke-[1.5]" />
                <p className="text-sm font-bold text-stone-800 tracking-tight">No Active Loans</p>
                <p className="text-xs text-stone-500 mt-0.5">This patron currently has zero unreturned books.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50/70 text-stone-600 font-semibold tracking-tight border-b border-stone-100">
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
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {activeLoans.map((loan) => {
                      const isOverdue = loan.status === 'Overdue' || (loan.daysOverdue && loan.daysOverdue > 0);
                      return (
                        <tr key={loan.loanId} className="hover:bg-stone-50/60 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-stone-900">
                            {loan.bookTitle}
                          </td>
                          <td className="px-5 py-3.5 text-stone-500">
                            {loan.bookAuthor}
                          </td>
                          <td className="px-5 py-3.5 text-stone-600 font-mono tabular-nums text-[11px]">
                            {formatDate(loan.borrowedDate)}
                          </td>
                          <td className="px-5 py-3.5 font-mono tabular-nums text-[11px]">
                            <span className={isOverdue ? 'text-rose-600 font-semibold' : 'text-stone-600'}>
                              {formatDate(loan.dueDate)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant={isOverdue ? 'danger' : 'warning'}>
                              {isOverdue ? `Overdue (${loan.daysOverdue}d)` : 'Borrowed'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 font-mono tabular-nums text-[11px]">
                            {isOverdue ? (
                              <span className="font-semibold text-rose-600">
                                {formatCurrency(loan.currentFine || 0)}
                              </span>
                            ) : (
                              <span className="text-stone-400">Rs. 0.00</span>
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
        /* Student Patrons Directory (Visible before searching) */
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-card overflow-hidden">
          <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200/80 flex items-center justify-center text-brand-800 shrink-0">
                <Users className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                    {debouncedStudentSearch.trim() ? 'Matching Student Patrons' : 'All Student Patrons'}
                  </h3>
                  {pagedStudents && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-mono tabular-nums">
                      {pagedStudents.totalCount} {pagedStudents.totalCount === 1 ? 'student' : 'students'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Select a student patron to manage active loans, issue books, or process instant returns.
                </p>
              </div>
            </div>

            {debouncedStudentSearch.trim() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="text-stone-500 hover:text-stone-800 shrink-0"
              >
                Clear Search Filter
              </Button>
            )}
          </div>

          {isLoadingStudents ? (
            <TableSkeleton rows={8} cols={6} />
          ) : !pagedStudents || pagedStudents.items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-400 shadow-soft mx-auto mb-3">
                <Search className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h4 className="text-sm font-bold text-stone-900 tracking-tight">No students found</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 leading-relaxed">
                {debouncedStudentSearch.trim()
                  ? `No student patron matched "${debouncedStudentSearch}". Try searching by student ID or patron name.`
                  : 'No student patrons are registered in the library system yet.'}
              </p>
              {debouncedStudentSearch.trim() && (
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={handleClearSearch}>
                    Clear Search
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50/70 text-stone-600 font-semibold tracking-tight border-b border-stone-100">
                    <tr>
                      <th className="px-5 py-3">Student Patron</th>
                      <th className="px-5 py-3">Student ID</th>
                      <th className="px-5 py-3">Department</th>
                      <th className="px-5 py-3">Borrowing Quota</th>
                      <th className="px-5 py-3">Account Status</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {pagedStudents.items.map((student) => {
                      const isAtLimit = student.activeLoanCount >= 5;
                      const hasLoans = student.activeLoanCount > 0;
                      return (
                        <tr
                          key={student.studentId}
                          onClick={() => handleSelectStudent(student)}
                          className="hover:bg-brand-50/40 cursor-pointer transition-colors group"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-stone-100 group-hover:bg-brand-100 text-brand-900 group-hover:text-brand-800 flex items-center justify-center font-bold text-xs border border-stone-200/80 group-hover:border-brand-200 transition-colors">
                                {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-stone-900 group-hover:text-brand-900 transition-colors">
                                  {student.fullName}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono tabular-nums text-[11px] font-semibold text-stone-700">
                            <span className="bg-stone-100/90 group-hover:bg-white px-2 py-0.5 rounded border border-stone-200/80 transition-colors">
                              {student.studentNumber}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-stone-600">
                            {student.department || 'General'}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-stone-200/80 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    isAtLimit ? 'bg-rose-500' : hasLoans ? 'bg-brand-600' : 'bg-stone-300'
                                  }`}
                                  style={{ width: `${Math.min((student.activeLoanCount / 5) * 100, 100)}%` }}
                                />
                              </div>
                              <span
                                className={`text-[11px] font-mono tabular-nums font-medium ${
                                  isAtLimit ? 'text-rose-600 font-semibold' : 'text-stone-600'
                                }`}
                              >
                                {student.activeLoanCount} / 5
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant={student.isActive ? 'success' : 'danger'} size="sm">
                              {student.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectStudent(student);
                              }}
                              className="group-hover:border-brand-600 group-hover:text-brand-700 group-hover:bg-white shadow-none"
                              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                            >
                              Select Patron
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={studentPage}
                totalPages={pagedStudents.totalPages}
                totalCount={pagedStudents.totalCount}
                pageSize={studentPageSize}
                onPageChange={setStudentPage}
              />
            </>
          )}
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
            <label className="block text-xs font-semibold text-stone-700 tracking-tight mb-1.5">
              1. Select Book from Catalog
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
              <div className="mt-2 border border-stone-200/90 rounded-xl overflow-hidden divide-y divide-stone-100 max-h-48 overflow-y-auto">
                {bookResults.items.map((b) => {
                  const isAvailable = b.availableCopies > 0;
                  const isSelected = selectedBook?.bookId === b.bookId;
                  return (
                    <div
                      key={b.bookId}
                      onClick={() => isAvailable && setSelectedBook(b)}
                      className={`p-3 flex items-center justify-between text-xs transition-colors ${
                        !isAvailable
                          ? 'opacity-50 bg-stone-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-brand-50/80 border-l-4 border-brand-600'
                          : 'hover:bg-stone-50 cursor-pointer'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-stone-900 tracking-tight">{b.title}</p>
                        <p className="text-stone-500 mt-0.5">{b.author} &bull; {b.categoryName}</p>
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

            {debouncedBookSearch.trim().length >= 1 && !isSearchingBooks && bookResults && bookResults.items.length === 0 && (
              <div className="mt-2 p-4 text-center border border-stone-200/90 rounded-xl bg-stone-50/50">
                <p className="text-xs font-semibold text-stone-700">No books found</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  No books matching &ldquo;{debouncedBookSearch}&rdquo;. Try another title, author, or ISBN.
                </p>
              </div>
            )}
          </div>

          {selectedBook && (
            <div className="p-3 bg-brand-50/70 rounded-xl border border-brand-100 flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-brand-700 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-stone-900">{selectedBook.title}</p>
                <p className="text-[11px] text-stone-600">{selectedBook.author} &bull; {selectedBook.categoryName}</p>
              </div>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                Selected
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 tracking-tight mb-1.5">
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
            <p className="text-[11px] text-stone-500 mt-1 font-mono">Standard loan period is 14 days.</p>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-stone-100">
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
            <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200/90 shadow-soft">
              <h4 className="text-sm font-bold text-stone-900 tracking-tight">{returningLoan.bookTitle}</h4>
              <p className="text-xs text-stone-600 mt-0.5">{returningLoan.bookAuthor}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-stone-200/80 pt-2 font-mono tabular-nums">
                <div>
                  <span className="text-stone-500">Borrowed:</span>{' '}
                  <span className="font-semibold text-stone-800">{formatDate(returningLoan.borrowedDate)}</span>
                </div>
                <div>
                  <span className="text-stone-500">Due Date:</span>{' '}
                  <span className="font-semibold text-stone-800">{formatDate(returningLoan.dueDate)}</span>
                </div>
              </div>
            </div>

            {/* Overdue check preview */}
            {returningLoan.daysOverdue && returningLoan.daysOverdue > 0 ? (
              <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-200/90 text-xs shadow-soft">
                <div className="flex items-center gap-2 font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4 stroke-[1.8]" />
                  <span>Late Return Penalty</span>
                </div>
                <p className="text-rose-700 mt-1 leading-relaxed">
                  This loan is overdue by <span className="font-bold tabular-nums">{returningLoan.daysOverdue} days</span>. A fine of{' '}
                  <span className="font-bold tabular-nums">{formatCurrency(returningLoan.currentFine || 0)}</span> will be recorded upon return.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/90 text-xs flex items-center gap-2 text-emerald-800 shadow-soft">
                <CheckCircle className="w-4 h-4 shrink-0 stroke-[1.8]" />
                <span>On-time return. No penalty charges apply. Available copy will be restored to inventory.</span>
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
