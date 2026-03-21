'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getProducts, getProductCategories } from '@/app/actions/products';
import type { Product, ProductVariant, ProductCategory } from '@agent-crm/shared';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface SelectedItem {
  product_id?: string;
  variant_id?: string;
  name: string;
  price?: number;
}

export interface CatalogBrowserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: SelectedItem) => void;
}

type ProductWithVariants = Product & { variants: ProductVariant[] };

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function calcMargin(sell: number | null, cost: number | null): string {
  if (!sell || sell === 0 || cost === null) return 'N/A';
  return `${(((sell - cost) / sell) * 100).toFixed(1)}%`;
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return '—';
  return `$${price.toFixed(2)}`;
}

// ----------------------------------------------------------------
// CatalogBrowserModal
// ----------------------------------------------------------------

export function CatalogBrowserModal({ open, onOpenChange, onSelect }: CatalogBrowserModalProps) {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([getProducts(), getProductCategories()])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setCategoryFilter('all');
      setSelected(null);
    }
  }, [open]);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.variants.some((v) => v.name.toLowerCase().includes(q));
    const matchesCategory =
      categoryFilter === 'all' ||
      (categoryFilter === 'uncategorized' ? !p.category_id : p.category_id === categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const handleConfirm = () => {
    if (!selected) return;
    onSelect(selected);
    onOpenChange(false);
  };

  const selectItem = (item: SelectedItem) => {
    setSelected((prev) =>
      prev?.product_id === item.product_id && prev?.variant_id === item.variant_id ? null : item,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Browse Catalog</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-col gap-2 border-b px-5 py-3">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {[{ id: 'all', name: 'All' }, ...categories, { id: 'uncategorized', name: 'Uncategorized' }].map(
              (cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                    categoryFilter === cat.id
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:border-foreground/50',
                  )}
                >
                  {cat.name}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No products yet.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add products in the{' '}
                <a href="/products" className="underline hover:text-foreground">
                  Products page
                </a>
                {' '}→
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map((product) => {
                const rows: { item: SelectedItem; label: string; sell: number | null; cost: number | null }[] =
                  product.variants.length > 0
                    ? product.variants.map((v) => ({
                        item: {
                          product_id: product.id,
                          variant_id: v.id,
                          name: `${product.name} — ${v.name}`,
                          price: v.sell_price ?? undefined,
                        },
                        label: v.name,
                        sell: v.sell_price,
                        cost: v.cost_price,
                      }))
                    : [
                        {
                          item: {
                            product_id: product.id,
                            name: product.name,
                            price: product.sell_price ?? undefined,
                          },
                          label: product.name,
                          sell: product.sell_price,
                          cost: product.cost_price,
                        },
                      ];

                return (
                  <div key={product.id} className="rounded-lg border">
                    {product.variants.length > 0 && (
                      <div className="border-b px-3 py-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {product.name}
                        </span>
                        {product.variants.length > 0 && (
                          <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-[10px]">
                            {product.variants.length}
                          </Badge>
                        )}
                      </div>
                    )}
                    {rows.map(({ item, label, sell, cost }) => {
                      const isSelected =
                        selected?.product_id === item.product_id &&
                        selected?.variant_id === item.variant_id;
                      return (
                        <button
                          key={item.variant_id ?? item.product_id}
                          type="button"
                          onClick={() => selectItem(item)}
                          className={cn(
                            'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors',
                            isSelected
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-accent/40',
                          )}
                        >
                          <span className="flex-1 truncate">{label}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatPrice(sell)}
                          </span>
                          <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                            Cost: {formatPrice(cost)}
                          </span>
                          <span
                            className={cn(
                              'hidden shrink-0 text-xs sm:block',
                              sell && cost !== null && sell > 0 && cost < sell
                                ? 'text-muted-foreground'
                                : sell && cost !== null && cost > sell
                                  ? 'text-red-600'
                                  : 'text-muted-foreground',
                            )}
                          >
                            {calcMargin(sell, cost)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-5 py-3" showCloseButton>
          <Button onClick={handleConfirm} disabled={!selected} size="sm">
            Add Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
