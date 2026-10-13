# KIDS&FAMILY E-Commerce Backend REST API

A scalable, production-ready Django REST Framework (DRF) backend API for the **KIDS&FAMILY** e-commerce platform.

---

## 🌟 Features Overview

- **Authentication & User Management**:
  - Email-based authentication with **JWT (JSON Web Tokens)** via `SimpleJWT`.
  - User registration, login, token refresh, profile update, and password change.
  - User dashboard metrics (orders, pending items, wishlist counter).
- **Categories**:
  - Hierarchical tree structure (Parent categories and subcategories).
  - Product count per category.
- **Products & Variants**:
  - Multi-attribute variants (Color, Size, Custom Attributes).
  - SKU generation, inventory tracking, compare-at pricing (sale discount percentage).
  - Search by title, category, description, and price range.
  - Sorting: Price ascending/descending, newest arrivals.
  - Filterable by multiple category slugs simultaneously.
  - On-sale products endpoint (`/api/products/sale/`).
- **Shopping Bag / Cart**:
  - Dual support for **Authenticated Customers** and **Guest Users** (via `X-Session-Key` header).
  - Quantity increment/decrement, inventory stock capping.
  - Guest cart merging into user cart upon login.
- **Wishlist / Favorites**:
  - Instant heart toggle for products.
  - Status checking per product.
- **Order Management & Checkout**:
  - Atomic transaction checkout with inventory auto-decrement.
  - Unique order number generation (`KF<YYMMDD><RAND>`).
  - Order tracking, detail views, and payment stub simulation.
  - Staff / Admin order list with status updates (`pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`).
- **Promotions & Banners**:
  - Scheduled promotional banners (active dates, CTA text, deep links).
  - Live banners filter for homepage hero carousel.
- **Admin Dashboard Analytics**:
  - Revenue calculation (today revenue, total revenue).
  - 14-day daily sales history array for charts.
  - Top 5 best-selling products by quantity.
  - Real-time pending orders notification counter.
- **Interactive API Documentation**:
  - **Swagger UI**: `/api/docs/`
  - **ReDoc**: `/api/redoc/`
  - **OpenAPI Schema**: `/api/schema/`

---

## 🚀 Getting Started

### 1. Requirements & Setup
Make sure you have Python 3.10+ installed.

```bash
# Navigate to the backend folder
cd "c:\Users\Tanbir Hasan\Desktop\KIDS&FAMILY Backend"

# Create a virtual environment (optional if using .kidenv)
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Start the API Server
```bash
python manage.py runserver 8000
```
The API is now running at `http://127.0.0.1:8000/api/`!  
Visit the interactive Swagger UI at: `http://127.0.0.1:8000/api/docs/`

---

## 🔑 Authentication Guide

For protected endpoints, include the JWT access token in the `Authorization` header:

```http
Authorization: Bearer <your_access_token>
```

For **Guest Users** (Cart & Wishlist without logging in), include:
```http
X-Session-Key: <unique_guest_uuid_or_string>
```

---

## 📖 Complete API Reference

### 1. Authentication (`/api/auth/`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register/` | Register new account & get tokens | No |
| `POST` | `/api/auth/login/` | Log in with email & password | No |
| `POST` | `/api/auth/token/refresh/` | Refresh expired access token | No |
| `GET` | `/api/auth/profile/` | Get current user profile | Yes |
| `PATCH` | `/api/auth/profile/` | Update user details (name, phone, address) | Yes |
| `POST` | `/api/auth/change-password/` | Change password (`old_password`, `new_password`) | Yes |
| `GET` | `/api/auth/dashboard-summary/` | Customer dashboard metrics & recent orders | Yes |

#### Sample Login Request:
```json
POST /api/auth/login/
Content-Type: application/json

{
  "email": "admin@gmail.com",
  "password": "yourpassword"
}
```

---

### 2. Categories (`/api/categories/`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/categories/` | List root categories with nested children | No |
| `GET` | `/api/categories/?all=true` | Flat list of all categories | No |
| `POST` | `/api/categories/` | Create a new category | Admin |
| `GET` | `/api/categories/<slug_or_id>/` | Category details | No |
| `PATCH` | `/api/categories/<slug_or_id>/` | Update category | Admin |
| `DELETE` | `/api/categories/<slug_or_id>/` | Delete category | Admin |

---

### 3. Products & Variants (`/api/products/`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/products/` | Filterable, paginated product list | No |
| `POST` | `/api/products/` | Create new product | Admin |
| `GET` | `/api/products/<id>/` | Single product detail with colors & sizes | No |
| `PATCH` | `/api/products/<id>/` | Update product | Admin |
| `DELETE` | `/api/products/<id>/` | Delete product | Admin |
| `GET` | `/api/products/<id>/variant/?color=X&size=Y` | Check variant stock, price & SKU | No |
| `GET` | `/api/products/sale/` | Products with active discounts | No |
| `GET` | `/api/products/attributes/types/` | List attribute types (e.g. Color, Size) | No |
| `GET` | `/api/products/attributes/values/` | List attribute values (?type=Color) | No |
| `POST` | `/api/products/attributes/values/` | Create attribute value | Admin |
| `DELETE` | `/api/products/attributes/values/<id>/` | Delete attribute value | Admin |

#### Product Filtering Query Parameters:
- `cat`: Filter by category slug (e.g. `?cat=boy&cat=men`)
- `q`: Search keyword across name, description, category
- `sort`: `price_asc`, `price_desc`, or `newest`
- `min_price` / `max_price`: Numerical price bounds
- `featured=true`: Homepage top 8 products

---

### 4. Cart (`/api/cart/`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/cart/` | Get current cart, items, total price | Guest or User |
| `POST` | `/api/cart/add/` | Add variant to cart | Guest or User |
| `PATCH` | `/api/cart/items/<item_id>/` | Update quantity (`increase`, `decrease`, `set`) | Guest or User |
| `DELETE` | `/api/cart/items/<item_id>/remove/` | Remove item from cart | Guest or User |
| `POST` | `/api/cart/clear/` | Clear entire cart | Guest or User |
| `POST` | `/api/cart/merge/` | Merge guest cart into user cart | Yes |

#### Add to Cart Payload:
```json
POST /api/cart/add/
{
  "variant_id": 14,
  "quantity": 1
}
```

---

### 5. Wishlist (`/api/wishlist/`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/wishlist/` | List favorited products | Guest or User |
| `POST` | `/api/wishlist/toggle/<product_id>/` | Toggle item in wishlist | Guest or User |
| `GET` | `/api/wishlist/check/<product_id>/` | Check if product is favorited | Guest or User |

---

### 6. Orders & Checkout (`/api/orders/`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/orders/checkout/` | Place order from cart | Guest or User |
| `GET` | `/api/orders/` | List user order history | Guest or User |
| `GET` | `/api/orders/<order_number>/` | Order details & items | Guest or User |
| `POST` | `/api/orders/<order_number>/pay/` | Payment verification simulation | Guest or User |
| `GET` | `/api/orders/admin/all/` | Admin all orders list (?status=pending) | Admin |
| `PATCH` | `/api/orders/admin/<order_number>/` | Admin update status / payment | Admin |

#### Checkout Payload:
```json
POST /api/orders/checkout/
{
  "full_name": "Tanbir Hasan",
  "phone": "01700000000",
  "email": "customer@example.com",
  "address_line": "House 12, Road 4, Sector 7",
  "city": "Dhaka",
  "notes": "Please call before delivery",
  "payment_method": "cod"
}
```

---

### 7. Promotions (`/api/promotions/`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/promotions/banners/live/` | Live banners for hero carousel | No |
| `GET` | `/api/promotions/banners/` | All banners list | Admin |
| `POST` | `/api/promotions/banners/` | Create banner | Admin |
| `PATCH` | `/api/promotions/banners/<id>/` | Update banner | Admin |
| `POST` | `/api/promotions/banners/<id>/toggle/` | Toggle active status | Admin |

---

### 8. Admin Dashboard Analytics (`/api/dashboard/`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/dashboard/stats/` | Revenue, orders, 14-day chart & top products | Admin |
| `GET` | `/api/dashboard/notifications/count/` | Pending orders notification badge count | Admin |

---

## 📁 Project Structure

```
KIDS&FAMILY Backend/
├── backend/
│   ├── settings.py           # Settings (CORS, JWT, DRF, SQLite, Media)
│   ├── urls.py               # Root URL router & Swagger docs
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── accounts/             # Authentication, JWT, User Profile
│   ├── categories/           # Categories & Subcategory Trees
│   ├── products/             # Products, Variants, Attributes & Sale
│   ├── cart/                 # User & Guest Cart Operations
│   ├── wishlist/             # Favorites & Wishlist Toggle
│   ├── orders/               # Checkout, Inventory & Order Management
│   ├── promotions/           # Promo Banners & Scheduling
│   └── dashboard/            # Admin Analytics & Notifications
├── media/                    # Product images & variant assets
├── db.sqlite3                # Pre-populated SQLite database
├── manage.py                 # Django CLI management script
├── requirements.txt          # Python dependencies
├── .env.example              # Environment variables template
└── README.md                 # Complete documentation
```

