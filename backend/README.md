<div align="center">

# ⚙️ Kids & Family — Backend REST API & AI Engine

**High-Performance Django REST Framework Backend with Google Gemini 2.5 Flash AI Assistant, Supabase PostgreSQL & Cloudflare R2**

[![Django 6](https://img.shields.io/badge/Django-6.1+-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/Django_REST_Framework-3.18+-red?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_:6543-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2_S3_Storage-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/r2/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI_3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](http://127.0.0.1:8000/api/docs/)

</div>

---

## 📌 Table of Contents
1. [Architecture & Design Philosophy](#-architecture--design-philosophy)
2. [Apps & Domain Models](#-apps--domain-models)
3. [🤖 AI Assistant & NLP Architecture](#-ai-assistant--nlp-architecture)
4. [Database & Connection Pooling](#-database--connection-pooling)
5. [Cloudflare R2 Object Storage](#-cloudflare-r2-object-storage)
6. [Complete REST API Reference](#-complete-rest-api-reference)
7. [Local Development Setup](#-local-development-setup)
8. [Production Deployment (Vercel)](#-production-deployment-vercel)

---

## 🏛️ Architecture & Design Philosophy

The **Kids & Family Backend** is designed around domain-driven Django apps, ensuring clean separation of concerns, high concurrency safety, and zero-latency AI responses:

```text
backend/
├── backend/                  # Project configuration, settings, WSGI/ASGI handlers
├── apps/
│   ├── accounts/             # JWT, User profiles, RBAC, Google OAuth 2.0
│   ├── ai_assistant/         # Gemini 2.5 AI, Bangla NLP, Tracking & Modifications
│   ├── categories/           # Parent/child hierarchical trees
│   ├── products/             # Multi-attribute variants, SKU, Price & Sale
│   ├── cart/                 # Dual user/guest carts with atomic merging
│   ├── wishlist/             # Instant favorite toggles & queries
│   ├── orders/               # Atomic checkout, inventory locks & tracking
│   ├── promotions/           # Homepage hero carousel banner management
│   └── dashboard/            # Business intelligence & analytics
├── media/                    # Local media (synced to Cloudflare R2 in production)
├── staticfiles/              # WhiteNoise compressed static assets
├── manage.py                 # Django management CLI
├── requirements.txt          # Python dependencies
└── vercel.json               # Serverless Python WSGI runner spec
```

---

## 📦 Apps & Domain Models

### 1. `apps.accounts`
- **Custom User Model (`User`):** Email-based primary authentication, mobile phone number, customer delivery address, avatar, role permissions (`is_staff`, `is_superuser`).
- **Google OAuth 2.0:** Secure authorization code exchange with state preservation for dynamic frontend redirections.
- **JWT (JSON Web Tokens):** Sliding window access token with rotating refresh tokens via `SimpleJWT`.

### 2. `apps.products` & `apps.categories`
- **Category Tree:** Hierarchical categories (`men`, `women`, `boy`, `girl`, `family-matching`, etc.) with slugged URLs and dynamic product counts.
- **Multi-Attribute Product Variants:** Flexible architecture where each product has multiple variants (e.g., Color: Navy Blue, Size: 40) with dedicated SKU, stock quantity, and price overrides.
- **Compare-at Pricing:** Automatic computation of promotional discount percentages.

### 3. `apps.cart`
- **Dual Session Mechanism:** Works seamlessly for authenticated users and unauthenticated guests using the `X-Session-Key` header.
- **Smart Cart Merging:** When a guest logs in or registers, their existing session cart items automatically merge into their permanent account.

### 4. `apps.orders`
- **Atomic Stock Reservation:** High-concurrency checkout wrapped in `transaction.atomic()` with stock validation and inventory deduction to eliminate overselling.
- **Tracking ID Generator:** Unique human-friendly IDs in the format `KF<YYMMDD><RAND>` (e.g. `KF2610183381`).
- **Bangladesh Delivery Zones:** Automatically resolves delivery fees (Inside Dhaka: ৳60, Outside Dhaka: ৳120).
- **Status Pipeline:** `pending` ➔ `confirmed` ➔ `processing` ➔ `shipped` ➔ `delivered` (or `cancelled`).

---

## 🤖 AI Assistant & NLP Architecture

Located in `apps/ai_assistant/services.py`, this engine powers the conversational shopping experience:

```mermaid
flowchart TD
    UserMsg["Customer Message in Bengali / English"] --> Step0["Fast Deterministic Guard"]
    Step0 -->|Prompt Injection / Off-topic / Out-of-scope| FastReply["Instant Guard Response (0ms)"]
    Step0 --> Step1["Shopping Preemption Guard"]
    Step1 -->|Product browsing (frock, panjabi, size, price)| StepRec["Intelligent Recommender + Gemini AI"]
    Step1 -->|Modification inquiry| StepMod["Order Modification & Cancellation Engine"]
    StepMod -->|Valid change (Address / Phone / Cancel)| ModSuccess["Atomic Order Update + Memo"]
    StepMod -->|Not modifying| StepCart["Conversational Add-to-Cart Engine"]
    StepCart -->|Add item to cart| CartReply["Cart Drawer Updated"]
    StepCart --> StepTrack["Order Tracking Detection"]
    StepTrack -->|Order ID or Phone Provided| TrackLookup["Fetch Live DB Order + Status Card"]
    StepTrack --> StepRec
    StepRec --> GeminiCall["Google Gemini 2.5 Flash (google-genai)"]
    GeminiCall --> FinalResponse["Warm Bengali Reply + Interactive Product Cards"]
```

### Key Technical Capabilities:
1. **Bengali Digit Normalization:** Automatically converts Bengali numerals (`০-৯`) to Western digits (`0-9`) for bulletproof order ID and phone matching.
2. **Shopping Preemption Guard:** When a customer asks about products (e.g., *"বাচ্চা মেয়েদের সুতি ফ্রক দেখান"*), the order modification engine immediately yields, preventing conversational loops.
3. **Conversational Order Modifications:**
   - **Delivery Address Update:** Updates order address, recalculates shipping fee (Inside/Outside Dhaka), updates grand total.
   - **Phone Number Update:** Validates 11-digit Bangladeshi mobile numbers (`013-019`) and updates the courier contact.
   - **Atomic Cancellation:** Cancels pending orders and immediately restores variant stock quantities.
4. **1-Click AI Product Description Generator:** Generates professional Bengali/English e-commerce product copy for admins via `/api/ai/generate-description/`.

---

## 🐘 Database & Connection Pooling

### Supabase PostgreSQL Setup
The application connects to Supabase PostgreSQL using `psycopg3` and `dj-database-url`:

> [!IMPORTANT]
> **Always use the Transaction Pooler (Port 6543) in production.**
> Port `5432` is the Direct Session connection limited to 15 concurrent slots. Port `6543` enables PgBouncer transaction-level multiplexing, allowing persistent connections without exhausting the server:

```python
# backend/settings.py
if is_transaction_pooler:
    conn_age = 60  # Keeps TCP and SSL handshake alive across requests
    # Enables TCP keepalive probes to prevent idle connection termination
    DATABASES["default"]["OPTIONS"]["keepalives"] = 1
    DATABASES["default"]["OPTIONS"]["keepalives_idle"] = 30
```

---

## ☁️ Cloudflare R2 Object Storage

Media assets (product photos, category banners, avatar uploads) are served globally with zero egress fees via **Cloudflare R2**:

- **Driver:** `django-storages[boto3]`
- **S3 Protocol:** Custom endpoint URL `https://<account_id>.r2.cloudflarestorage.com`
- **Fallback:** If R2 environment variables are not provided, Django smoothly defaults to local filesystem media storage at `media/`.

---

## 📖 Complete REST API Reference

Interactive documentation is available via:
- **Swagger UI:** `/api/docs/`
- **ReDoc:** `/api/redoc/`
- **OpenAPI 3.0 Schema:** `/api/schema/`

### 1. Authentication (`/api/auth/`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register/` | Register new user & obtain JWT tokens | Public |
| `POST` | `/api/auth/login/` | Authenticate with email & password | Public |
| `POST` | `/api/auth/google/` | Google OAuth token handshake & login | Public |
| `POST` | `/api/auth/token/refresh/` | Refresh expired access token | Public |
| `GET` | `/api/auth/profile/` | Fetch current authenticated user profile | User |
| `PATCH` | `/api/auth/profile/` | Update profile information | User |
| `POST` | `/api/auth/change-password/` | Change account password | User |
| `GET` | `/api/auth/dashboard-summary/` | Customer summary metrics (orders, pending, wishlist) | User |

### 2. AI Shopping Assistant (`/api/ai/`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/ai/chat/` | Conversational shopping, tracking, & modifications | Public |
| `GET/POST`| `/api/ai/search/` | Semantic natural language product search | Public |
| `POST` | `/api/ai/generate-description/`| 1-Click AI Product Description generator | Staff |

#### Sample `/api/ai/chat/` Payload:
```json
{
  "message": "বাচ্চা মেয়েদের সুতি ফ্রক দেখান",
  "history": [
    {"role": "user", "text": "আমার অর্ডার ট্র্যাক করতে চাই"},
    {"role": "model", "text": "আপনার অর্ডারটি ট্র্যাক করতে অনুগ্রহ করে অর্ডার নম্বরটি লিখে জানান।"}
  ],
  "session_key": "guest-uuid-1234"
}
```

### 3. Categories (`/api/categories/`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/categories/` | Hierarchical category tree with subcategories | Public |
| `GET` | `/api/categories/?all=true` | Flat category list | Public |
| `POST` | `/api/categories/` | Create category | Admin |
| `GET` | `/api/categories/<slug>/` | Category details | Public |
| `PATCH` | `/api/categories/<slug>/` | Update category | Admin |
| `DELETE`| `/api/categories/<slug>/` | Delete category | Admin |

### 4. Products & Variants (`/api/products/`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/products/` | Filterable, paginated product list | Public |
| `POST` | `/api/products/` | Create product with variants | Admin |
| `GET` | `/api/products/<id>/` | Single product detail with swatches & stock | Public |
| `PATCH` | `/api/products/<id>/` | Update product details | Admin |
| `DELETE`| `/api/products/<id>/` | Delete product | Admin |
| `GET` | `/api/products/<id>/variant/?color=X&size=Y` | Check variant SKU, stock, and price | Public |
| `GET` | `/api/products/sale/` | Products currently on sale | Public |
| `GET` | `/api/products/attributes/types/` | List attribute types (Color, Size) | Public |
| `GET` | `/api/products/attributes/values/`| List attribute values | Public |

### 5. Shopping Cart (`/api/cart/`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/cart/` | Get current cart, line items, and totals | Guest / User |
| `POST` | `/api/cart/add/` | Add product variant to cart | Guest / User |
| `PATCH` | `/api/cart/items/<item_id>/` | Update item quantity (`increase`, `decrease`, `set`) | Guest / User |
| `DELETE`| `/api/cart/items/<item_id>/remove/` | Remove item from cart | Guest / User |
| `POST` | `/api/cart/clear/` | Empty cart | Guest / User |
| `POST` | `/api/cart/merge/` | Merge guest cart items into authenticated user cart | User |

### 6. Orders & Checkout (`/api/orders/`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/orders/checkout/` | Place atomic order from cart | Guest / User |
| `GET` | `/api/orders/` | List user order history | Guest / User |
| `GET` | `/api/orders/<order_number>/` | Single order details & item breakdown | Guest / User |
| `POST` | `/api/orders/<order_number>/pay/` | Payment confirmation stub | Guest / User |
| `GET` | `/api/orders/admin/all/` | Staff view of all orders (`?status=pending`) | Staff |
| `PATCH` | `/api/orders/admin/<order_number>/` | Staff update order status & payment state | Staff |

### 7. Wishlist (`/api/wishlist/`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/wishlist/` | List favorited products | Guest / User |
| `POST` | `/api/wishlist/toggle/<product_id>/` | Toggle item in wishlist | Guest / User |
| `GET` | `/api/wishlist/check/<product_id>/` | Check if product is favorited | Guest / User |

### 8. Promotions (`/api/promotions/`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/promotions/banners/live/` | Active hero carousel banners | Public |
| `GET` | `/api/promotions/banners/` | All banners list | Admin |
| `POST` | `/api/promotions/banners/` | Create banner with image upload | Admin |
| `PATCH` | `/api/promotions/banners/<id>/` | Update banner | Admin |

### 9. Admin Analytics (`/api/dashboard/`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/dashboard/stats/` | Revenue, order stats, 14-day sales chart data | Admin |
| `GET` | `/api/dashboard/notifications/count/` | Live badge count for pending orders | Admin |

---

## 🛠️ Local Development Setup

1. **Create and activate a virtual environment:**
   ```bash
   python -m venv .kidenv
   # Windows PowerShell:
   .\.kidenv\Scripts\Activate.ps1
   # macOS/Linux:
   source .kidenv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure your `.env` file:**
   ```bash
   cp .env.example .env
   ```

4. **Apply migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Start server:**
   ```bash
   python manage.py runserver 8000
   ```

---

## 🚀 Production Deployment (Vercel)

The backend is configured for serverless execution using Vercel's Python WSGI runtime:

1. **`build.sh`:** Collects static files and installs dependencies automatically:
   ```bash
   python -m pip install -r requirements.txt
   python manage.py collectstatic --noinput
   ```
2. **`vercel.json`:** Directs all incoming traffic to `backend/wsgi.py`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "backend/wsgi.py",
         "use": "@vercel/python",
         "config": { "maxLambdaSize": "15mb", "runtime": "python3.12" }
       }
     ],
     "routes": [
       { "src": "/(.*)", "dest": "backend/wsgi.py" }
     ]
   }
   ```
