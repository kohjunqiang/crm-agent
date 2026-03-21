'use client';

import { useState } from 'react';
import type { Product, ProductVariant, ProductCategory } from '@agent-crm/shared';
import { deleteProduct } from '@/app/actions/products';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { ProductForm } from './ProductForm';

export type ProductWithVariants = Product & { variants: ProductVariant[] };

// ----------------------------------------------------------------
// Margin / price helpers
// ----------------------------------------------------------------

export function calcMargin(sell: number | null, cost: number | null): number | null {
  if (!sell || sell === 0) return null;
  if (cost === null) return null;
  return ((sell - cost) / sell) * 100;
}

export function formatMargin(sell: number | null, cost: number | null): string {
  const margin = calcMargin(sell, cost);
  if (margin === null) return 'N/A';
  return `${margin.toFixed(1)}%`;
}

export function marginClass(sell: number | null, cost: number | null): string {
  const margin = calcMargin(sell, cost);
  if (margin === null) return 'text-muted-foreground';
  return margin < 0 ? 'text-red-600' : '';
}

export function priceRange(values: (number | null)[]): string {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return '—';
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) return `$${min.toFixed(2)}`;
  return `$${min.toFixed(2)}–$${max.toFixed(2)}`;
}

// ----------------------------------------------------------------
// VariantsTable
// ----------------------------------------------------------------

export function VariantsTable({ variants }: { variants: ProductVariant[] }) {
  if (variants.length === 0) {
    return (
      <p className="py-2 text-xs text-muted-foreground">No variants yet.</p>
    );
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b text-left text-[10px] text-muted-foreground">
          <th className="pb-1.5 pr-3 font-medium">Variant</th>
          <th className="pb-1.5 pr-3 font-medium">Size</th>
          <th className="pb-1.5 pr-3 font-medium">Fabric</th>
          <th className="pb-1.5 pr-3 font-medium">Cost</th>
          <th className="pb-1.5 pr-3 font-medium">Sell</th>
          <th className="pb-1.5 font-medium">Margin</th>
        </tr>
      </thead>
      <tbody>
        {variants.map((v) => {
          const attrs = (v.attributes ?? {}) as Record<string, string>;
          return (
            <tr key={v.id} className="border-b last:border-0">
              <td className="py-1.5 pr-3 font-medium">{v.name}</td>
              <td className="py-1.5 pr-3 text-muted-foreground">
                {attrs.size ?? '—'}
              </td>
              <td className="py-1.5 pr-3 text-muted-foreground">
                {attrs.fabric ?? '—'}
              </td>
              <td className="py-1.5 pr-3 text-muted-foreground">
                {v.cost_price != null ? `$${v.cost_price.toFixed(2)}` : '—'}
              </td>
              <td className="py-1.5 pr-3 text-muted-foreground">
                {v.sell_price != null ? `$${v.sell_price.toFixed(2)}` : '—'}
              </td>
              <td className={cn('py-1.5', marginClass(v.sell_price, v.cost_price))}>
                {formatMargin(v.sell_price, v.cost_price)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ----------------------------------------------------------------
// ProductRow
// ----------------------------------------------------------------

export interface ProductRowProps {
  product: ProductWithVariants;
  categories: ProductCategory[];
  onUpdate: () => void;
}

export function ProductRow({ product, categories, onUpdate }: ProductRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const allSellPrices = [
    product.sell_price,
    ...product.variants.map((v) => v.sell_price),
  ];
  const allCostPrices = [
    product.cost_price,
    ...product.variants.map((v) => v.cost_price),
  ];

  const avgSell =
    product.variants.length > 0
      ? null
      : product.sell_price;
  const avgCost =
    product.variants.length > 0
      ? null
      : product.cost_price;

  const handleDelete = async () => {
    if (!confirm(`Delete "${product.name}" and all its variants?`)) return;
    try {
      await deleteProduct(product.id);
      toast.success('Product deleted.');
      onUpdate();
    } catch {
      toast.error('Failed to delete product.');
    }
  };

  return (
    <div className="flex flex-col rounded-lg border">
      {/* Row header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-accent/30"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{product.name}</span>
          {product.description && (
            <span className="truncate text-xs text-muted-foreground">
              {product.description}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
          <span className="hidden sm:block">
            Sell: {priceRange(allSellPrices)}
          </span>
          <span className="hidden sm:block">
            Cost: {priceRange(allCostPrices)}
          </span>
          <span
            className={cn(
              'hidden sm:block',
              product.variants.length === 0
                ? marginClass(avgSell, avgCost)
                : '',
            )}
          >
            {product.variants.length === 0
              ? formatMargin(avgSell, avgCost)
              : `${product.variants.length} variant${product.variants.length !== 1 ? 's' : ''}`}
          </span>
          {product.variants.length > 0 && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {product.variants.length}
            </Badge>
          )}
        </div>
      </button>

      {/* Expanded section */}
      {expanded && (
        <>
          <Separator />
          <div className="flex flex-col gap-3 px-4 py-3">
            <VariantsTable variants={product.variants} />

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3 w-3" />
                Edit Product
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setEditOpen(true)}
              >
                <Plus className="h-3 w-3" />
                Add Variant
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>
        </>
      )}

      <ProductForm
        open={editOpen}
        onOpenChange={setEditOpen}
        categories={categories}
        product={product}
        onSave={onUpdate}
      />
    </div>
  );
}
