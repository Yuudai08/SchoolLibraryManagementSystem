import { apiClient } from './client';
import {
  ApiResponse,
  PagedResult,
  LoginRequest,
  LoginResponse,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  Book,
  BookListItem,
  CreateBookRequest,
  UpdateBookRequest,
  BookSearchParams,
  Student,
  StudentListItem,
  CreateStudentRequest,
  UpdateStudentRequest,
  StudentSearchParams,
  Loan,
  CreateLoanRequest,
  ReturnLoanResponse,
  LoanSearchParams,
  Fine,
  DashboardSummary,
  RecentLoan,
  PopularBook,
  InventoryReportItem,
  BorrowingReportItem,
  OverdueReportItem,
  FineReportItem,
} from '../types';

// Auth Services
export const authApi = {
  login: async (request: LoginRequest): Promise<LoginResponse> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', request);
    return res.data.data;
  },
};

// Books Services
export const booksApi = {
  getBooks: async (params?: BookSearchParams): Promise<PagedResult<BookListItem>> => {
    const res = await apiClient.get<ApiResponse<PagedResult<BookListItem>>>('/books', { params });
    return res.data.data;
  },
  getBook: async (id: number): Promise<Book> => {
    const res = await apiClient.get<ApiResponse<Book>>(`/books/${id}`);
    return res.data.data;
  },
  createBook: async (data: CreateBookRequest): Promise<Book> => {
    const res = await apiClient.post<ApiResponse<Book>>('/books', data);
    return res.data.data;
  },
  updateBook: async (id: number, data: UpdateBookRequest): Promise<Book> => {
    const res = await apiClient.put<ApiResponse<Book>>(`/books/${id}`, data);
    return res.data.data;
  },
  deleteBook: async (id: number): Promise<void> => {
    await apiClient.delete(`/books/${id}`);
  },
};

// Categories Services
export const categoriesApi = {
  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<ApiResponse<Category[]>>('/categories');
    return res.data.data;
  },
  getCategory: async (id: number): Promise<Category> => {
    const res = await apiClient.get<ApiResponse<Category>>(`/categories/${id}`);
    return res.data.data;
  },
  createCategory: async (data: CreateCategoryRequest): Promise<Category> => {
    const res = await apiClient.post<ApiResponse<Category>>('/categories', data);
    return res.data.data;
  },
  updateCategory: async (id: number, data: UpdateCategoryRequest): Promise<Category> => {
    const res = await apiClient.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return res.data.data;
  },
  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};

// Students Services
export const studentsApi = {
  getStudents: async (params?: StudentSearchParams): Promise<PagedResult<StudentListItem>> => {
    const res = await apiClient.get<ApiResponse<PagedResult<StudentListItem>>>('/students', { params });
    return res.data.data;
  },
  getStudent: async (id: number): Promise<Student> => {
    const res = await apiClient.get<ApiResponse<Student>>(`/students/${id}`);
    return res.data.data;
  },
  getActiveLoans: async (studentId: number): Promise<Loan[]> => {
    const res = await apiClient.get<ApiResponse<Loan[]>>(`/students/${studentId}/loans`);
    return res.data.data;
  },
  getLoanHistory: async (studentId: number): Promise<Loan[]> => {
    const res = await apiClient.get<ApiResponse<Loan[]>>(`/students/${studentId}/history`);
    return res.data.data;
  },
  createStudent: async (data: CreateStudentRequest): Promise<Student> => {
    const res = await apiClient.post<ApiResponse<Student>>('/students', data);
    return res.data.data;
  },
  updateStudent: async (id: number, data: UpdateStudentRequest): Promise<Student> => {
    const res = await apiClient.put<ApiResponse<Student>>(`/students/${id}`, data);
    return res.data.data;
  },
  deleteStudent: async (id: number): Promise<void> => {
    await apiClient.delete(`/students/${id}`);
  },
};

// Loans Services
export const loansApi = {
  getLoans: async (params?: LoanSearchParams): Promise<PagedResult<Loan>> => {
    const res = await apiClient.get<ApiResponse<PagedResult<Loan>>>('/loans', { params });
    return res.data.data;
  },
  getOverdueLoans: async (page = 1, pageSize = 20): Promise<PagedResult<Loan>> => {
    const res = await apiClient.get<ApiResponse<PagedResult<Loan>>>('/loans/overdue', {
      params: { page, pageSize },
    });
    return res.data.data;
  },
  getLoan: async (id: number): Promise<Loan> => {
    const res = await apiClient.get<ApiResponse<Loan>>(`/loans/${id}`);
    return res.data.data;
  },
  borrowBook: async (data: CreateLoanRequest): Promise<Loan> => {
    const res = await apiClient.post<ApiResponse<Loan>>('/loans', data);
    return res.data.data;
  },
  returnBook: async (loanId: number): Promise<ReturnLoanResponse> => {
    const res = await apiClient.post<ApiResponse<ReturnLoanResponse>>(`/loans/${loanId}/return`);
    return res.data.data;
  },
};

// Fines Services
export const finesApi = {
  getFines: async (unpaidOnly?: boolean): Promise<Fine[]> => {
    const res = await apiClient.get<ApiResponse<Fine[]>>('/fines', {
      params: unpaidOnly !== undefined ? { unpaidOnly } : {},
    });
    return res.data.data;
  },
  getFine: async (id: number): Promise<Fine> => {
    const res = await apiClient.get<ApiResponse<Fine>>(`/fines/${id}`);
    return res.data.data;
  },
  payFine: async (id: number): Promise<string> => {
    const res = await apiClient.post<ApiResponse<string>>(`/fines/${id}/pay`);
    return res.data.data;
  },
};

// Dashboard Services
export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return res.data.data;
  },
  getRecentLoans: async (limit = 10): Promise<RecentLoan[]> => {
    const res = await apiClient.get<ApiResponse<RecentLoan[]>>('/dashboard/recent-loans', {
      params: { limit },
    });
    return res.data.data;
  },
  getPopularBooks: async (limit = 5): Promise<PopularBook[]> => {
    const res = await apiClient.get<ApiResponse<PopularBook[]>>('/dashboard/popular-books', {
      params: { limit },
    });
    return res.data.data;
  },
};

// Reports Services
export const reportsApi = {
  getInventory: async (): Promise<InventoryReportItem[]> => {
    const res = await apiClient.get<ApiResponse<InventoryReportItem[]>>('/reports/inventory');
    return res.data.data;
  },
  getBorrowing: async (): Promise<BorrowingReportItem[]> => {
    const res = await apiClient.get<ApiResponse<BorrowingReportItem[]>>('/reports/borrowing');
    return res.data.data;
  },
  getOverdue: async (): Promise<OverdueReportItem[]> => {
    const res = await apiClient.get<ApiResponse<OverdueReportItem[]>>('/reports/overdue');
    return res.data.data;
  },
  getFines: async (): Promise<FineReportItem[]> => {
    const res = await apiClient.get<ApiResponse<FineReportItem[]>>('/reports/fines');
    return res.data.data;
  },
  getPopularBooks: async (limit = 10): Promise<PopularBook[]> => {
    const res = await apiClient.get<ApiResponse<PopularBook[]>>('/reports/popular-books', {
      params: { limit },
    });
    return res.data.data;
  },
};
