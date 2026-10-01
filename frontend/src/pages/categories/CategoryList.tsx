import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tags, Edit2, Trash2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoriesApi } from '../../api/services';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Spinner } from '../../components/common/Spinner';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { getErrorMessage } from '../../api/client';

export const CategoryList: React.FC = () => {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoriesApi.createCategory(data),
    onSuccess: () => {
      toast.success('Category created successfully!');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCategoryRequest) =>
      categoriesApi.updateCategory(editingCategory!.categoryId, data),
    onSuccess: () => {
      toast.success('Category updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      toast.success('Category removed.');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeletingCategory(null);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setDescription(c.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      updateMutation.mutate({
        name: name.trim(),
        description: description.trim() || undefined,
      });
    } else {
      createMutation.mutate({
        name: name.trim(),
        description: description.trim() || undefined,
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-stone-900 tracking-tight">
            Classification & Subject Categories ({categories?.length || 0})
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Organize catalog inventory into academic departments and subject genres
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : !categories || categories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="No Categories Found"
            description="Create categories like Computer Science, Literature, Mathematics to classify your books."
            actionText="Add Category"
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/70 text-stone-600 font-semibold tracking-tight border-b border-stone-200/80">
                <tr>
                  <th className="px-5 py-3">Category Name</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Catalog Titles</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {categories.map((category) => (
                  <tr key={category.categoryId} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-stone-900">
                      {category.name}
                    </td>
                    <td className="px-5 py-3.5 text-stone-500 max-w-md truncate">
                      {category.description || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-brand-50 text-brand-800 border border-brand-200/80">
                        <BookOpen className="w-3.5 h-3.5 stroke-[1.8]" />
                        <span className="font-mono tabular-nums">{category.bookCount}</span> books
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(category)}
                          className="p-1.5 text-stone-400 hover:text-brand-700 hover:bg-brand-50/70 rounded-lg transition-colors cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (category.bookCount > 0) {
                              toast.error(`Cannot delete "${category.name}" because it contains ${category.bookCount} books.`);
                              return;
                            }
                            setDeletingCategory(category);
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            category.bookCount > 0
                              ? 'text-stone-300 cursor-not-allowed'
                              : 'text-stone-400 hover:text-rose-600 hover:bg-rose-50/70'
                          }`}
                          title={
                            category.bookCount > 0
                              ? 'Category in use — cannot delete'
                              : 'Delete Category'
                          }
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
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Book Category'}
        subtitle="Specify category name and description"
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            required
            placeholder="e.g. Computer Science"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Software engineering, algorithms, database systems..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 text-sm text-slate-900 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={() => deletingCategory && deleteMutation.mutate(deletingCategory.categoryId)}
        title="Delete Category"
        message={`Are you sure you want to delete category "${deletingCategory?.name}"?`}
        confirmText="Delete Category"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
