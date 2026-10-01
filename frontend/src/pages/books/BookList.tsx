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
import { TableSkeleton } from '../../components/common/Skeleton';
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
              className="w-full bg-white border border-stone-300/80 rounded-lg px-3 py-2 text-sm text-stone-800 shadow-soft focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
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
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : !pagedBooks || pagedBooks.items.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Books Found"
            description={
              search || selectedCategory
                ? 'No catalog titles matched your active search or category filter. Try clearing filters.'
                : 'Your library catalog is empty. Start adding books to track inventory, shelves, and loans.'
            }
            actionText="Add First Book"
            onAction={handleOpenAdd}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/70 text-stone-600 font-semibold tracking-tight border-b border-stone-200/80">
                  <tr>
                    <th className="px-5 py-3">Book Info</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">ISBN</th>
                    <th className="px-5 py-3">Availability</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {pagedBooks.items.map((book) => {
                    const isOutOfStock = book.availableCopies === 0;
                    const isLowStock = book.availableCopies > 0 && book.availableCopies <= 2;

                    return (
                      <tr key={book.bookId} className="hover:bg-stone-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-stone-900 text-sm tracking-tight">{book.title}</p>
                          <p className="text-stone-500 text-xs mt-0.5">{book.author}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="bg-stone-100/90 text-stone-700 px-2.5 py-1 rounded-md text-xs font-medium border border-stone-200/80">
                            {book.categoryName}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono tabular-nums text-stone-500">
                          {book.isbn || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-stone-900 font-mono tabular-nums text-xs">
                            {book.availableCopies}
                          </span>
                          <span className="text-stone-400 font-mono tabular-nums text-xs"> / {book.totalCopies} copies</span>
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
                              className="p-1.5 text-stone-400 hover:text-brand-700 hover:bg-brand-50/70 rounded-lg transition-colors cursor-pointer"
                              title="Edit Book"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setBookToDelete(book)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50/70 rounded-lg transition-colors cursor-pointer"
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
