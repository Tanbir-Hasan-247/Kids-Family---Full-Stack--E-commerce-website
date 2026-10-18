import React from 'react';
import { Link } from 'react-router-dom';

const HomePromoBanner = () => {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
        <div className="space-y-2 sm:space-y-3 z-10 max-w-xl text-center md:text-left">
          <span className="bg-rose-500/30 text-rose-200 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full border border-rose-400/30 inline-block">
            LIMITED PERIOD SALE 🔥
          </span>

          <h3 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight">
            বাচ্চাদের পোশাকে সর্বোচ্চ ৪০% পর্যন্ত ডিসকাউন্ট!
          </h3>

          <p className="text-xs sm:text-sm text-rose-100/80">
            ঈদ ও ফেস্টিভ স্পেশাল পোলো শার্ট, ফ্লোরাল ফ্রক এবং ফ্যামিলি ম্যাচিং সেট। সীমিত সময়ের জন্য প্রযোজ্য!
          </p>
        </div>

        <Link
          to="/sale"
          className="z-10 shrink-0 px-6 sm:px-8 py-3 sm:py-4 bg-white hover:bg-neutral-100 active:scale-95 text-rose-900 font-black text-xs sm:text-sm rounded-full shadow-lg transition"
        >
          অফার ড্রেসগুলো দেখুন
        </Link>
      </div>
    </section>
  );
};

export default HomePromoBanner;
