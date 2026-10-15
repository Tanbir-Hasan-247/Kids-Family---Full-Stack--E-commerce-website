import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  ShoppingBag,
  Heart,
  User,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Package,
  LayoutDashboard,
  ShieldCheck,
  Truck,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import api from '../../api/axios';

const Navbar = () => {
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { totalItems, openDrawer } = useCart();
  const { count: wishlistCount } = useWishlist();

  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories/');
        const data = res.data;

        const categoryList = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

        if (isMounted) {
          setCategories(categoryList);
        }
      } catch (e) {
        console.error('Failed to load nav categories:', e);

        if (isMounted) {
          setCategories([]);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const userEmail = user?.email || '';
  const firstName = user?.first_name || '';
  const displayName = firstName || userEmail.split('@')[0] || 'Account';
  const avatarLetter = (firstName || userEmail || 'U')[0].toUpperCase();

  const renderCategories = (isMobile = false) =>
    categories.map((cat) => (
      <Link
        key={cat.id}
        to={`/products?cat=${encodeURIComponent(cat.slug || '')}`}
        onClick={() => {
          if (isMobile) {
            setMobileMenuOpen(false);
          }
        }}
        className={
          isMobile
            ? 'py-1.5 text-neutral-700 hover:text-amber-700'
            : 'text-neutral-700 hover:text-amber-700 transition'
        }
      >
        {cat.name}
      </Link>
    ));

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      {/* Top Banner */}
      <div className="bg-[#1b3b2b] text-emerald-100 text-xs py-1.5 px-3 sm:px-6 font-medium tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden md:inline text-[11px] text-emerald-200">
            🚚 সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা
          </span>
          <span className="mx-auto md:mx-0 text-center">
            Family Matching Collection is Here! • Premium Quality Outfits
          </span>
          <Link
            to="/track-order"
            className="hidden sm:inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-bold transition text-[11px]"
          >
            <Truck className="w-3 h-3 text-amber-300" />
            <span>অর্ডার ট্র্যাকিং</span>
          </Link>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18 gap-2 sm:gap-4">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 text-neutral-700 hover:text-neutral-900 focus:outline-none"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </button>

          {/* Logo */}
          <Link to="/" className="flex flex-col items-start select-none">
            <span className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[#1b3b2b]">
              KIDS<span className="text-amber-600">&</span>FAMILY
            </span>

            <span className="text-[9px] sm:text-[10px] tracking-widest text-neutral-500 uppercase -mt-0.5 sm:-mt-1 font-semibold hidden xs:block">
              Quality • Comfort • Love
            </span>
          </Link>

          {/* Desktop & Tablet Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-6 relative items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search panjabi, dresses, shirts, polo..."
              className="w-full bg-neutral-100/90 text-xs sm:text-sm pl-10 pr-4 py-2 sm:py-2.5 rounded-full border border-transparent focus:border-amber-500 focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400"
            />

            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
          </form>

          {/* Actions: Wishlist, Cart, Account */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2.5 text-neutral-700 hover:text-amber-700 hover:bg-neutral-100 rounded-full transition-colors"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />

              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Drawer Trigger */}
            <button
              type="button"
              onClick={openDrawer}
              className="relative p-2.5 text-neutral-700 hover:text-amber-700 hover:bg-neutral-100 rounded-full transition-colors focus:outline-none"
              title="Shopping Bag"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5" />

              {totalItems > 0 && (
                <span className="absolute top-1 right-1 bg-[#1b3b2b] text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User Account Dropdown */}
            <div className="relative">
              {user ? (
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-full border border-neutral-200 text-neutral-800 hover:bg-neutral-50 text-sm font-medium transition"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold uppercase">
                    {avatarLetter}
                  </div>

                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {displayName}
                  </span>

                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1b3b2b] hover:bg-[#142e22] text-white text-xs sm:text-sm font-semibold shadow-sm transition"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Dropdown Menu */}
              {user && userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-neutral-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="text-xs text-neutral-400">Signed in as</p>
                    <p className="text-sm font-bold text-neutral-900 truncate">
                      {userEmail || displayName}
                    </p>
                  </div>

                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <LayoutDashboard className="w-4 h-4 text-neutral-500" />
                    My Dashboard
                  </Link>

                  <Link
                    to="/orders"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <Package className="w-4 h-4 text-neutral-500" />
                    My Orders
                  </Link>

                  <Link
                    to="/track-order"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1b3b2b] hover:bg-neutral-50 font-medium"
                  >
                    <Truck className="w-4 h-4 text-emerald-700" />
                    Track Order (ট্র্যাকিং)
                  </Link>

                  {(user?.is_staff || user?.is_superuser) && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1b3b2b] bg-amber-50/80 hover:bg-amber-100/80 font-bold transition border-y border-amber-200/50"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#1b3b2b]" />
                      Admin Panel
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 text-left border-t border-neutral-100 mt-1"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories Bar (Desktop) */}
        <nav className="hidden lg:flex items-center justify-center space-x-8 py-2.5 border-t border-neutral-100 text-sm font-medium">
          <Link
            to="/"
            className="text-neutral-700 hover:text-amber-700 transition"
          >
            Home
          </Link>

          <Link
            to="/products"
            className="text-neutral-700 hover:text-amber-700 transition"
          >
            All Products
          </Link>

          <Link
            to="/sale"
            className="text-rose-600 font-semibold hover:text-rose-700 transition flex items-center gap-1"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            Special Offers & Sale
          </Link>

          {renderCategories()}
        </nav>
      </div>

      {/* Mobile Quick Search Bar (Prominent GhorerBazar style) */}
      <div className="md:hidden px-3.5 pb-2.5 pt-1 bg-white border-t border-neutral-100">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="পণ্য খুঁজুন (e.g. panjabi, frock, shirt)..."
            className="w-full bg-neutral-100 text-xs pl-9 pr-4 py-2 rounded-full border border-neutral-200/80 focus:outline-none focus:border-amber-600 focus:bg-white transition-all placeholder:text-neutral-400"
          />
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-neutral-100 text-sm pl-9 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none"
            />

            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          </form>

          <div className="flex flex-col space-y-2 text-sm font-medium pt-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-neutral-800"
            >
              Home
            </Link>

            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-neutral-800"
            >
              All Products
            </Link>

            <Link
              to="/sale"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-rose-600 font-semibold"
            >
              Special Offers & Sale
            </Link>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openDrawer();
              }}
              className="py-1.5 text-neutral-800 text-left flex items-center justify-between font-semibold cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#1b3b2b]" />
                <span>My Shopping Bag (কার্ট)</span>
              </span>
              {totalItems > 0 && (
                <span className="bg-[#1b3b2b] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {totalItems}
                </span>
              )}
            </button>

            <Link
              to="/track-order"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-emerald-800 font-bold flex items-center gap-2"
            >
              <Truck className="w-4 h-4 text-emerald-700" />
              <span>অর্ডার ট্র্যাক করুন (Track Order)</span>
            </Link>

            <Link
              to="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-neutral-800 font-medium flex items-center gap-2"
            >
              <Package className="w-4 h-4 text-neutral-500" />
              <span>আমার অর্ডারসমূহ (Order History)</span>
            </Link>

            {(user?.is_staff || user?.is_superuser) && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 text-[#1b3b2b] font-bold flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-[#1b3b2b]" />
                Admin Panel
              </Link>
            )}

            {renderCategories(true)}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
