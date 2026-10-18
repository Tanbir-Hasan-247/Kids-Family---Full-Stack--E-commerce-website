import React from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  ChevronDown,
  LayoutDashboard,
  Package,
  Truck,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

const NavbarUserDropdown = ({
  user,
  logout,
  userDropdownOpen,
  setUserDropdownOpen,
}) => {
  const userEmail = user?.email || '';
  const firstName = user?.first_name || '';
  const displayName = firstName || userEmail.split('@')[0] || 'Account';
  const avatarLetter = (firstName || userEmail || 'U')[0].toUpperCase();

  return (
    <div className="relative">
      {user ? (
        <button
          type="button"
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-full border border-neutral-200 text-neutral-800 hover:bg-neutral-50 text-sm font-medium transition cursor-pointer"
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
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 text-left border-t border-neutral-100 mt-1 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default NavbarUserDropdown;
