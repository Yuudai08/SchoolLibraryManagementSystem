import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { booksApi, categoriesApi } from '../../api/services';
import { Book, CreateBookRequest, UpdateBookRequest } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { getErrorMessage } from '../../api/client';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookToEdit?: Book | null;
}

export const BookModal: React.FC<BookModalProps> = ({
  isOpen,
  onClose,
  bookToEdit,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!bookToEdit;

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publicationYear, setPublicationYear] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [totalCopies, setTotalCopies] = useState<number>(1);
  const [availableCopies, setAvailableCopies] = useState<number>(1);

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
    enabled: isOpen,
  });

  useEffect(() => {
    if (bookToEdit) {
      setTitle(bookToEdit.title);
      setAuthor(bookToEdit.author);
      setIsbn(bookToEdit.isbn || '');
      setPublisher(bookToEdit.publisher || '');
      setPublicationYear(bookToEdit.publicationYear || '');
      setCategoryId(bookToEdit.categoryId);
      setDescription(bookToEdit.description || '');
      setTotalCopies(bookToEdit.totalCopies);
      setAvailableCopies(bookToEdit.availableCopies);
    } else {
      setTitle('');
      setAuthor('');
      setIsbn('');
      setPublisher('');
      setPublicationYear(new Date().getFullYear());
      setCategoryId(categories && categories.length > 0 ? categories[0].categoryId : '');
      setDescription('');
      setTotalCopies(1);
      setAvailableCopies(1);
    }
  }, [bookToEdit, isOpen, categories]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateBookRequest) => booksApi.createBook(data),
    onSuccess: () => {
      toast.success('Book created successfully!');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateBookRequest) => booksApi.updateBook(bookToEdit!.bookId, data),
    onSuccess: () => {
      toast.success('Book updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      onClose();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      toast.error('Please select a category.');
      return;
    }

    if (availableCopies > totalCopies) {
      toast.error('Available copies cannot exceed total copies.');
      return;
    }

    const payload = {
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim() || undefined,
      publisher: publisher.trim() || undefined,
      publicationYear: publicationYear ? Number(publicationYear) : undefined,
      categoryId: Number(categoryId),
      description: description.trim() || undefined,
      totalCopies: Number(totalCopies),
      availableCopies: Number(availableCopies),
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Book' : 'Add New Book to Catalog'}
      subtitle={isEditing ? `Editing: ${bookToEdit?.title}` : 'Fill in book metadata and inventory quantities'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Book Title"
              required
              placeholder="e.g. Clean Architecture: A Craftsman's Guide"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Author(s)"
              required
              placeholder="e.g. Robert C. Martin"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div>
            <Select
              label="Category"
              required
              placeholder="Select Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              options={
                categories?.map((c) => ({
                  value: c.categoryId,
                  label: c.name,
                })) || []
              }
            />
          </div>

          <div>
            <Input
              label="ISBN"
              maxLength={20}
              placeholder="e.g. 978-0134494166"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Publisher"
              maxLength={100}
              placeholder="e.g. Prentice Hall"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Publication Year"
              type="number"
              min={1000}
              max={2100}
              placeholder="e.g. 2017"
              value={publicationYear}
              onChange={(e) => setPublicationYear(e.target.value ? Number(e.target.value) : '')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Total Copies"
              type="number"
              min={1}
              required
              value={totalCopies}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTotalCopies(val);
                if (!isEditing) setAvailableCopies(val);
              }}
            />
            <Input
              label="Available Copies"
              type="number"
              min={0}
              max={totalCopies}
              required
              value={availableCopies}
              onChange={(e) => setAvailableCopies(Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-stone-700 tracking-tight">
              Book Description / Synopsis
            </label>
            <span className={`text-[11px] font-mono tabular-nums ${description.length > 3900 ? 'text-amber-600 font-semibold' : 'text-stone-400'}`}>
              {description.length} / 4000
            </span>
          </div>
          <textarea
            rows={4}
            maxLength={4000}
            placeholder="Brief summary or subject notes about this book..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full rounded-lg border border-stone-300/80 text-sm text-stone-900 p-2.5 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all shadow-soft placeholder:text-stone-400"
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
            {isEditing ? 'Save Changes' : 'Create Book'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
