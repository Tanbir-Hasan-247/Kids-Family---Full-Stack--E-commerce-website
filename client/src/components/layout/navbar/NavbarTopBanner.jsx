import React from 'react';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';

const NavbarTopBanner = () => {
  return (
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
  );
};

export default NavbarTopBanner;
