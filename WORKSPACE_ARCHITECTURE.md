# Workspace Architecture & System Overview

## 1. Executive Summary & Architecture Style

### Overview
**Toko Ar-Rahmah Orders** is a full-stack Point-of-Sale (POS) order management system built with React and Node.js. It enables customers to browse products, place orders, and track order status, while administrators have full control over products, orders, and analytics.

### Architectural Pattern
**Client-Server Monolith** — The application uses a single backend server (`auth-server.mjs`) that serves both the REST API and static frontend assets. The frontend is a single-page application (SPA) built with React Router.

| Layer | Technology | Description |
|-------|------------|-------------|
| **Frontend** | React 18 + TypeScript | SPA with Vite, TanStack Query, Zustand |
| **Backend** | Node.js (ESM) | Custom HTTP server with REST API |
| **Database** | JSON File / PostgreSQL | Dual persistence with automatic fallback |
| **Styling** | Tailwind CSS + shadcn/ui | Radix UI primitives with custom dark/light theme |
| **Charts** | Recharts | Analytics visualizations |
| **State** | Zustand | Client-side state management with persistence |
| **Auth** | PBKDF2 + Cookie Sessions | Server-side session management |
| **Theming** | next-themes | Dark/light mode with system preference detection |

### Tech Stack Summary

```
Frontend:     React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
State:        Zustand (with persist middleware)
Data Fetching: TanStack Query v5
Routing:       React Router DOM v6
UI Components: Radix UI (via shadcn/ui)
Charts:        Recharts
Backend:       Node.js (ESM Modules), pg (PostgreSQL)
Authentication: PBKDF2 hashing, HttpOnly cookies
Database:      JSON files (development) / PostgreSQL (production)
Container:     Docker with multi-stage build
```

---

## 2. Workspace Directory Structure

```
POS-orders-main/
├── .data/                          # Local JSON database storage
│   └── auth.json                   # Main data file (users, products, orders)
├── dist/                           # Production build output
├── public/                         # Static assets
│   ├── assets/                     # Product images
│   └── brand/                      # Store branding assets
├── server/                         # Backend server files
│   ├── auth-server.mjs             # Main server (API + static serving)
│   ├── migrate.mjs                 # PostgreSQL migration tool
│   └── generate-dummy-data.mjs    # Test data generator
├── src/                            # React frontend source
│   ├── assets/                     # Vite imported images (product photos)
│   ├── components/                 # Reusable UI components
│   │   ├── ui/                     # shadcn/ui component library
│   │   ├── AdminLayout.tsx         # Admin dashboard layout wrapper
│   │   ├── AdminSidebar.tsx       # Desktop sidebar navigation + logout
│   │   ├── FloatingCartButton.tsx # Floating checkout reminder (customer)
│   │   ├── LoginPrompt.tsx         # Guest-to-login dialog + Zustand store
│   │   ├── MobileAdminSidebar.tsx # Mobile hamburger sidebar
│   │   ├── NotificationBell.tsx   # Admin notification dropdown
│   │   ├── AnalyticsFilters.tsx   # Date/category/product filters
│   │   ├── Header.tsx              # Public header component
│   │   ├── PageHeader.tsx          # Page title/subtitle wrapper
│   │   ├── ProductCard.tsx         # Product display card
│   │   ├── RequireAuth.tsx          # Route guard component
│   │   ├── StatusBadge.tsx         # Order status badge
│   │   └── ThemeProvider.tsx       # Dark/light theme context
│   ├── hooks/                      # Custom React hooks
│   │   ├── use-mobile.tsx          # Mobile viewport detection
│   │   ├── useNotifications.tsx    # SSE real-time notifications hook
│   │   └── use-toast.ts            # Toast notification hook
│   ├── lib/                        # Core utilities and services
│   │   ├── api.ts                 # API client functions (auth, catalog, orders)
│   │   ├── brand.ts               # Store name/icon constants
│   │   ├── product-image.ts       # Product image utilities
│   │   ├── store.ts               # Zustand store definition
│   │   ├── types.ts               # TypeScript interfaces
│   │   └── utils.ts               # Utility functions (cn, etc.)
│   ├── pages/                     # Page components
│   │   ├── Auth.tsx               # Login/Register page
│   │   ├── Cart.tsx               # Shopping cart page
│   │   ├── Index.tsx              # Root redirect (→ Shop or Admin)
│   │   ├── MyOrders.tsx           # Customer order history
│   │   ├── NotFound.tsx           # 404 page
│   │   ├── OrderDetail.tsx        # Single order details
│   │   ├── Shop.tsx               # Product catalog/shopping page
│   │   └── admin/                 # Admin pages
│   │       ├── Dashboard.tsx      # Analytics dashboard
│   │       ├── Products.tsx       # Product management
│   │       ├── Orders.tsx         # Order management
│   │       ├── Customers.tsx      # Customer list view
│   │       ├── CustomerDetail.tsx # Individual customer + orders
│   │       └── Settings.tsx       # Store settings
│   ├── App.tsx                    # Root component with routing
│   ├── main.tsx                   # Application entry point
│   └── index.css                  # Global styles + CSS variables
├── .env                           # Environment variables (local)
├── .env.example                   # Environment template
├── .gitignore                     # Git exclusions
├── components.json                # shadcn/ui CLI config
├── Dockerfile                     # Multi-stage Docker build
├── index.html                     # HTML entry point
├── package.json                   # Dependencies and scripts
├── tailwind.config.ts             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript root config
├── tsconfig.app.json              # Frontend TypeScript config
├── tsconfig.node.json             # Node TypeScript config
├── vite.config.ts                 # Vite bundler configuration
└── vitest.config.ts               # Test runner configuration
```

---

## 3. Dependencies & Ecosystem

### Runtime/Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI library |
| `react-dom` | ^18.3.1 | DOM rendering |
| `react-router-dom` | ^6.30.1 | Client-side routing |
| `@tanstack/react-query` | ^5.83.0 | Server state management |
| `zustand` | ^5.0.13 | Client state management |
| `recharts` | ^2.15.4 | Chart visualizations |
| `pg` | ^8.20.0 | PostgreSQL client |
| `zod` | ^3.25.76 | Schema validation |
| `react-hook-form` | ^7.61.1 | Form handling |
| `@hookform/resolvers` | ^3.10.0 | Form validation resolvers |
| `date-fns` | ^3.6.0 | Date manipulation |
| `lucide-react` | ^0.462.0 | Icon library |
| `sonner` | ^1.7.4 | Toast notifications |
| `clsx` | ^2.1.1 | Conditional classnames |
| `tailwind-merge` | ^2.6.0 | Tailwind class merging |
| `class-variance-authority` | ^0.7.1 | Component variant generation |
| `next-themes` | ^0.3.0 | Theme switching |

### UI Component Libraries (Radix UI)

| Package | Purpose |
|---------|---------|
| `@radix-ui/react-*` | 25+ components (dialog, dropdown, tabs, etc.) |
| `embla-carousel-react` | Carousel component |
| `cmdk` | Command palette |
| `html-to-image` | Screenshot generation |
| `input-otp` | OTP input |
| `react-day-picker` | Calendar/date picker |
| `react-resizable-panels` | Resizable panel layouts |
| `vaul` | Drawer component |

### Development/Build Tools

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | ^5.4.19 | Build tool and dev server |
| `@vitejs/plugin-react-swc` | ^3.11.0 | React Fast Refresh |
| `typescript` | ^5.8.3 | Type checking |
| `tailwindcss` | ^3.4.17 | CSS framework |
| `postcss` | ^8.5.6 | CSS processing |
| `autoprefixer` | ^10.4.21 | Vendor prefixing |
| `eslint` | ^9.32.0 | Linting |
| `vitest` | ^3.2.4 | Unit testing |
| `@testing-library/react` | ^16.0.0 | React testing |
| `@types/node` | ^22.16.5 | Node.js types |

---

## 4. Database & Data Models

### Database Strategy

The application supports **dual persistence**:

1. **JSON File** (Development/Default): `.data/auth.json`
2. **PostgreSQL** (Production): Auto-enabled when `DATABASE_URL` is set

### JSON Schema Structure

```json
{
  "users": [ User ],
  "products": [ Product ],
  "categories": [ string ],
  "orders": [ Order ],
  "storeName": "Toko Ar-Rahmah",
  "appIcon": "/brand/logo.png",
  "isStoreOpen": true
}
```

### Data Models

#### User
```typescript
interface User {
  id: string;                    // Format: "u_<hex>"
  name: string;                   // Display name
  email: string;                  // Unique, lowercase
  phone: string;                 // Contact number
  role: "admin" | "customer";   // Authorization role
  passwordHash: string;           // PBKDF2-SHA256 format
  createdAt: number;             // Unix timestamp (ms)
}
```

#### Product
```typescript
interface Product {
  id: string;                     // Format: "p<number>"
  name: string;                   // Product name
  price: number;                  // Price in IDR
  category: string;               // Category name
  image: string;                  // URL or Vite import path
  stock: number;                  // Available quantity
  description?: string;           // Optional description
}
```

#### Order
```typescript
interface Order {
  id: string;                     // Format: "o_<timestamp>_<hex>"
  pickupId: string;               // Format: "QP-XXX-XXX" (customer code)
  customerName: string;           // From user profile
  customerPhone: string;          // From user profile
  customerEmail: string;          // From user profile
  items: OrderItem[];            // Line items
  total: number;                  // Calculated total (IDR)
  status: "Pending" | "Preparing" | "Ready" | "Completed";
  createdAt: number;              // Unix timestamp (ms)
  paid: boolean;                  // Payment status
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  checked?: boolean;               // Tracks if item prepared during "Preparing" status
}
```

#### Customer (Virtual - Aggregated from Orders)
```typescript
interface Customer {
  id: string;                     // "c_<hex email>"
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderAt: number | null;
  createdAt: number;
}
```

### PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL DEFAULT '',
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'customer')),
  password_hash VARCHAR(512) NOT NULL,
  created_at BIGINT NOT NULL
);

-- App state table (catalog, orders as JSONB)
CREATE TABLE app_state (
  key VARCHAR(64) PRIMARY KEY,
  value JSONB NOT NULL
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Entity Relationships

```
┌─────────────┐       ┌─────────────┐
│    User     │       │   Order     │
├─────────────┤       ├─────────────┤
│ id (PK)     │───┐   │ id (PK)     │
│ name        │   │   │ customerEmail│──┐
│ email       │   │   │ customerName │  │
│ phone       │   └──►│ createdAt   │  │
│ role        │       │ total       │  │
│ passwordHash│       │ status      │  │
│ createdAt   │       └─────────────┘  │
└─────────────┘                        │
                                       │
        ┌──────────────────────────────┘
        │ (Customer is a virtual entity
        │  derived from orders with
        │  same email)
        ▼
   ┌─────────────┐       ┌─────────────┐
   │  Customer   │       │   OrderItem │
   ├─────────────┤       ├─────────────┤
   │ id          │       │ productId   │──┐
   │ name        │       │ name        │  │
   │ email       │       │ price       │  │
   │ phone       │       │ quantity    │  │
   │ totalOrders │       │ checked?    │  │
   │ totalSpent  │       └─────────────┘  │
   └─────────────┘                        │
                                         │
        ┌─────────────────────────────────┘
        ▼
   ┌─────────────┐       ┌─────────────┐
   │   Product   │       │  Category   │
   ├─────────────┤       ├─────────────┤
   │ id (PK)     │       │ name (PK)   │──┐
   │ name        │       └─────────────┘  │
   │ price       │                        │
   │ category ───┼────────────────────────┘
   │ image       │
   │ stock       │
   │ description │
   └─────────────┘
```

---

## 5. API Routing & Endpoints

### Base Configuration
- **Base URL**: `/api`
- **Port**: `8787` (configurable via `PORT` env)
- **Content-Type**: `application/json`
- **Auth Method**: HttpOnly cookies (`qp_session`)

### Endpoint Table

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| `GET` | `/health` | Health check | No | — | `"ok"` |
| `GET` | `/api/notifications/stream` | SSE stream for real-time notifications | Yes | — | EventStream |
| `GET` | `/api/auth/session` | Get current session | No | — | `{ user: User \| null }` |
| `POST` | `/api/auth/signin` | Login | No | `{ email, password }` | `{ user }` + Set-Cookie |
| `POST` | `/api/auth/signout` | Logout | No | — | `{ ok: true }` + Clear-Cookie |
| `POST` | `/api/auth/register` | Create account | No | `{ name, phone, email, password }` | `{ user }` + Set-Cookie |
| `GET` | `/api/catalog` | Get products/categories | No | — | `CatalogState` |
| `POST` | `/api/catalog/bootstrap` | Seed initial data | No | `CatalogState` | `CatalogState` |
| `PUT` | `/api/catalog` | Update catalog | Admin only | `CatalogState` | `CatalogState` |
| `GET` | `/api/orders` | Get user's orders | Yes | — | `{ orders: Order[] }` |
| `POST` | `/api/orders` | Create new order | Yes | `{ items: CartItem[] }` | `{ order, catalog }` |
| `PATCH` | `/api/orders/:id` | Update order status/payment/items | Admin only | `{ status?, paid?, items? }` | `{ order }` |
| `GET` | `/api/customers` | List all customers | Admin only | — | `{ customers: Customer[] }` |
| `GET` | `/api/customers/:email` | Get customer + orders | Admin only | — | `{ customer, orders }` |

### Response Payloads

#### CatalogState
```typescript
{
  products: Product[];
  categories: string[];
  storeName: string;
  appIcon: string | null;
  isStoreOpen: boolean;
}
```

#### User
```typescript
{
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin";
}
```

#### Order
```typescript
{
  id: string;
  pickupId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: "Pending" | "Preparing" | "Ready" | "Completed";
  createdAt: number;
  paid: boolean;
}
```

### Error Responses

All API errors return JSON with a `message` field:
```json
{ "message": "Error description" }
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (not logged in)
- `404` - Not Found
- `409` - Conflict (e.g., email taken, store closed)
- `500` - Internal Server Error

### Middleware/Pipeline

```
Request
   │
   ▼
┌──────────────────────┐
│  Check /health       │──Yes──► Handle health (return "ok")
└──────────────────────┘
         │
         ▼ No
┌──────────────────────┐
│  Check SSE Stream    │──Yes──► Register client, send heartbeats
└──────────────────────┘
         │
         ▼ No
┌──────────────────────┐
│  Check /api/*        │──No───► Serve static file (SPA)
└──────────────────────┘
         │
         ▼ Yes
┌──────────────────────┐
│  Parse URL & Method  │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│  Auth Check (if req) │──No auth──► Return 401
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│  Route Handler       │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│  Database Operation  │
│  (JSON or Postgres) │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│  Broadcast SSE       │ (if order created/updated)
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│  JSON Response       │
│  + Cookie (if auth)  │
└──────────────────────┘
```

### Server-Sent Events (SSE) Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │◄────│   Server    │────►│   Database  │
│  (Browser)  │     │  (auth-server)│    │ (JSON/PG)   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   ┌───────────┐    ┌───────────┐    ┌───────────┐
   │   Admin   │    │ Customer  │    │  Clients  │
   │ Clients   │    │ Clients   │    │  Map      │
   │ (N)       │    │ (N)       │    │ (sseClients)
   └───────────┘    └───────────┘    └───────────┘
```

**Notification Types:**
- `connected` — Initial handshake, confirms role
- `new_order` — Broadcast to all admins on new order
- `order_update` — Broadcast to customer who owns the order

**SSE Client Management:**
- Clients stored in `Map<clientId, { res, userId, role }>`
- Heartbeat every 30 seconds to keep connections alive
- Auto-cleanup on client disconnect

---

## 6. System Data Flow & Component Interaction

### User Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────►│   Server    │────►│   Database  │
│  (Browser)  │◄────│ (auth-server)│◄────│ (JSON/PG)   │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. **Login Request**: Client POSTs to `/api/auth/signin`
2. **Password Verification**: Server compares PBKDF2 hash
3. **Session Creation**: Server generates 32-byte random session ID
4. **Cookie Set**: `HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`
5. **Response**: `{ user: { id, name, email, phone, role } }`

### Order Placement Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Shop   │───►│  Cart   │───►│Checkout │───►│ API Call│───►│ Server  │
│  Page   │    │  Page   │    │  Page   │    │         │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └────┬────┘
                                                                     │
         ┌───────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Validate Stock  │────►│ Deduct Stock     │────►│ Create Order    │
│ (server check)  │     │ (update product)│     │ (generate ID)   │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                            │
         ┌──────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Save to DB      │────►│ Return Order    │────►│ Update Zustand  │
│ (JSON/Postgres) │     │ + New Catalog   │     │ + Clear Cart    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Order Preparation Flow (Admin)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Pending    │───►│  Preparing   │───►│    Ready     │───►│  Completed   │
│   (new)      │    │ (in progress)│    │  (all done) │    │  (paid)      │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                          │
                          ▼
               ┌────────────────────────┐
               │  Item Checkboxes       │
               │  - Show when status    │
               │    is "Preparing"      │
               │  - Each item can be    │
               │    checked off         │
               │  - Ready only enabled  │
               │    when all checked    │
               └────────────────────────┘
```

**Preparation Workflow:**
1. New order arrives → status = "Pending"
2. Admin changes to "Preparing" → checkboxes appear for each item
3. Admin checks each item as it's prepared
4. When all items checked → "Siap" button becomes active
5. Admin marks "Ready" → customer notified via SSE

### Frontend State Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Zustand Store                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ products, categories, cart, orders, user, storeName,      │   │
│  │ appIcon, isStoreOpen, notifications                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│     ┌────────────────────────┼────────────────────────┐        │
│     ▼                        ▼                        ▼        │
│  ┌─────────┐            ┌───────────┐            ┌──────────┐    │
│  │  Cart   │            │  Orders   │            │ Products │    │
│  │Actions  │            │  Actions  │            │  Actions │    │
│  └─────────┘            └───────────┘            └──────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TanStack Query Cache                          │
│  - Session validation on app load                                │
│  - Catalog polling every 15 seconds                              │
│  - Order list updates                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Theme Context (next-themes)                  │
│  - Dark/Light/System mode detection                              │
│  - Persisted to localStorage                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Admin Navigation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       AdminLayout                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Sidebar (collapsible)     │  Main Content Area        │   │
│  │  ┌─────────────────────┐    │                            │   │
│  │  │ Logo + Store Name   │    │  <PageHeader />            │   │
│  │  │─────────────────────│    │  <AnalyticsFilters />      │   │
│  │  │ 📊 Analitik         │    │  ...                       │   │
│  │  │ 🏪 Produk           │    │                            │   │
│  │  │ 📋 Pesanan          │    │                            │   │
│  │  │ 👥 Pelanggan        │    │                            │   │
│  │  │ ⚙️ Pengaturan       │    │                            │   │
│  │  │─────────────────────│    │                            │   │
│  │  │ 🌓 Theme Toggle     │    │                            │   │
│  │  │ 📂 Collapse         │    │                            │   │
│  │  └─────────────────────┘    │                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Customer Aggregation Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Orders    │────►│   Group by  │────►│  Aggregate  │────►│   Return    │
│  (from DB)  │     │   Email     │     │  (stats)   │     │  Customer[] │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │ avgOrder    │
                                       │ totalSpent  │
                                       │ lastOrderAt │
                                       └─────────────┘
```

### Admin Analytics Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Orders    │────►│   Filter    │────►│   Compute   │────►│   Render    │
│  (from DB)  │     │  (date/cat) │     │  (stats)    │     │   (Charts) │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
     │                                        │
     │                                        ▼
     │                              ┌─────────────────┐
     └─────────────────────────────►│  Comparisons    │
                                    │  (vs prev/day) │
                                    └─────────────────┘
```

---

## 7. Configuration & Environment Variables

### Required Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8787` | Server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `ADMIN_EMAIL` | No* | — | Admin account email |
| `ADMIN_PASSWORD` | No* | — | Admin account password |
| `DATABASE_URL` | No | — | PostgreSQL connection string |
| `DATA_DIR` | No | `.data` | Path to JSON data directory |
| `PGSSLMODE` | No | — | Set to `disable` to disable PostgreSQL SSL |
| `RAILWAY_VOLUME_MOUNT_PATH` | No | — | Railway persistent volume path |

*Required if you want auto-created admin account

### Example .env

```bash
# Admin Account (creates on first run if not exists)
ADMIN_EMAIL=admin@toko.com
ADMIN_PASSWORD=SecurePassword123

# Server Configuration
NODE_ENV=production
PORT=8787

# PostgreSQL (optional - enables when set)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
PGSSLMODE=disable

# File Storage (for Railway volumes)
DATA_DIR=/app/.data
RAILWAY_VOLUME_MOUNT_PATH=/app/.data
```

### Configuration Loading Order

1. Environment variables from `.env` or system
2. Command-line arguments
3. Default values hardcoded in `auth-server.mjs`

---

## 8. Development & Deployment Guide

### Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Build frontend (required for production server)
npm run build

# 3. Start backend server
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=AdminPass123 npm run server

# 4. Open in browser
http://localhost:8787
```

### Vite Development Mode (with hot reload)

```bash
# Terminal 1: Backend server
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=AdminPass123 npm run server

# Terminal 2: Vite dev server
npm run dev

# Access via http://localhost:8080 (proxies /api to :8787)
```

### Production Build

```bash
# Build frontend
npm run build

# Start production server
NODE_ENV=production ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=Pass123 npm start
```

### Docker Deployment

```bash
# Build image
docker build -t tokar-rahmah-orders .

# Run container
docker run -p 8787:8787 \
  -e NODE_ENV=production \
  -e ADMIN_EMAIL=admin@domain.com \
  -e ADMIN_PASSWORD=strongpassword \
  -v pos-data:/app/.data \
  tokar-rahmah-orders
```

### Railway Deployment

1. Connect repository to Railway
2. Add PostgreSQL service
3. Set environment variables:
   ```
   NODE_ENV=production
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_PASSWORD=<strong-password>
   ```
4. Deploy — Railway auto-detects Dockerfile
5. Set health check path to `/health`

### PostgreSQL Migration

```bash
# Ensure DATABASE_URL is set
export DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Run migration
node server/migrate.mjs
```

### Generate Test Data

```bash
# Generate 365 days of dummy orders
node server/generate-dummy-data.mjs
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Build verification
npm run build

# Lint check
npm run lint
```

### Key File Descriptions

| File | Purpose |
|------|---------|
| `server/auth-server.mjs` | Main backend server — handles all API routes, auth, SSE streaming, and static file serving |
| `server/migrate.mjs` | One-time script to migrate JSON data to PostgreSQL |
| `server/generate-dummy-data.mjs` | Utility to generate sample orders for testing |
| `src/lib/store.ts` | Zustand store — single source of truth for frontend state |
| `src/lib/api.ts` | API client — all HTTP requests to backend |
| `src/hooks/useNotifications.tsx` | SSE hook — connects to notification stream, handles real-time order updates |
| `src/components/NotificationBell.tsx` | Admin notification dropdown — shows recent orders with unread badge |
| `src/components/FloatingCartButton.tsx` | Customer floating cart button — shows item count and total |
| `src/components/LoginPrompt.tsx` | Guest login dialog — allows quick sign-in from product/cart pages |
| `src/App.tsx` | Root component — router setup, session initialization, SSE polling |
| `src/pages/admin/Dashboard.tsx` | Analytics dashboard with charts, filters, and KPIs |

---

*Generated on 2026-06-04 — Toko Ar-Rahmah Orders v1.0*