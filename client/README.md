<div align="center">

# 💻 Kids & Family — Modern React 19 Frontend Client

**A High-Performance Festive Fashion E-Commerce SPA Powered by React 19, Tailwind CSS v4, Vite 8 & Lucide Icons**

[![React 19](https://img.shields.io/badge/React-19.2+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite 8](https://img.shields.io/badge/Vite-8.3+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React Router 7](https://img.shields.io/badge/React_Router-7.18+-CA4245?style=for-the-badge&logo=react-router&logoColor=white)](https://reactrouter.com/)
[![Lucide Icons](https://img.shields.io/badge/Lucide_Icons-1.55+-F56565?style=for-the-badge)](https://lucide.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

</div>

---

## 📌 Table of Contents
1. [Overview & Design Language](#-overview--design-language)
2. [Component Hierarchy & Key UI Modules](#-component-hierarchy--key-ui-modules)
3. [🤖 Floating AI Shopping Assistant Widget](#-floating-ai-shopping-assistant-widget)
4. [State Architecture & Context API](#-state-architecture--context-api)
5. [API Client & Interceptor Architecture](#-api-client--interceptor-architecture)
6. [Folder Structure](#-folder-structure)
7. [Getting Started & Development](#-getting-started--development)
8. [Production Build & Vercel Deployment](#-production-build--vercel-deployment)

---

## 🎨 Overview & Design Language

The **Kids & Family Client** is built using **React 19** and the latest **Tailwind CSS v4 engine**. Designed to deliver a warm, festive, and luxurious shopping atmosphere, it focuses on:

- **Mobile-First Responsiveness:** Optimized for Bangladeshi mobile shoppers with touch-friendly navigation, sticky bottom sheets, and swift checkout.
- **Micro-Interactions & Transitions:** Fluid drawer animations, heart pop animations for wishlisting, and smooth image zoom galleries.
- **Bilingual Bengali & English Support:** Full support for Bengali typography, product titles, currency formatting (`৳`), and colloquial conversational AI queries.

---

## 🧩 Component Hierarchy & Key UI Modules

### 1. 🏠 Homepage (`src/pages/HomePage.jsx`)
- **Hero Banner Carousel:** Real-time carousel linked with backend `/api/promotions/banners/live/` with deep-linking CTAs.
- **Category Showcase:** Visual circular and card navigation for Men, Women, Boys, Girls, and Family Matching sets.
- **Featured & Sale Collections:** Grid displays with instant add-to-bag drawers and sale discount badges (`-20%`).
- **Customer Photo Reviews:** Verified community testimonial reel for social proof.

### 2. 👗 Product Catalog & Detail Page (`ProductsPage.jsx` & `ProductDetailPage.jsx`)
- **Filter Sidebar:** Dynamic multi-category checkbox filtering, real-time price slider, and sorting (`Newest`, `Price: Low to High`, `Price: High to Low`).
- **Interactive Variant Selector:** Color swatches and size pill buttons that instantly calculate SKU stock availability and pricing.
- **Delivery Zone Calculator:** Informs customers of shipping timelines (Inside Dhaka: 24-48 hrs, Outside Dhaka: 3-5 days).

### 3. 👜 Slide-over Shopping Bag & Cart (`src/components/cart/`)
- **Instant Cart Drawer:** Slides smoothly from the right without page navigation.
- **Dual Session Support:** Preserves cart items for guest users across page reloads using a UUID stored in `localStorage` (`X-Session-Key`).
- **Auto Cart Merging:** Upon user login, items in the guest cart are merged into the user's permanent database cart.

### 4. 💳 Multi-Step Checkout & Orders (`CheckoutPage.jsx` & `OrderSuccessPage.jsx`)
- **Cash on Delivery (COD) & Online Payment:** Pre-configured for seamless checkout with full address validation.
- **Digital Invoice & Memo:** Displays order confirmation with order tracking code `KF...` and printable invoice summary.

### 5. 📦 Live Order Tracking Interface (`OrderTrackPage.jsx`)
- **Visual 5-Step Stepper:**
  `1. Order Received` ➔ `2. Confirmed` ➔ `3. Processing` ➔ `4. Shipped` ➔ `5. Delivered`.
- **Search by Phone or Order ID:** Customers can track parcels using either their 11-digit mobile number or their order ID.

### 6. 📊 Admin Dashboard (`src/pages/admin/`)
- **Analytics Overview:** Today's revenue, total orders, and average order value.
- **Interactive 14-Day Sales Chart:** Visual representation of daily store performance.
- **Order Pipeline Manager:** Quick filter by status (`pending`, `confirmed`, `shipped`) with one-click status transitions.
- **Product & Banner Management:** Full catalog CRUD with image upload preview.

---

## 🤖 Floating AI Shopping Assistant Widget

Located at `src/components/ai/`, this is the interactive conversational frontend:

- **Floating Avatar Trigger:** Persistent bottom-right floating pill that opens an intuitive mobile-friendly chat window.
- **Embedded Interactive Product Cards:** When the AI recommends products, rich cards appear inside chat featuring the product image, category, price, and a direct **"কার্টে নিন" (Add to Cart)** button.
- **Order Tracking Card:** When customers ask about an order, an interactive live order status card renders inside the conversation.
- **Smart Preemption:** Browsing requests (`"বাচ্চা মেয়েদের সুতি ফ্রক দেখান"`) display apparel cards immediately without being blocked by prior tracking prompts.

---

## 🔄 State Architecture & Context API

The application uses clean, lightweight React Context providers located in `src/context/`:

```
src/context/
├── AuthContext.jsx         # User state, JWT storage, Login, Register, Google OAuth
├── CartContext.jsx         # Cart items, Quantity counter, Subtotal, Drawer toggle
└── WishlistContext.jsx     # Favorited product IDs set, Instant heart toggles
```

### Context Features:
- **`AuthContext`:** Manages JWT access tokens in memory and refresh tokens in `localStorage`. Automatically handles Google OAuth 2.0 redirect handshakes and profile updates.
- **`CartContext`:** Synchronizes with backend `/api/cart/` on every action. Injects the `X-Session-Key` header so unauthenticated guests can shop uninterrupted.
- **`WishlistContext`:** Caches favorited item IDs so heart icons throughout the application update instantly with zero UI lag.

---

## 🌐 API Client & Interceptor Architecture

Configured in `src/api/axios.js`, our centralized Axios instance handles all network communications:

```javascript
// src/api/axios.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// 1. Request Interceptor: Attach JWT Access Token & Guest Session Key
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Session-Key'] = getOrCreateSessionKey();
  return config;
});

// 2. Response Interceptor: Seamless Automatic Refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Automatically attempts token refresh via /api/auth/token/refresh/
    // Retries original request transparently
  }
);
```

---

## 📁 Folder Structure

```text
client/
├── public/                 # Favicon, static logos & public brand assets
├── src/
│   ├── api/
│   │   └── axios.js        # Central Axios client with JWT & guest session headers
│   ├── assets/             # Brand SVGs, placeholders & graphics
│   ├── components/
│   │   ├── admin/          # AdminSidebar, StatsCards, OrderTables
│   │   ├── ai/             # AIAssistantModal, AIChatBubble, AIProductCard
│   │   ├── cart/           # CartDrawer, CartItemRow, CartSummary
│   │   ├── checkout/       # AddressForm, ShippingMethodSelector
│   │   ├── common/         # Button, Input, Modal, Spinner, Toast, Badge
│   │   ├── home/           # HeroCarousel, CategoryGrid, Reviews, PhotoReel
│   │   ├── layout/         # Navbar, MegaMenu, MobileDrawer, Footer
│   │   ├── orders/         # OrderSummaryCard, InvoiceTemplate
│   │   ├── product/        # ProductCard, SwatchSelector, ImageGallery
│   │   └── track/          # TrackingStepper, TimelineItem
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── CartContext.jsx
│   │   └── WishlistContext.jsx
│   ├── pages/
│   │   ├── admin/          # Admin Dashboard, Products, Orders, Banners
│   │   ├── HomePage.jsx
│   │   ├── ProductsPage.jsx
│   │   ├── ProductDetailPage.jsx
│   │   ├── CartPage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── OrderSuccessPage.jsx
│   │   ├── OrderTrackPage.jsx
│   │   ├── OrderHistoryPage.jsx
│   │   ├── WishlistPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   └── DashboardPage.jsx
│   ├── App.jsx             # React Router 7 Route Definitions
│   ├── main.jsx            # React 19 Root Render & Context Wrappers
│   └── index.css           # Tailwind CSS v4 Theme Imports
├── package.json
├── vite.config.js          # Vite 8 Build Configuration
└── vercel.json             # SPA Route Rewrite Configuration
```

---

## ⚡ Getting Started & Development

### 1. Install Dependencies
```bash
cd client
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `client/` root:
```env
VITE_API_URL=http://127.0.0.1:8000/api
```

### 3. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173/`.

---

## 🚢 Production Build & Vercel Deployment

1. **Build for production:**
   ```bash
   npm run build
   ```
   The optimized production bundle is compiled into the `dist/` directory.

2. **Vercel SPA Route Handling (`vercel.json`):**
   To ensure client-side routing works for direct URLs (e.g. `/shop`, `/track-order/KF...`, `/dashboard`), `vercel.json` provides an automatic rewrite to `/index.html`:
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
