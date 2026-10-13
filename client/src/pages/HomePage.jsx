import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  ChevronRight,
  Heart,
  Flame,
  Users,
} from 'lucide-react';

import api from '../api/axios';
import ProductCard from '../components/products/ProductCard';
import HeroCarousel from '../components/home/HeroCarousel';
import HomePhotoReviews from '../components/home/HomePhotoReviews';
import HomeFAQ from '../components/home/HomeFAQ';

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

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [boysProducts, setBoysProducts] = useState([]);
  const [girlsProducts, setGirlsProducts] = useState([]);
  const [familyProducts, setFamilyProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [catRes, prodRes, boysRes, girlsRes, familyRes] = await Promise.all([
          api.get('/categories/').catch(() => ({ data: [] })),
          api.get('/products/?featured=true').catch(() => ({ data: [] })),
          api.get('/products/?cat=boy').catch(() => ({ data: [] })),
          api.get('/products/?cat=girl').catch(() => ({ data: [] })),
          api.get('/products/?cat=matching-sets-boy&cat=man&cat=woman').catch(() => ({ data: [] })),
        ]);

        const normalize = (data) =>
          Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

        const catData = normalize(catRes.data);
        const featData = normalize(prodRes.data);
        const boyData = normalize(boysRes.data);
        const girlData = normalize(girlsRes.data);
        let famData = normalize(familyRes.data);

        // If family sets query is small, fallback to top products with matching/family keyword or latest
        if (famData.length === 0) {
          famData = featData.slice(0, 4);
        }

        setCategories(catData);
        setFeaturedProducts(featData.slice(0, 8));
        setBoysProducts(boyData.slice(0, 8));
        setGirlsProducts(girlData.slice(0, 8));
        setFamilyProducts(famData.slice(0, 8));
      } catch (err) {
        console.error('Error loading homepage:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div className="space-y-10 sm:space-y-14 md:space-y-20 pb-16">
      {/* 1. HERO CAROUSEL SECTION */}
      <HeroCarousel />

      {/* 2. CATEGORIES HORIZONTAL BAR (GhorerBazar style) */}
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

      {/* 3. FEATURED TRENDING STYLES */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h2 className="text-lg sm:text-2xl font-black text-neutral-900 tracking-tight">
                টপ ট্রেন্ডিং ও বেস্টসেলার কালেকশন
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">
              অভিভাবকদের সবচেয়ে পছন্দের ট্রেন্ডি পোশাকসমূহ
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

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-3/4 bg-neutral-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. BOYS WEAR COLLECTION (👦 ছেলেদের পোশাক কালেকশন) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6 bg-gradient-to-r from-blue-50/80 to-transparent p-3 sm:p-4 rounded-2xl border-l-4 border-blue-600">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">👦</span>
              <h2 className="text-lg sm:text-2xl font-black text-neutral-900 tracking-tight">
                ছেলেদের পোশাক কালেকশন (Boys Wear)
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">
              স্মার্ট পোলো টি-শার্ট, ক্যাজুয়াল শার্ট, পাঞ্জাবি ও প্যান্ট
            </p>
          </div>

          <Link
            to="/products?cat=boy"
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition shadow-xs flex items-center gap-1 shrink-0"
          >
            <span>সব দেখুন</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {boysProducts.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400 bg-white rounded-2xl border border-neutral-100">
            এই ক্যাটাগরিতে পণ্য লোড হচ্ছে...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {boysProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. SALE PROMOTIONAL CALLOUT BANNER */}
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

      {/* 6. GIRLS WEAR COLLECTION (👧 মেয়েদের ফ্রক ও পার্টি ড্রেস) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6 bg-gradient-to-r from-rose-50/80 to-transparent p-3 sm:p-4 rounded-2xl border-l-4 border-rose-500">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">👧</span>
              <h2 className="text-lg sm:text-2xl font-black text-neutral-900 tracking-tight">
                মেয়েদের ফ্রক ও পার্টি ড্রেস (Girls Collection)
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">
              আরামদায়ক সুতি ফ্রক, পার্টি কুর্তি ও স্কার্ট-টপ সেট
            </p>
          </div>

          <Link
            to="/products?cat=girl"
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full transition shadow-xs flex items-center gap-1 shrink-0"
          >
            <span>সব দেখুন</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {girlsProducts.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400 bg-white rounded-2xl border border-neutral-100">
            এই ক্যাটাগরিতে পণ্য লোড হচ্ছে...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {girlsProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 7. FAMILY MATCHING SETS (👨‍👩‍👧‍👦 ম্যাচিং ফ্যামিলি কম্বো) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6 bg-gradient-to-r from-amber-50/80 to-transparent p-3 sm:p-4 rounded-2xl border-l-4 border-amber-600">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">👨‍👩‍👧‍👦</span>
              <h2 className="text-lg sm:text-2xl font-black text-neutral-900 tracking-tight">
                ম্যাচিং ফ্যামিলি কম্বো (Family Matching Sets)
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">
              বাবা-মা ও বাচ্চার আনন্দময় মুহূর্তের পারফেক্ট ম্যাচিং পোশাক
            </p>
          </div>

          <Link
            to="/products"
            className="px-3.5 py-1.5 bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 text-xs font-bold rounded-full transition shadow-xs flex items-center gap-1 shrink-0"
          >
            <span>সব দেখুন</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {familyProducts.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400 bg-white rounded-2xl border border-neutral-100">
            এই ক্যাটাগরিতে পণ্য লোড হচ্ছে...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {familyProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 8. 📸 REAL CUSTOMER PHOTO REVIEWS FEED */}
      <HomePhotoReviews />

      {/* 9. PERKS & VALUE PROPOSITIONS */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          <div className="p-4 sm:p-6 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs hover:shadow-md transition flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-800 rounded-xl shrink-0">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                ক্যাশ অন ডেলিভারি
              </h4>
              <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">
                সারাদেশে পার্সেল খুলে চেক করে টাকা দিন
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs hover:shadow-md transition flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-800 rounded-xl shrink-0">
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                ৭ দিনের ফ্রি এক্সচেঞ্জ
              </h4>
              <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">
                সাইজ বা কালার সহজেই পরিবর্তন করুন
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs hover:shadow-md transition flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-blue-50 text-blue-800 rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                ১০০% কম্বড সুতি কাপড়
              </h4>
              <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">
                শিশুর কোমল ত্বকের জন্য সম্পূর্ণ নিরাপদ
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs hover:shadow-md transition flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-purple-50 text-purple-800 rounded-xl shrink-0">
              <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                ২৪/৭ কাস্টমার সাপোর্ট
              </h4>
              <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">
                যেকোনো প্রয়োজনে সরাসরি কল বা হোয়াটসঅ্যাপ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. ❓ FAQ ACCORDION SECTION */}
      <HomeFAQ />
    </div>
  );
};

export default HomePage;