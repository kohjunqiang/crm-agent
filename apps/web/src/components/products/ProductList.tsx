'use client';

import { useState } from 'react';
import type { ProductCategory } from '@agent-crm/shared';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { ProductRow } from './ProductRow';
import type { ProductWithVariants } from './ProductRow';

// ----------------------------------------------------------------
// CategorySection
// ----------------------------------------------------------------

interface CategorySectionProps {
  title: string;
  products: ProductWithVariants[];
  categories: ProductCategory[];
  onUpdate: () => void;
}

function CategorySection({
  title,
  products,
  categories,
  onUpdate,
}: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center gap-2 text-left"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="text-xs font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground">
          ({products.length})
        </span>
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-1.5 pl-1">
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              categories={categories}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// ProductList
// ----------------------------------------------------------------

interface ProductListProps {
  products: ProductWithVariants[];
  categories: ProductCategory[];
  searchQuery: string;
  categoryFilter: string;
  onUpdate: () => void;
  onAddProduct: () => void;
}

export function ProductList({
  products,
  categories,
  searchQuery,
  categoryFilter,
  onUpdate,
  onAddProduct,
}: ProductListProps) {
  // Filter by search and category
  const filtered = products.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.variants.some((v) => v.name.toLowerCase().includes(query));
    const matchesCategory =
      !categoryFilter ||
      categoryFilter === 'all' ||
      (categoryFilter === 'uncategorized'
        ? !p.category_id
        : p.category_id === categoryFilter);
    return matchesSearch && matchesCategory;
  });

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No products yet. Add your first product to get started.
        </p>
        <Button size="sm" className="gap-1.5" onClick={onAddProduct}>
          <Plus className="h-3.5 w-3.5" />
          Add Product
        </Button>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No products match your search.
      </p>
    );
  }

  // Group by category
  const categoryMap = new Map<string, ProductWithVariants[]>();
  const uncategorized: ProductWithVariants[] = [];

  for (const product of filtered) {
    if (!product.category_id) {
      uncategorized.push(product);
    } else {
      if (!categoryMap.has(product.category_id)) {
        categoryMap.set(product.category_id, []);
      }
      categoryMap.get(product.category_id)!.push(product);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {categories.map((cat) => {
        const catProducts = categoryMap.get(cat.id) ?? [];
        if (catProducts.length === 0 && categoryFilter && categoryFilter !== 'all' && categoryFilter !== cat.id) {
          return null;
        }
        // Only render categories that have products or aren't filtered
        if (catProducts.length === 0 && categoryFilter === cat.id) {
          return (
            <div key={cat.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">{cat.name}</span>
                <span className="text-xs text-muted-foreground">(0)</span>
              </div>
            </div>
          );
        }
        if (catProducts.length === 0) return null;
        return (
          <CategorySection
            key={cat.id}
            title={cat.name}
            products={catProducts}
            categories={categories}
            onUpdate={onUpdate}
          />
        );
      })}

      {uncategorized.length > 0 && (
        <CategorySection
          title="Uncategorized"
          products={uncategorized}
          categories={categories}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}
