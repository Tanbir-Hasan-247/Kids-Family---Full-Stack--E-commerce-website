import React from 'react';
import { Search, Sparkles } from 'lucide-react';

const NavbarSearchBar = ({ searchQuery, setSearchQuery, onSearchSubmit }) => {
  return (
    <form
      onSubmit={onSearchSubmit}
      className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-6 relative items-center"
    >
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="AI Search: যেমন '৫ বছরের বাচ্চার লাল পাঞ্জাবি'..."
        className="w-full bg-neutral-100/90 text-xs sm:text-sm pl-10 pr-24 py-2 sm:py-2.5 rounded-full border border-transparent focus:border-amber-500 focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400"
      />

      <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
      <button
        type="submit"
        className="absolute right-1.5 flex items-center gap-1 bg-linear-to-r from-[#1b3b2b] to-[#25543c] hover:from-[#25543c] hover:to-[#1b3b2b] text-amber-300 text-[10px] font-bold px-2.5 py-1.5 rounded-full shadow-2xs transition cursor-pointer"
        title="AI Search"
      >
        <Sparkles className="w-3 h-3 text-amber-300" />
        <span>AI Search</span>
      </button>
    </form>
  );
};

export default NavbarSearchBar;
