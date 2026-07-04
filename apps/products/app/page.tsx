import Link from 'next/link';
import { getProducts } from '../lib/api-client';
import { ProductFilters } from './components/ProductFilters';
import { ProductCardWithCart } from './components/ProductCardWithCart';

interface SearchParams {
  search?: string;
  category?: string;
  sort?: string;
  page?: string;
}

interface ProductsPageProps {
  searchParams: Promise<SearchParams>;
}

const pageStyle: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '24px 16px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  color: '#111827',
  marginBottom: '8px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: '24px',
  marginTop: '8px',
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '64px 16px',
  color: '#6b7280',
};

const emptyTitleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '12px',
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: '14px',
  marginBottom: '20px',
};

const clearLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '8px 20px',
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 500,
};

const paginationStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
  marginTop: '32px',
};

const pageButtonStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  color: '#374151',
  textDecoration: 'none',
  fontSize: '14px',
};

const activePageButtonStyle: React.CSSProperties = {
  ...pageButtonStyle,
  backgroundColor: '#3b82f6',
  borderColor: '#3b82f6',
  color: '#ffffff',
  fontWeight: 600,
};

function buildPageUrl(searchParams: SearchParams, page: number): string {
  const params = new URLSearchParams();
  if (searchParams.search) params.set('search', searchParams.search);
  if (searchParams.category) params.set('category', searchParams.category);
  if (searchParams.sort) params.set('sort', searchParams.sort);
  params.set('page', String(page));
  return `?${params.toString()}`;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolved = await searchParams;
  const { search, category, sort, page } = resolved;
  const currentPage = page ? Math.max(1, parseInt(page, 10)) : 1;

  let products: Awaited<ReturnType<typeof getProducts>>['products'] = [];
  let pagination = { total: 0, totalPages: 0, currentPage: 1 };
  let fetchError: string | null = null;

  try {
    const result = await getProducts({
      search,
      category,
      sort: sort as 'price_asc' | 'price_desc' | 'name_asc' | 'newest' | undefined,
      page: currentPage,
    });
    products = result.products;
    pagination = {
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    };
  } catch {
    fetchError = 'Failed to load products. Please try again later.';
  }

  // Derive unique categories from the current result set.
  // In a real scenario you'd have a dedicated /api/categories endpoint;
  // here we use whatever was returned on the current (unfiltered) call.
  // We fetch a lightweight category list only when no category filter is applied.
  let allCategories: string[] = [];
  try {
    const categoryResult = await getProducts({ limit: 100 });
    const seen = new Set<string>();
    for (const p of categoryResult.products) {
      if (p.category) seen.add(p.category);
    }
    allCategories = Array.from(seen).sort();
  } catch {
    // Not critical — just means the category dropdown will be empty
  }

  const hasActiveFilters = Boolean(search || category || sort);

  return (
    <main style={pageStyle}>
      <h1 style={headingStyle}>Products</h1>

      <ProductFilters
        initialSearch={search}
        initialCategory={category}
        initialSort={sort}
        categories={allCategories}
      />

      {fetchError ? (
        <div style={emptyStateStyle} role="alert">
          <p style={emptyTitleStyle}>Something went wrong</p>
          <p style={emptyTextStyle}>{fetchError}</p>
        </div>
      ) : products.length === 0 ? (
        <div style={emptyStateStyle} role="status" aria-live="polite">
          <p style={emptyTitleStyle}>No products found</p>
          <p style={emptyTextStyle}>
            {hasActiveFilters
              ? 'No products match your current filters.'
              : 'There are no products available right now.'}
          </p>
          {hasActiveFilters && (
            <Link href="/products" style={clearLinkStyle}>
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <>
          <p
            style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}
          >
            {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
          </p>

          <div style={gridStyle} role="list" aria-label="Product list">
            {products.map((product) => (
              <div key={product.id} role="listitem">
                <ProductCardWithCart product={product} />
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <nav style={paginationStyle} aria-label="Pagination">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <Link
                    key={pageNum}
                    href={buildPageUrl(resolved, pageNum)}
                    style={
                      pageNum === pagination.currentPage
                        ? activePageButtonStyle
                        : pageButtonStyle
                    }
                    aria-label={`Page ${pageNum}`}
                    aria-current={
                      pageNum === pagination.currentPage ? 'page' : undefined
                    }
                  >
                    {pageNum}
                  </Link>
                ),
              )}
            </nav>
          )}
        </>
      )}
    </main>
  );
}
