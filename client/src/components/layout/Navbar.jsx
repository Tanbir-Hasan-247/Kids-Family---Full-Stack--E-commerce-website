import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Search, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import api from '../../api/axios';
import NavbarTopBanner from './navbar/NavbarTopBanner';
import NavbarBrand from './navbar/NavbarBrand';
import NavbarSearchBar from './navbar/NavbarSearchBar';
import NavbarUserDropdown from './navbar/NavbarUserDropdown';
import NavbarDesktopLinks from './navbar/NavbarDesktopLinks';
import NavbarMobileDrawer from './navbar/NavbarMobileDrawer';

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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      {/* Top Banner */}
      <NavbarTopBanner />

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18 gap-2 sm:gap-4">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 text-neutral-700 hover:text-neutral-900 focus:outline-none cursor-pointer"
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
          <NavbarBrand />

          {/* Desktop & Tablet Search Bar */}
          <NavbarSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
          />

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
              className="relative p-2.5 text-neutral-700 hover:text-amber-700 hover:bg-neutral-100 rounded-full transition-colors focus:outline-none cursor-pointer"
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
            <NavbarUserDropdown
              user={user}
              logout={logout}
              userDropdownOpen={userDropdownOpen}
              setUserDropdownOpen={setUserDropdownOpen}
            />
          </div>
        </div>

        {/* Categories Bar (Desktop) */}
        <NavbarDesktopLinks categories={categories} />
      </div>

      {/* Mobile Quick Search Bar */}
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
      <NavbarMobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        openDrawer={openDrawer}
        totalItems={totalItems}
        user={user}
        categories={categories}
      />
    </header>
  );
};

export default Navbar;
