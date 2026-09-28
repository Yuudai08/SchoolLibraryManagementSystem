// Common API Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  fullName: string;
  email: string;
  expiresAt: string;
}

export interface User {
  fullName: string;
  email: string;
}

// Category Types
export interface Category {
  categoryId: number;
  name: string;
  description?: string;
  bookCount: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
}

// Book Types
export interface Book {
  bookId: number;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  categoryId: number;
  categoryName: string;
  description?: string;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
  createdAt: string;
  updatedAt?: string;
}

export interface BookListItem {
  bookId: number;
  title: string;
  author: string;
  isbn?: string;
  categoryName: string;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
}

export interface CreateBookRequest {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  categoryId: number;
  description?: string;
  totalCopies: number;
  availableCopies: number;
}

export interface UpdateBookRequest {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  categoryId: number;
  description?: string;
  totalCopies: number;
  availableCopies: number;
}

export interface BookSearchParams {
  search?: string;
  categoryId?: number;
  page?: number;
  pageSize?: number;
}

// Student Types
export interface Student {
  studentId: number;
  studentNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  department?: string;
  year?: number;
  isActive: boolean;
  activeLoanCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface StudentListItem {
  studentId: number;
  studentNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  department?: string;
  isActive: boolean;
  activeLoanCount: number;
}

export interface CreateStudentRequest {
  studentNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  department?: string;
  year?: number;
}

export interface UpdateStudentRequest {
  studentNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  department?: string;
  year?: number;
  isActive: boolean;
}

export interface StudentSearchParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

// Loan Types
export type LoanStatus = 'Borrowed' | 'Returned' | 'Overdue';

export interface Loan {
  loanId: number;
  bookId: number;
  bookTitle: string;
  bookAuthor: string;
  studentId: number;
  studentName: string;
  studentNumber: string;
  borrowedDate: string;
  dueDate: string;
  returnedDate?: string;
  status: LoanStatus;
  daysOverdue?: number;
  currentFine?: number;
}

export interface CreateLoanRequest {
  bookId: number;
  studentId: number;
  dueDate: string;
}

export interface ReturnLoanResponse {
  loanId: number;
  returnedDate: string;
  overdueDays: number;
  fineAmount: number;
  hasFine: boolean;
}

export interface LoanSearchParams {
  studentId?: number;
  bookId?: number;
  status?: number; // 0=Borrowed, 1=Returned, 2=Overdue
  overdueOnly?: boolean;
  page?: number;
  pageSize?: number;
}

// Fine Types
export interface Fine {
  fineId: number;
  loanId: number;
  bookTitle: string;
  studentName: string;
  studentNumber: string;
  amount: number;
  isPaid: boolean;
  paidDate?: string;
  createdAt: string;
}

// Dashboard Types
export interface DashboardSummary {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
  totalStudents: number;
  activeLoans: number;
  overdueLoans: number;
  unpaidFines: number;
}

export interface RecentLoan {
  studentName: string;
  bookTitle: string;
  borrowedDate: string;
  dueDate: string;
}

export interface PopularBook {
  bookId: number;
  title: string;
  author: string;
  totalLoans: number;
}

// Report Types
export interface InventoryReportItem {
  title: string;
  author: string;
  categoryName: string;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
}

export interface BorrowingReportItem {
  studentName: string;
  studentNumber: string;
  bookTitle: string;
  borrowedDate: string;
  dueDate: string;
  returnedDate?: string;
  status: string;
}

export interface OverdueReportItem {
  studentName: string;
  studentNumber: string;
  bookTitle: string;
  dueDate: string;
  daysOverdue: number;
  currentFine: number;
}

export interface FineReportItem {
  studentName: string;
  studentNumber: string;
  bookTitle: string;
  fineAmount: number;
  isPaid: boolean;
  paidDate?: string;
}
