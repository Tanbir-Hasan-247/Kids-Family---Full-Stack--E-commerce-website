import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const getCategoryAvatar = (slug = '', name = '') => {
  const s = String(slug || '').toLowerCase();
  const n = String(name || '').toLowerCase();

  // Woman check first because "man" is a substring of "woman"
  if (
    s.includes('woman') ||
    s.includes('women') ||
    n.includes('woman') ||
    n.includes('women') ||
    n.includes('মহিলা') ||
    n.includes('নারী')
  ) {
    return '/avatars/woman.png';
  }
  if (
    s.includes('man') ||
    s.includes('men') ||
    n.includes('man') ||
    n.includes('men') ||
    n.includes('পুরুষ')
  ) {
    return '/avatars/man.png';
  }
  if (
    s.includes('girl') ||
    n.includes('girl') ||
    n.includes('মেয়ে') ||
    n.includes('মেয়ে') ||
    n.includes('কন্যা')
  ) {
    return '/avatars/girl.png';
  }
  if (
    s.includes('boy') ||
    n.includes('boy') ||
    n.includes('ছেলে') ||
    n.includes('পুত্র')
  ) {
    return '/avatars/boy.png';
  }
  return null;
};

const HomeCategoryGrid = ({ categories }) => {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-neutral-900 tracking-tight">
            ক্যাটাগরি অনুযায়ী কেনাকাটা
          </h2>
          <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">
            আপনার পছন্দের কালেকশন নির্বাচন করুন
          </p>
        </div>

        <Link
          to="/products"
          className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 shrink-0"
        >
          <span>সব দেখুন</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex md:grid overflow-x-auto md:overflow-x-visible no-scrollbar snap-x gap-3 sm:gap-4 pb-2 md:pb-0 md:grid-cols-4 lg:grid-cols-6">
        {categories.slice(0, 8).map((cat) => {
          const avatar = getCategoryAvatar(cat.slug, cat.name);
          return (
            <Link
              key={cat.id}
              to={`/products?cat=${cat.slug}`}
              className="shrink-0 w-28 sm:w-36 md:w-auto snap-start group p-3 sm:p-4 bg-white rounded-2xl border border-neutral-200/80 hover:border-amber-400 hover:shadow-md transition-all flex flex-col items-center text-center space-y-2 sm:space-y-2.5"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-50/70 group-hover:bg-amber-100/80 p-0.5 flex items-center justify-center font-bold text-sm sm:text-base transition-all duration-300 shadow-2xs group-hover:shadow-md group-hover:scale-105 border border-neutral-200/60 group-hover:border-amber-400 overflow-hidden">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-full"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-[#1b3b2b] font-bold">
                    {cat.name?.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-amber-800 transition line-clamp-1">
                  {cat.name}
                </h4>

                <span className="text-[9px] sm:text-[10px] text-neutral-400 block mt-0.5 font-medium">
                  {cat.children?.length
                    ? `${cat.children.length} টি সাব-আইটেম`
                    : 'কালেকশন'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default HomeCategoryGrid;
