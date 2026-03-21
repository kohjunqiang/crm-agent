'use client';

import { useState } from 'react';
import type { Product, ProductCategory } from '@agent-crm/shared';
import {
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from '@/app/actions/products';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X } from 'lucide-react';

interface CategoryManagerProps {
  categories: ProductCategory[];
  products: Product[];
  onUpdate: () => void;
}

// ----------------------------------------------------------------
// CategoryRow
// ----------------------------------------------------------------

interface CategoryRowProps {
  category: ProductCategory;
  productCount: number;
  isFirst: boolean;
  isLast: boolean;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => Promise<void>;
  onMoveDown: (id: string) => Promise<void>;
}

function CategoryRow({
  category,
  productCount,
  isFirst,
  isLast,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
}: CategoryRowProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setEditName(category.name);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditName(category.name);
    setEditing(false);
  };

  const saveEdit = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === category.name) {
      cancelEdit();
      return;
    }
    setSaving(true);
    try {
      await onRename(category.id, trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
      {editing ? (
        <>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            className="h-6 flex-1 text-xs"
            autoFocus
            disabled={saving}
          />
          <button
            type="button"
            onClick={saveEdit}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Save"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-xs font-medium">{category.name}</span>
          <span className="text-[10px] text-muted-foreground">
            {productCount} {productCount === 1 ? 'product' : 'products'}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onMoveUp(category.id)}
              disabled={isFirst}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Move up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMoveDown(category.id)}
              disabled={isLast}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Move down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={startEdit}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Rename ${category.name}`}
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(category.id)}
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Delete ${category.name}`}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// CategoryManager
// ----------------------------------------------------------------

export function CategoryManager({
  categories,
  products,
  onUpdate,
}: CategoryManagerProps) {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const productCountByCategory = new Map<string, number>();
  for (const product of products) {
    if (product.category_id) {
      productCountByCategory.set(
        product.category_id,
        (productCountByCategory.get(product.category_id) ?? 0) + 1,
      );
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setAdding(true);
    try {
      const maxOrder = categories.reduce(
        (max, c) => Math.max(max, c.sort_order),
        0,
      );
      await createProductCategory({ name, sort_order: maxOrder + 1 });
      setNewName('');
      onUpdate();
      toast.success('Category added.');
    } catch {
      toast.error('Failed to add category.');
    } finally {
      setAdding(false);
    }
  };

  const handleRename = async (id: string, name: string) => {
    try {
      await updateProductCategory(id, { name });
      onUpdate();
    } catch {
      toast.error('Failed to rename category.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteProductCategory(deleteConfirmId);
      onUpdate();
      toast.success('Category deleted.');
    } catch {
      toast.error('Failed to delete category.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleMoveUp = async (id: string) => {
    const idx = categories.findIndex((c) => c.id === id);
    if (idx <= 0) return;
    const above = categories[idx - 1]!;
    const current = categories[idx]!;
    try {
      await Promise.all([
        updateProductCategory(current.id, { sort_order: above.sort_order }),
        updateProductCategory(above.id, { sort_order: current.sort_order }),
      ]);
      onUpdate();
    } catch {
      toast.error('Failed to reorder categories.');
    }
  };

  const handleMoveDown = async (id: string) => {
    const idx = categories.findIndex((c) => c.id === id);
    if (idx < 0 || idx >= categories.length - 1) return;
    const below = categories[idx + 1]!;
    const current = categories[idx]!;
    try {
      await Promise.all([
        updateProductCategory(current.id, { sort_order: below.sort_order }),
        updateProductCategory(below.id, { sort_order: current.sort_order }),
      ]);
      onUpdate();
    } catch {
      toast.error('Failed to reorder categories.');
    }
  };

  const deleteTarget = categories.find((c) => c.id === deleteConfirmId);
  const deleteCount = deleteConfirmId
    ? (productCountByCategory.get(deleteConfirmId) ?? 0)
    : 0;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-semibold">Categories</span>

      {categories.length === 0 ? (
        <p className="text-xs text-muted-foreground">No categories yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {categories.map((cat, i) => (
            <CategoryRow
              key={cat.id}
              category={cat}
              productCount={productCountByCategory.get(cat.id) ?? 0}
              isFirst={i === 0}
              isLast={i === categories.length - 1}
              onRename={handleRename}
              onDelete={setDeleteConfirmId}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))}
        </div>
      )}

      {/* Add category form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="h-7 flex-1 text-xs"
          disabled={adding}
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="h-7 gap-1 px-2 text-xs"
          disabled={adding || !newName.trim()}
        >
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </form>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteCount > 0
              ? `This category has ${deleteCount} ${deleteCount === 1 ? 'product' : 'products'}. They will become uncategorized.`
              : `Are you sure you want to delete "${deleteTarget?.name}"?`}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
