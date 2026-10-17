import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ShopSettingsProvider, useShopSettings } from './context/ShopSettingsContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';

import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderTrackPage from './pages/OrderTrackPage';
import WishlistPage from './pages/WishlistPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminAttributesPage from './pages/admin/AdminAttributesPage';
import AdminSlidersPage from './pages/admin/AdminSlidersPage';
import AdminBannersPage from './pages/admin/AdminBannersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import BottomNav from './components/layout/BottomNav';
import WhatsAppWidget from './components/common/WhatsAppWidget';
import AIAssistantWidget from './components/ai/AIAssistantWidget';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Only scroll to top if not explicitly navigating to an anchor hash
    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname]);

  return null;
}

function StorefrontLayout({ children }) {
  const { settings } = useShopSettings();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 pb-16 lg:pb-0">
      <Navbar />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppWidget phoneNumber={settings?.whatsapp_number || settings?.phone || '+8801700000000'} />
      <AIAssistantWidget />
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ShopSettingsProvider>
          <CartProvider>
            <WishlistProvider>
              <Routes>
                {/* Storefront Routes */}
                <Route path="/" element={<StorefrontLayout><HomePage /></StorefrontLayout>} />
                <Route path="/products" element={<StorefrontLayout><ProductsPage /></StorefrontLayout>} />
                <Route path="/sale" element={<StorefrontLayout><ProductsPage saleOnly={true} /></StorefrontLayout>} />
                <Route path="/products/:id" element={<StorefrontLayout><ProductDetailPage /></StorefrontLayout>} />
                <Route path="/cart" element={<StorefrontLayout><CartPage /></StorefrontLayout>} />
                <Route path="/checkout" element={<StorefrontLayout><CheckoutPage /></StorefrontLayout>} />
                <Route path="/order-success/:orderNumber" element={<StorefrontLayout><OrderSuccessPage /></StorefrontLayout>} />
                <Route path="/orders" element={<StorefrontLayout><OrderHistoryPage /></StorefrontLayout>} />
                <Route path="/track-order" element={<StorefrontLayout><OrderTrackPage /></StorefrontLayout>} />
                <Route path="/track-order/:orderNumber" element={<StorefrontLayout><OrderTrackPage /></StorefrontLayout>} />
                <Route path="/wishlist" element={<StorefrontLayout><WishlistPage /></StorefrontLayout>} />
                <Route path="/login" element={<StorefrontLayout><LoginPage /></StorefrontLayout>} />
                <Route path="/register" element={<StorefrontLayout><RegisterPage /></StorefrontLayout>} />
                <Route path="/dashboard" element={<StorefrontLayout><DashboardPage /></StorefrontLayout>} />

                {/* Admin Panel Routes */}
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/products" element={<AdminProductsPage />} />
                <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/attributes" element={<AdminAttributesPage />} />
                <Route path="/admin/sliders" element={<AdminSlidersPage />} />
                <Route path="/admin/banners" element={<AdminBannersPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </ShopSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
