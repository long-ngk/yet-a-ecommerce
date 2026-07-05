const SHELL_API_URL =
  process.env["SHELL_API_URL"] ?? "http://localhost:3000";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProducts {
  products: Product[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// Shape returned by the Shell API gateway
interface ApiProductsResponse {
  data: Product[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export interface GetProductsParams {
  search?: string;
  category?: string;
  sort?: "price_asc" | "price_desc" | "name_asc" | "newest";
  page?: number;
  limit?: number;
}

export async function getProducts(
  params?: GetProductsParams
): Promise<PaginatedProducts> {
  const url = new URL(`${SHELL_API_URL}/api/products`);

  if (params?.search) {
    url.searchParams.set("search", params.search);
  }
  if (params?.category) {
    url.searchParams.set("category", params.category);
  }
  if (params?.sort) {
    url.searchParams.set("sort", params.sort);
  }
  if (params?.page !== undefined) {
    url.searchParams.set("page", String(params.page));
  }
  if (params?.limit !== undefined) {
    url.searchParams.set("limit", String(params.limit));
  }

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status}`);
  }

  // Normalize the API response shape { data, pagination } → { products, total, totalPages, currentPage }
  const json = (await res.json()) as ApiProductsResponse;
  return {
    products: json.data,
    total: json.pagination.total,
    totalPages: json.pagination.totalPages,
    currentPage: json.pagination.currentPage,
  };
}

export async function getProduct(id: string): Promise<Product> {
  const res = await fetch(`${SHELL_API_URL}/api/products/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch product ${id}: ${res.status}`);
  }

  return res.json() as Promise<Product>;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export async function addToCart(
  productId: string,
  quantity: number = 1
): Promise<Cart> {
  const res = await fetch(`${SHELL_API_URL}/api/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });

  if (!res.ok) {
    throw new Error(`Failed to add to cart: ${res.status}`);
  }

  return res.json() as Promise<Cart>;
}
