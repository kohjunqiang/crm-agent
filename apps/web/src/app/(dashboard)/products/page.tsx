'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import type { Product, ProductVariant, ProductCategory } from '@agent-crm/shared';
import { getProducts, getProductCategories } from '@/app/actions/products';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Package, Layers, TrendingUp, Plus, Search } from 'lucide-react';
import { ProductList } from '@/components/products/ProductList';
import { ProductForm } from '@/components/products/ProductForm';
import { CategoryManager } from '@/components/products/CategoryManager';

type ProductWithVariants = Product & { variants: ProductVariant[] };

// ----------------------------------------------------------------
// StatCard
// ----------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="flex-1 gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground">{label}</span>
            <span className="text-xl font-semibold tracking-tight">{value}</span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------
// ProductsPage
// ----------------------------------------------------------------

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getProductCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch {
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // KPI calculations
  const kpis = useMemo(() => {
    const totalProducts = products.length;
    const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0);

    // Average margin across all products and variants with valid sell prices
    const margins: number[] = [];
    for (const product of products) {
      if (product.variants.length === 0) {
        const sell = product.sell_price;
        const cost = product.cost_price;
        if (sell && sell > 0 && cost !== null) {
          margins.push(((sell - cost) / sell) * 100);
        }
      } else {
        for (const variant of product.variants) {
          const sell = variant.sell_price;
          const cost = variant.cost_price;
          if (sell && sell > 0 && cost !== null) {
            margins.push(((sell - cost) / sell) * 100);
          }
        }
      }
    }
    const avgMargin =
      margins.length > 0
        ? margins.reduce((sum, m) => sum + m, 0) / margins.length
        : null;

    return { totalProducts, totalVariants, avgMargin };
  }, [products]);

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog and pricing
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Product
        </Button>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 rounded-lg border p-4">
              <div className="animate-pulse flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <div className="h-3 bg-muted rounded w-24" />
                  <div className="h-7 bg-muted rounded w-16" />
                </div>
                <div className="h-9 w-9 bg-muted rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Total Products"
            value={String(kpis.totalProducts)}
            icon={Package}
          />
          <StatCard
            label="Total Variants"
            value={String(kpis.totalVariants)}
            icon={Layers}
          />
          <StatCard
            label="Avg Margin"
            value={kpis.avgMargin !== null ? `${kpis.avgMargin.toFixed(1)}%` : 'N/A'}
            icon={TrendingUp}
          />
        </div>
      )}

      {/* Search + filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-8 w-44 text-sm">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">
              All categories
            </SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id} className="text-sm">
                {cat.name}
              </SelectItem>
            ))}
            <SelectItem value="uncategorized" className="text-sm">
              Uncategorized
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main content: category manager + product list */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border px-3 py-3">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 bg-muted rounded" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="h-4 bg-muted rounded w-48" />
                  <div className="h-3 bg-muted rounded w-32" />
                </div>
                <div className="flex gap-4">
                  <div className="h-3 bg-muted rounded w-16 hidden sm:block" />
                  <div className="h-3 bg-muted rounded w-16 hidden sm:block" />
                  <div className="h-3 bg-muted rounded w-12 hidden sm:block" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
          {/* Category manager sidebar */}
          <Card className="h-fit gap-0 py-0 shadow-none">
            <CardContent className="p-4">
              <CategoryManager
                categories={categories}
                products={products}
                onUpdate={fetchData}
              />
            </CardContent>
          </Card>

          <Separator className="md:hidden" />

          {/* Product list */}
          <ProductList
            products={products}
            categories={categories}
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            onUpdate={fetchData}
            onAddProduct={() => setAddOpen(true)}
          />
        </div>
      )}

      {/* Add product dialog */}
      <ProductForm
        open={addOpen}
        onOpenChange={setAddOpen}
        categories={categories}
        onSave={fetchData}
      />
    </div>
  );
}
