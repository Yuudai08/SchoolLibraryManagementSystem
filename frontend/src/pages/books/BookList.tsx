import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { booksApi, categoriesApi } from '../../api/services';
import { BookListItem, Book } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import { Button } from '../../components/common/Button';
import { SearchInput } from '../../components/common/SearchInput';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { BookModal } from './BookModal';
import { getErrorMessage } from '../../api/client';

export const BookList: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<BookListItem | null>(null);

  // Fetch categories for filtering
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });

  // Fetch books with filters & pagination
  const { data: pagedBooks, isLoading } = useQuery({
    queryKey: ['books', debouncedSearch, selectedCategory, page],
    queryFn: () =>
      booksApi.getBooks({
        search: debouncedSearch || undefined,
        categoryId: selectedCategory ? Number(selectedCategory) : undefined,
        page,
        pageSize,
      }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => booksApi.deleteBook(id),
    onSuccess: () => {
      toast.success('Book deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setBookToDelete(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleOpenAdd = () => {
    setBookToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (bookItem: BookListItem) => {
    try {
      const fullBook = await booksApi.getBook(bookItem.bookId);
      setBookToEdit(fullBook);
      setIsModalOpen(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search books by title, author, or ISBN..."
            className="flex-1"
          />

          <div className="w-full sm:w-48 shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categories?.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Book
        </Button>
      </div>

      {/* Books Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <Spinner size="lg" label="Loading books catalog..." className="h-64" />
        ) : !pagedBooks || pagedBooks.items.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Books Found"
            description={
              search || selectedCategory
                ? 'No books matched your search or category filter. Try clearing filters.'
                : 'Your library catalog is empty. Start adding books to track inventory and loans.'
            }
            actionText="Add First Book"
            onAction={handleOpenAdd}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Book Info</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">ISBN</th>
                    <th className="px-5 py-3">Availability</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pagedBooks.items.map((book) => {
                    const isOutOfStock = book.availableCopies === 0;
                    const isLowStock = book.availableCopies > 0 && book.availableCopies <= 2;

                    return (
                      <tr key={book.bookId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900 text-sm">{book.title}</p>
                          <p className="text-slate-500 text-xs">{book.author}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200">
                            {book.categoryName}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-500">
                          {book.isbn || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-900 font-mono text-xs">
                            {book.availableCopies}
                          </span>
                          <span className="text-slate-400 font-mono text-xs"> / {book.totalCopies} copies</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'}
                          >
                            {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'Available'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(book)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Book"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setBookToDelete(book)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Book"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={pagedBooks.page}
              totalPages={pagedBooks.totalPages}
              totalCount={pagedBooks.totalCount}
              pageSize={pagedBooks.pageSize}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>

      {/* Book Add/Edit Modal */}
      <BookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookToEdit={bookToEdit}
      />

      {/* Book Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!bookToDelete}
        onClose={() => setBookToDelete(null)}
        onConfirm={() => bookToDelete && deleteMutation.mutate(bookToDelete.bookId)}
        title="Delete Book from Catalog"
        message={`Are you sure you want to delete "${bookToDelete?.title}"? This cannot be undone if the book has no active loans.`}
        confirmText="Delete Book"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
