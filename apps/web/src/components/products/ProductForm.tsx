'use client';

import { useState } from 'react';
import type { Product, ProductVariant, ProductCategory } from '@agent-crm/shared';
import {
  createProduct,
  updateProduct,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
} from '@/app/actions/products';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';

interface VariantDraft {
  id?: string;
  name: string;
  sell_price: string;
  cost_price: string;
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ProductCategory[];
  product?: Product & { variants: ProductVariant[] };
  onSave: () => void;
}

export function ProductForm({
  open,
  onOpenChange,
  categories,
  product,
  onSave,
}: ProductFormProps) {
  const isEdit = !!product;

  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '');
  const [sellPrice, setSellPrice] = useState(
    product?.sell_price != null ? String(product.sell_price) : '',
  );
  const [costPrice, setCostPrice] = useState(
    product?.cost_price != null ? String(product.cost_price) : '',
  );
  const [variants, setVariants] = useState<VariantDraft[]>(
    product?.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sell_price: v.sell_price != null ? String(v.sell_price) : '',
      cost_price: v.cost_price != null ? String(v.cost_price) : '',
    })) ?? [],
  );
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { name: '', sell_price: '', cost_price: '' },
    ]);
  };

  const updateVariant = (
    index: number,
    field: keyof VariantDraft,
    value: string,
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  };

  const removeVariant = (index: number) => {
    const variant = variants[index];
    if (variant?.id) {
      setDeletedVariantIds((prev) => [...prev, variant.id!]);
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setPending(true);
    try {
      const productInput = {
        name: name.trim(),
        description: description.trim() || null,
        category_id: categoryId || null,
        sell_price: sellPrice ? parseFloat(sellPrice) : null,
        cost_price: costPrice ? parseFloat(costPrice) : null,
      };

      let savedProductId: string;

      if (isEdit && product) {
        await updateProduct(product.id, productInput);
        savedProductId = product.id;

        // Delete removed variants
        await Promise.all(
          deletedVariantIds.map((id) => deleteProductVariant(id)),
        );
      } else {
        const created = await createProduct(productInput);
        savedProductId = created.id;
      }

      // Save variants
      for (const variant of variants) {
        if (!variant.name.trim()) continue;
        const variantInput = {
          name: variant.name.trim(),
          sell_price: variant.sell_price ? parseFloat(variant.sell_price) : null,
          cost_price: variant.cost_price ? parseFloat(variant.cost_price) : null,
        };
        if (variant.id) {
          await updateProductVariant(variant.id, variantInput);
        } else {
          await createProductVariant(savedProductId, variantInput);
        }
      }

      toast.success(isEdit ? 'Product updated.' : 'Product created.');
      onSave();
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? 'Failed to update product.' : 'Failed to create product.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Core fields */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-name" className="text-xs">
                Name *
              </Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Linen Curtain"
                className="h-8 text-sm"
                autoFocus
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-description" className="text-xs">
                Description
              </Label>
              <Input
                id="product-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="h-8 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Category</Label>
              <Select
                value={categoryId || 'none'}
                onValueChange={(v) => setCategoryId(v === 'none' ? '' : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Uncategorized" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-sm">
                    Uncategorized
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-sm">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="sell-price" className="text-xs">
                  Sell Price
                </Label>
                <Input
                  id="sell-price"
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-8 text-sm"
                  min={0}
                  step="0.01"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="cost-price" className="text-xs">
                  Cost Price
                </Label>
                <Input
                  id="cost-price"
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-8 text-sm"
                  min={0}
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Variants */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Variants</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-2 text-xs"
                onClick={addVariant}
              >
                <Plus className="h-3 w-3" />
                Add Variant
              </Button>
            </div>

            {variants.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No variants. Add variants for different sizes, fabrics, or colours.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Header */}
                <div className="grid grid-cols-[1fr_80px_80px_24px] gap-1.5 px-1">
                  <span className="text-[10px] text-muted-foreground">Name</span>
                  <span className="text-[10px] text-muted-foreground">Sell</span>
                  <span className="text-[10px] text-muted-foreground">Cost</span>
                  <span />
                </div>
                {variants.map((variant, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_80px_80px_24px] items-center gap-1.5"
                  >
                    <Input
                      value={variant.name}
                      onChange={(e) => updateVariant(i, 'name', e.target.value)}
                      placeholder="Variant name"
                      className="h-7 text-xs"
                    />
                    <Input
                      type="number"
                      value={variant.sell_price}
                      onChange={(e) =>
                        updateVariant(i, 'sell_price', e.target.value)
                      }
                      placeholder="0.00"
                      className="h-7 text-xs"
                      min={0}
                      step="0.01"
                    />
                    <Input
                      type="number"
                      value={variant.cost_price}
                      onChange={(e) =>
                        updateVariant(i, 'cost_price', e.target.value)
                      }
                      placeholder="0.00"
                      className="h-7 text-xs"
                      min={0}
                      step="0.01"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="flex items-center justify-center text-muted-foreground hover:text-destructive"
                      aria-label="Remove variant"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending || !name.trim()}>
              {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
