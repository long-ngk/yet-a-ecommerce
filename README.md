# Yet-A-Ecommerce

Yet another e-commerce platform — built with Next.js 15 Micro-Frontends (Multiple Zones), Turborepo, Prisma, and PostgreSQL.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Zones (Apps)](#zones-apps)
- [Shared Packages](#shared-packages)
- [Data Layer](#data-layer)
- [Cross-Zone Communication](#cross-zone-communication)
- [API Gateway](#api-gateway)
- [Authentication](#authentication)
- [Design Decisions](#design-decisions)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Development](#development)
- [Useful Commands](#useful-commands)

---

## Architecture Overview

This project implements a **Micro-Frontend (MFE) architecture** using Next.js 15's native **Multiple Zones** feature. Each zone is an independent Next.js 15 App Router application that can be built, deployed, and run separately. To the user, everything appears as a single application under one domain.

```
Browser (http://localhost:3000)
         │
         ▼
   ┌─────────────────────────────────────────────────────┐
   │               Shell MFE  (:3000)                    │
   │  ┌──────────────┐  ┌──────────────────────────────┐ │
   │  │ Global Layout│  │      API Gateway             │ │
   │  │ (Header +    │  │  /api/products               │ │
   │  │  Footer)     │  │  /api/cart                   │ │
   │  │              │  │  /api/orders                 │ │
   │  │ Reverse Proxy│  │  /api/users/me               │ │
   │  │ (rewrites)   │  │  /api/auth/[...nextauth]     │ │
   │  └──────────────┘  └──────────────────────────────┘ │
   └──────┬──────────────────────────────────────────────┘
          │ Next.js rewrites (transparent proxy)
   ┌──────┴──────────────────────────────────────────┐
   │                                                  │
   ▼              ▼              ▼              ▼
Products        Orders         Account        Checkout
 (:3001)        (:3002)        (:3003)        (:3004)
/products/**   /orders/**    /account/**   /checkout/**
```

**Key principle:** The Shell app acts as both the entry point and API Gateway. All MFE apps are pure frontend consumers — they call `SHELL_API_URL/api/*` for all data and never connect to the database directly.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.3.3 (App Router) |
| Language | TypeScript 5.8.3 |
| UI | React 19.0.0 |
| Authentication | NextAuth.js v5 (Auth.js) — JWT, Credentials + Google + GitHub |
| ORM | Prisma 6.x |
| Database | PostgreSQL |
| Validation | Zod 3.x |
| Password hashing | bcrypt 5.x |
| Monorepo | Turborepo 2.5.3 + pnpm 9.x workspaces |
| Testing | Vitest 3.x + fast-check (property-based tests) |
| Formatter | Prettier 3.5.3 |
| Styling | Inline `React.CSSProperties` — no CSS framework |

---

## Project Structure

```
yet-a-ecommerce/
├── apps/
│   ├── shell/          # Port 3000 — reverse proxy, API gateway, global layout, auth
│   ├── products/       # Port 3001 — product listing and detail pages
│   ├── orders/         # Port 3002 — order history and order detail pages
│   ├── account/        # Port 3003 — user profile view and edit
│   └── checkout/       # Port 3004 — shopping cart and checkout flow
└── packages/
    ├── ui/             # Shared React component library
    └── communication/  # Cross-zone event bus + shared localStorage store
```

Each app under `apps/` is a standalone Next.js 15 project with its own `package.json`, `next.config.ts`, and `tsconfig.json`. Shared packages under `packages/` are consumed as workspace dependencies.

---

## Zones (Apps)

### Shell (`apps/shell`) — Port 3000

The central coordinator. It does three things:

1. **Reverse proxy** — `next.config.ts` rewrites route traffic to the correct MFE zone.
2. **Global layout** — wraps every page (across all zones) with a persistent `GlobalHeader` and `GlobalFooter`.
3. **API Gateway** — hosts all backend API route handlers (`app/api/**`). All zones call these endpoints.

**Key files:**
- `next.config.ts` — rewrites + CORS headers for all `/api/*` routes
- `app/layout.tsx` — root layout with `GlobalHeader`, `GlobalFooter`, `SessionSync`
- `app/components/GlobalHeader.tsx` — Client Component; subscribes to auth/cart/profile events; shows cart badge and login/logout UI
- `app/components/SessionSync.tsx` — side-effect Client Component; syncs the active NextAuth session to the Shared Store and dispatches `auth:login` on mount
- `lib/auth.ts` — NextAuth v5 configuration
- `lib/prisma.ts` — Singleton PrismaClient
- `lib/middleware.ts` — `withAuth()` and `withValidation()` reusable route handler helpers
- `lib/errors.ts` — standardized error response builder
- `lib/schemas/` — Zod schemas for all API inputs
- `prisma/schema.prisma` — full database schema

### Products (`apps/products`) — Port 3001

Browse and search products. Entirely server-rendered (React Server Components) except the "Add to Cart" button.

- `/products` — grid layout with search, category filter, sort, pagination; all filter state lives in URL query params
- `/products/[id]` — product detail with stock status
- `ProductCardWithCart.tsx` — the only Client Component; dispatches `cart:add` Custom Event on button click

### Orders (`apps/orders`) — Port 3002

View order history. Auth-guarded — redirects to login when unauthenticated.

- `/orders` — list of orders sorted newest first using `OrderCard`
- `/orders/[id]` — order detail with items, quantities, prices, and shipping status

### Account (`apps/account`) — Port 3003

Manage user profile. Auth-guarded.

- `/account` — profile view (name, email, phone, address, avatar)
- `/account/edit` — edit form; dispatches `profile:update` Custom Event on save so the Shell header updates the displayed name in real time

### Checkout (`apps/checkout`) — Port 3004

Shopping cart and checkout. Auth-guarded.

- `/checkout` — cart item list; Server Component pre-fetches initial cart; `CartClient` handles all interactivity, subscribes to `cart:add`, dispatches `cart:update`
- `/checkout/summary` — order summary, discount code input, "Place Order" button; on success clears cart and dispatches `cart:update` with count 0

---

## Shared Packages

### `@yet-a-ecommerce/ui`

Shared React component library. No build step — imported directly as TypeScript source via `"main": "src/index.ts"`. All styles are inline `React.CSSProperties`.

| Component | Props summary |
|---|---|
| `Button` | `variant: primary \| secondary \| disabled`, `size: small \| medium \| large` |
| `Card` | `image`, `title`, `content`, `actions` |
| `ProductCard` | wraps `Card`; shows price, stock status, "Add to cart" button |
| `OrderCard` | wraps `Card`; shows order ID, date, total, status badge |
| `Header` | `logo`, `navItems`, `actionArea` |
| `Badge` | `value`, `variant`, `hideWhenZero`, `max` (default 99, displays "99+" above) |

### `@yet-a-ecommerce/communication`

Cross-zone communication layer. Three independent channels:

**1. Custom Events (real-time)**
```ts
dispatch(eventName: string, payload: EventPayload): void
subscribe(eventName: string, handler: (payload) => void): () => void  // returns unsubscribe fn
```
Uses `window.CustomEvent` + `window.dispatchEvent` / `window.addEventListener`.

**2. Shared Store (persistent)**
```ts
writeStore(namespace: string, key: string, value: unknown): void
readStore<T>(namespace: string, key: string): T | null
clearStore(namespace: string, key: string): void
onStoreChange(namespace: string, key: string, handler: (value) => void): () => void
```
Backed by `localStorage` with namespace-prefixed keys (e.g., `shell:auth`, `checkout:cart`). `writeStore` also dispatches a synthetic `StorageEvent` so same-page listeners are notified (localStorage events only fire natively in other tabs).

**Event types used in the system:**

| Event | Payload | Source | Consumers |
|---|---|---|---|
| `cart:add` | `{ productId, name, price, quantity }` | Products MFE | Checkout MFE |
| `cart:update` | `{ items, totalCount }` | Checkout MFE | Shell (badge) |
| `auth:login` | `{ userId, name, email }` | Shell | All zones |
| `auth:logout` | `{}` | Shell | All zones |
| `profile:update` | `{ name }` | Account MFE | Shell (header name) |

**Catch-up pattern:** When a zone mounts after events have already been dispatched, it reads the current state from the Shared Store. This solves the late-mount problem without requiring a global state manager.

---

## Data Layer

All database access goes through Prisma ORM in the Shell app. No MFE talks to the database directly.

### Schema Summary

```
User ──────┬──────── Cart ────── CartItem ──┐
           │                                │
           └──────── Order ──── OrderItem ──┤
                                            │
                                         Product
           │
           ├──────── Account   (OAuth providers)
           └──────── Session   (NextAuth)
```

**Enums:**
- `Role`: `USER`, `ADMIN`
- `OrderStatus`: `PENDING`, `PROCESSING`, `SHIPPING`, `DELIVERED`, `CANCELLED`

**Notable constraints:**
- `Cart` is 1-to-1 with `User` (`userId @unique`)
- `CartItem` has a composite unique on `(cartId, productId)` — adding the same product accumulates quantity
- `OrderItem.price` stores the price at the time of purchase (snapshot)
- OAuth users have no `password` field (nullable)

### Prisma scripts (run from shell package)

```bash
pnpm --filter @yet-a-ecommerce/shell db:migrate   # run migrations
pnpm --filter @yet-a-ecommerce/shell db:seed       # seed sample data
pnpm --filter @yet-a-ecommerce/shell db:studio     # open Prisma Studio
```

---

## Cross-Zone Communication

State flows through a three-channel system without any global state library (no Redux, no Zustand, no React Query):

```
Products MFE          Communication Layer          Shell Header
    │                                                   │
    │── dispatch("cart:add", {...}) ─────────────────►  │ (subscribe → update badge)
    │                    │                              │
    │              writeStore(                          │
    │               "events",                          │
    │               "cart:add", payload)               │
    │                    │                              │
    │                    ▼                              │
                  Checkout MFE (mounts later)
                    readStore("events", "cart:add")   ← catch-up on mount
```

**Server state** is handled directly by Next.js Server Components fetching from the Shell API — no client-side data fetching library needed.

**URL state** in the Products MFE keeps search/category/sort/page in query params so filter state is shareable and browser-navigable.

---

## API Gateway

All backend routes live in `apps/shell/app/api/`:

```
app/api/
├── auth/
│   ├── [...nextauth]/route.ts     # NextAuth handlers (GET + POST)
│   └── register/route.ts          # User registration
├── products/
│   ├── route.ts                   # GET: list with search/filter/sort/pagination
│   └── [id]/route.ts              # GET: product detail
├── cart/
│   ├── route.ts                   # GET: cart items + total | POST: add item
│   └── [itemId]/route.ts          # PATCH: update quantity | DELETE: remove item
├── orders/
│   ├── route.ts                   # GET: list (newest first) | POST: create from cart
│   └── [id]/route.ts              # GET: order detail
└── users/
    └── me/route.ts                # GET: profile | PATCH: update allowed fields only
```

**Middleware pattern:** Route handlers compose two shared helpers:

```ts
// Auth guard — returns Session or 401 NextResponse
const sessionOrResponse = await withAuth(request);
if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;

// Input validation — returns parsed data or 400 NextResponse
const validated = withValidation(schema, body, requestId);
if (validated instanceof NextResponse) return validated;
```

**Error response contract:**
```ts
// All 4xx/5xx responses follow this shape:
{
  error: {
    code: string,       // e.g. "UNAUTHORIZED", "VALIDATION_ERROR"
    message: string,    // human-readable
    details?: { field: string; message: string }[]  // Zod field errors
  }
}
// Every response (success and error) includes: X-Request-Id header
```

---

## Authentication

NextAuth.js v5 (Auth.js), JWT session strategy, configured in `apps/shell/lib/auth.ts`.

**Providers:** Credentials (email + bcrypt), Google OAuth, GitHub OAuth.

**Session data propagated via JWT callbacks:**
- `userId`, `email`, `name`, `role`

**Cross-zone auth flow:**
1. User logs in through Shell (`/account/login`)
2. Shell's `SessionSync` component fetches the active session on mount
3. Writes auth state to `localStorage` (`shell:auth`) and dispatches `auth:login` event
4. All mounted zones receive the event and update their UI
5. Zones mounting later read `shell:auth` from localStorage for catch-up
6. On logout: `clearStore("shell", "auth")` + `dispatch("auth:logout", ...)` + NextAuth `signOut`

**Auth guard on MFEs:** Each auth-guarded zone (orders, account, checkout) has a `lib/auth-guard.ts` that calls the session endpoint and redirects to `SHELL_API_URL/api/auth/signin` with a `callbackUrl` if unauthenticated.

---

## Design Decisions

| Decision | Rationale |
|---|---|
| **Next.js Multiple Zones** (not module federation) | Each zone is a full Next.js 15 app with App Router, React Server Components, and independent deployment. No webpack module federation complexity. Zones communicate via HTTP proxy (rewrites) rather than shared JS bundles. |
| **API Gateway in Shell** | Centralizes all backend logic — one database connection, one auth layer, one validation layer. MFE apps remain lightweight pure-frontend consumers. Simplifies infra vs. having separate backend services per zone. |
| **No global state library** | Custom Events + Shared Store cover all real-time cross-zone state needs without the overhead of Redux/Zustand. Server Components handle server state. URL handles filter state. |
| **Prisma + PostgreSQL** | Type-safe ORM with migration tooling. Well-suited for relational data with foreign keys (User → Cart → CartItem, Order → OrderItem). |
| **NextAuth.js v5** | Latest version compatible with Next.js 15 App Router. JWT strategy works across serverless functions. Credentials + OAuth in a single config. HTTP-only cookies for session security. |
| **Zod validation** | Runtime type checking for all API inputs with TypeScript inference. Field-level error messages map cleanly to the standardized API error format. |
| **Inline CSS (no framework)** | Avoids CSS class name collisions across independent zone bundles. Each zone can freely style without risk of Tailwind/CSS Modules conflicts. |
| **Turborepo** | Parallel builds, incremental caching, and dependency-aware task ordering across 5 apps + 2 packages from a single `pnpm dev`. |

---

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9 — `npm install -g pnpm`
- **Docker** (for PostgreSQL) — or a local PostgreSQL installation

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/long-ngk/yet-a-ecommerce.git
cd yet-a-ecommerce
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start PostgreSQL

Using Docker (recommended):

```bash
docker run -d \
  --name yet-a-ecommerce-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=ecommerce \
  -p 5432:5432 \
  postgres
```

### 4. Set up environment variables

See the [Environment Variables](#environment-variables) section below.

### 5. Run database migrations

```bash
pnpm --filter @yet-a-ecommerce/shell db:migrate
```

### 6. Seed sample data (optional)

```bash
pnpm --filter @yet-a-ecommerce/shell db:seed
```

Creates:
- 3 users: `alice@example.com`, `bob@example.com`, `admin@example.com` (password: `password123`)
- 10 products across Electronics, Clothing, Books, Home categories
- 3 sample orders

### 7. Start all zones

```bash
pnpm dev
```

| Zone | URL |
|---|---|
| Shell (home) | http://localhost:3000 |
| Products | http://localhost:3000/products |
| Orders | http://localhost:3000/orders |
| Account | http://localhost:3000/account |
| Checkout | http://localhost:3000/checkout |

---

## Environment Variables

### `apps/shell/.env`
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce"
NEXTAUTH_SECRET="your-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Zone URLs — used by Shell rewrites
PRODUCTS_URL="http://localhost:3001"
ORDERS_URL="http://localhost:3002"
ACCOUNT_URL="http://localhost:3003"
CHECKOUT_URL="http://localhost:3004"
```

### Each MFE app (`apps/products`, `apps/orders`, `apps/account`, `apps/checkout`) `.env`
```env
SHELL_API_URL="http://localhost:3000"
```

All `.env` files are gitignored. See `apps/shell/.env.example` for reference.

---

## Database Setup

```bash
# Create and run migrations
pnpm --filter @yet-a-ecommerce/shell db:migrate

# Seed sample data
pnpm --filter @yet-a-ecommerce/shell db:seed

# Open Prisma Studio (visual DB browser)
pnpm --filter @yet-a-ecommerce/shell db:studio
```

---

## Development

```bash
# Start all zones concurrently (Turborepo)
pnpm dev

# Start a single zone
pnpm --filter @yet-a-ecommerce/shell dev
pnpm --filter @yet-a-ecommerce/products dev
```

---

## Useful Commands

```bash
# Build all apps
pnpm build

# Type-check all packages
pnpm type-check

# Lint all packages
pnpm lint

# Run all tests
pnpm test

# Clean all build artifacts and node_modules
pnpm clean
```
