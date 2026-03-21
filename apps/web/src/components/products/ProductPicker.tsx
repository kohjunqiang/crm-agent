'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen } from 'lucide-react';
import { searchProducts } from '@/app/actions/products';
import type { ProductSearchResult } from '@/app/actions/products';
import { CatalogBrowserModal } from './CatalogBrowserModal';
import type { SelectedItem } from './CatalogBrowserModal';

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function formatPrice(price: number | null | undefined): string {
  if (price == null) return '—';
  return `$${price.toFixed(2)}`;
}

// ----------------------------------------------------------------
// ProductPicker
// ----------------------------------------------------------------

interface ProductPickerProps {
  onSelect: (item: SelectedItem) => void;
  placeholder?: string;
}

export function ProductPicker({ onSelect, placeholder = 'Search products...' }: ProductPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchProducts(value.trim());
        setResults(res);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleSelect = (item: SelectedItem) => {
    onSelect(item);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleCustomItem = () => {
    if (!query.trim()) return;
    onSelect({ name: query.trim() });
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <div ref={containerRef} className="relative flex-1">
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          className="h-9"
        />

        {open && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border bg-background shadow-md">
            {loading && (
              <p className="px-3 py-2 text-xs text-muted-foreground">Searching...</p>
            )}

            {!loading && results.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">No products in catalog — type to add a custom item</p>
            )}

            {!loading &&
              results.map((result) => (
                <button
                  key={result.variant_id ?? result.product_id}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent/40"
                  onClick={() =>
                    handleSelect({
                      product_id: result.product_id,
                      variant_id: result.variant_id,
                      name: result.name,
                      price: result.sell_price ?? undefined,
                    })
                  }
                >
                  <span className="flex-1 truncate">{result.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatPrice(result.sell_price)}
                  </span>
                </button>
              ))}

            {/* Custom item option */}
            <button
              type="button"
              className="flex w-full items-center border-t px-3 py-2 text-left text-xs text-muted-foreground hover:bg-accent/40"
              onClick={handleCustomItem}
            >
              Add &ldquo;{query}&rdquo; as custom item (not in catalog)
            </button>
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 shrink-0 gap-1.5"
        onClick={() => setModalOpen(true)}
      >
        <BookOpen className="h-3.5 w-3.5" />
        Browse Catalog
      </Button>

      <CatalogBrowserModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSelect={onSelect}
      />
    </div>
  );
}
