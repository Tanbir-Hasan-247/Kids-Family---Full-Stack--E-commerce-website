import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Sliders,
  Image,
  Tag,
  FolderTree,
  ArrowLeft,
  Bell,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Store,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const NAV_ITEMS = [
  { name: 'Overview', path: '/admin', icon: LayoutDashboard },
  { name: 'Products', path: '/admin/products', icon: Package },
  { name: 'Categories', path: '/admin/categories', icon: FolderTree },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { name: 'Attributes', path: '/admin/attributes', icon: Tag },
  { name: 'Hero Sliders', path: '/admin/sliders', icon: Sliders },
  { name: 'Promo Banners', path: '/admin/banners', icon: Image },
  { name: 'Shop Settings', path: '/admin/settings', icon: Store },
];

const AdminLayout = ({ children, title = 'Admin Panel' }) => {
  const { user, logout, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Quick admin login form state in case visitor is not logged in as admin
  const [emailInput, setEmailInput] = useState('admin@gmail.com');
  const [passwordInput, setPasswordInput] = useState('admin1234');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Fetch pending orders notification count
  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      if (user?.is_staff || user?.is_superuser) {
        try {
          const res = await api.get('/dashboard/notifications/count/');
          if (isMounted) {
            setPendingCount(res.data?.pending_orders_count || 0);
          }
        } catch (e) {
          console.warn('Could not fetch notification count:', e);
        }
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // refresh every 20s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const handleAdminQuickLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await login(emailInput, passwordInput);
    } catch (err) {
      setLoginError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // If user is not admin/staff, render an admin login gate
  if (!user || (!user.is_staff && !user.is_superuser)) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-neutral-100 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1b3b2b] text-amber-400 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Kids & Family Admin</h2>
            <p className="text-xs text-neutral-500">
              Sign in with staff/administrator credentials to access management console.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminQuickLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Admin Email
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#1b3b2b] focus:ring-1 focus:ring-[#1b3b2b] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#1b3b2b] focus:ring-1 focus:ring-[#1b3b2b] text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold text-sm shadow-md transition disabled:opacity-50"
            >
              {isLoggingIn ? 'Verifying...' : 'Sign In as Admin'}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-neutral-100">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-50 w-64 bg-[#142e22] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-amber-400 text-[#142e22] font-black text-lg flex items-center justify-center">
                K
              </span>
              <div>
                <span className="font-black text-base tracking-tight text-white block leading-none">
                  KIDS & FAMILY
                </span>
                <span className="text-[10px] text-amber-400/90 font-bold uppercase tracking-widest">
                  Admin Panel
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-amber-400 text-neutral-950 shadow-md font-bold'
                      : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.path === '/admin/orders' && pendingCount > 0 && (
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-neutral-950 text-amber-400'
                          : 'bg-amber-500 text-neutral-950'
                      }`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer of Sidebar */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <Link
              to="/"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition"
            >
              <div className="flex items-center gap-2">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Storefront</span>
              </div>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </Link>

            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black text-neutral-900 tracking-tight">{title}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Pending Orders Pill */}
            {pendingCount > 0 && (
              <Link
                to="/admin/orders?status=pending"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full hover:bg-amber-100 transition"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                <span>{pendingCount} Pending Order{pendingCount > 1 ? 's' : ''}</span>
              </Link>
            )}

            {/* Admin User Badge */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-neutral-200">
              <div className="w-8 h-8 rounded-full bg-[#1b3b2b] text-amber-300 font-bold text-xs flex items-center justify-center uppercase">
                {user?.first_name ? user.first_name[0] : 'A'}
              </div>
              <div className="hidden md:block text-left">
                <span className="text-xs font-bold text-neutral-900 block leading-tight">
                  {user?.first_name || 'Admin'}
                </span>
                <span className="text-[10px] text-neutral-500 block leading-tight">
                  {user?.email}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Child Pages Body */}
        <main className="p-3.5 sm:p-6 lg:p-8 flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;

