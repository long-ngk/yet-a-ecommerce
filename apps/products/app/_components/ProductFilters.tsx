'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

export interface ProductFiltersProps {
  initialSearch?: string;
  initialCategory?: string;
  initialSort?: string;
  categories: string[];
}

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
  { value: 'newest', label: 'Newest First' },
] as const;

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  alignItems: 'center',
  padding: '16px 0',
  marginBottom: '16px',
  borderBottom: '1px solid #e5e7eb',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: '14px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  outline: 'none',
  flex: '1 1 200px',
  minWidth: '160px',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: '14px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
  minWidth: '160px',
};

export function ProductFilters({
  initialSearch = '',
  initialCategory = '',
  initialSort = '',
  categories,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      // Reset to page 1 whenever filters change
      params.delete('page');

      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    updateParams({ search: e.target.value });
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateParams({ category: e.target.value });
  }

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateParams({ sort: e.target.value });
  }

  return (
    <div style={containerStyle} aria-label="Product filters">
      <input
        type="search"
        placeholder="Search products..."
        defaultValue={initialSearch}
        onChange={handleSearchChange}
        style={{
          ...inputStyle,
          opacity: isPending ? 0.7 : 1,
        }}
        aria-label="Search products"
      />

      <select
        defaultValue={initialCategory}
        onChange={handleCategoryChange}
        style={{
          ...selectStyle,
          opacity: isPending ? 0.7 : 1,
        }}
        aria-label="Filter by category"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <select
        defaultValue={initialSort}
        onChange={handleSortChange}
        style={{
          ...selectStyle,
          opacity: isPending ? 0.7 : 1,
        }}
        aria-label="Sort products"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
