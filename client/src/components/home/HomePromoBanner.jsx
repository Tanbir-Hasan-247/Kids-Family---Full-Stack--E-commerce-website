import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { formatImageUrl } from '../../api/axios';

const BG_GRADIENTS = {
  pine: 'bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950',
  pinedeep: 'bg-gradient-to-r from-[#1b3b2b] via-[#244f3a] to-[#12281d]',
  mustard: 'bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950',
  clay: 'bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900',
};

const HomePromoBanner = () => {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveBanner = async () => {
      try {
        const res = await api.get('/promotions/banners/');
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        if (isMounted && data.length > 0) {
          setBanner(data[0]);
        }
      } catch (err) {
        // Silently handle
      }
    };
    fetchLiveBanner();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-world e-commerce: Only render when there is an active promotional banner in the database
  if (!banner) return null;

  const bgClass = BG_GRADIENTS[banner.background_color] || BG_GRADIENTS.clay;
  const bannerImg = banner.image ? formatImageUrl(banner.image) : '';

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className={`${bgClass} rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8`}>
        <div className="space-y-2 sm:space-y-3 z-10 max-w-xl text-center md:text-left">
          {banner.badge_text && (
            <span className="bg-white/20 text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full border border-white/30 inline-block">
              {banner.badge_text}
            </span>
          )}

          <h3 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight">
            {banner.title}
          </h3>

          {banner.subtitle && (
            <p className="text-xs sm:text-sm text-white/80">
              {banner.subtitle}
            </p>
          )}
        </div>

        <div className="z-10 flex items-center gap-4 shrink-0">
          {bannerImg && (
            <img
              src={bannerImg}
              alt={banner.title}
              className="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded-2xl shadow-md border border-white/20 hidden sm:block"
            />
          )}
          <Link
            to={banner.link_url || '/products'}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-white hover:bg-neutral-100 active:scale-95 text-neutral-900 font-black text-xs sm:text-sm rounded-full shadow-lg transition"
          >
            {banner.cta_text || 'কালেকশন দেখুন'}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomePromoBanner;
