# KIDS & FAMILY Fullstack Monorepo (v1)

This project contains both the **Backend API** and the modern **React Frontend Client** for the **KIDS & FAMILY** E-Commerce platform.

```
kids&familyV1/
├── backend/                  # Django REST Framework + JWT + SQLite Backend
│   ├── .kidenv/              # Python Virtual Environment
│   ├── .env                  # Environment Variables
│   ├── manage.py             # Django CLI
│   ├── db.sqlite3            # Database
│   ├── media/                # Product Images & Assets
│   └── apps/                 # Accounts, Products, Categories, Cart, Orders, etc.
└── client/                   # React 19 + Vite + Tailwind CSS Frontend
    ├── src/
    │   ├── api/axios.js      # Configured API Client (JWT & Guest Session)
    │   ├── context/          # AuthContext, CartContext, WishlistContext
    │   ├── components/       # Navbar, Footer, CartDrawer, ProductCard
    │   └── pages/            # Home, Products, Detail, Cart, Checkout, etc.
    └── package.json
```

---

## 🚀 How to Run the Project

### 1. Start the Backend API (Port 8000)

Open a terminal or PowerShell:
```powershell
cd "c:\Users\Tanbir Hasan\Desktop\kids&familyV1\backend"
.\.kidenv\Scripts\Activate.ps1
python manage.py runserver 8000
```
- API Base URL: `http://127.0.0.1:8000/api/`
- Interactive Swagger UI: `http://127.0.0.1:8000/api/docs/`

---

### 2. Start the Frontend Client (Port 5173)

Open a second terminal or PowerShell:
```powershell
cd "c:\Users\Tanbir Hasan\Desktop\kids&familyV1\client"
npm run dev
```
- Client Web App: `http://localhost:5173/`

---

## 🌟 Key Client Features
- **Browse & Filter**: Filter by category, price, search query, or special sale discounts.
- **Variant Selector**: Interactive color swatches & size buttons with real-time stock and price updates.
- **Shopping Bag & Drawer**: Slide-over cart drawer with instant quantity modification and guest-session persistence.
- **Wishlist**: Real-time heart toggles across all product cards and detail pages.
- **Checkout & Orders**: Complete shipping details form, COD & online payment options, instant order generation (`KF...`), and order tracking.
- **Customer Authentication**: Sign in, register, profile update, and customer dashboard overview.

