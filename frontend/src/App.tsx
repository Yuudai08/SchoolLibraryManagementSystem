import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Layout } from './components/layout/Layout';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CirculationDesk } from './pages/circulation/CirculationDesk';
import { BookList } from './pages/books/BookList';
import { StudentList } from './pages/students/StudentList';
import { LoanList } from './pages/loans/LoanList';
import { FineList } from './pages/fines/FineList';
import { CategoryList } from './pages/categories/CategoryList';
import { ReportsDashboard } from './pages/reports/ReportsDashboard';

// Configure TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0f172a',
                color: '#fff',
                fontSize: '13px',
                borderRadius: '10px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected dashboard routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/circulation" element={<CirculationDesk />} />
                <Route path="/books" element={<BookList />} />
                <Route path="/students" element={<StudentList />} />
                <Route path="/loans" element={<LoanList />} />
                <Route path="/fines" element={<FineList />} />
                <Route path="/categories" element={<CategoryList />} />
                <Route path="/reports" element={<ReportsDashboard />} />
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
