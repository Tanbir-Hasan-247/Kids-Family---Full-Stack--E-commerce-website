import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import HeroCarousel from '../components/home/HeroCarousel';
import HomeCategoryGrid from '../components/home/HomeCategoryGrid';
import HomeFeaturedSection from '../components/home/HomeFeaturedSection';
import HomeProductRowSection from '../components/home/HomeProductRowSection';
import HomePromoBanner from '../components/home/HomePromoBanner';
import HomePhotoReviews from '../components/home/HomePhotoReviews';
import HomePerksBar from '../components/home/HomePerksBar';
import HomeFAQ from '../components/home/HomeFAQ';

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
      <HomeCategoryGrid categories={categories} />

      {/* 3. FEATURED TRENDING STYLES */}
      <HomeFeaturedSection products={featuredProducts} loading={loading} />

      {/* 4. BOYS WEAR COLLECTION (👦 ছেলেদের পোশাক কালেকশন) */}
      <HomeProductRowSection
        emoji="👦"
        title="ছেলেদের পোশাক কালেকশন (Boys Wear)"
        subtitle="স্মার্ট পোলো টি-শার্ট, ক্যাজুয়াল শার্ট, পাঞ্জাবি ও প্যান্ট"
        linkUrl="/products?cat=boy"
        bannerClass="bg-gradient-to-r from-blue-50/80 to-transparent p-3 sm:p-4 rounded-2xl border-l-4 border-blue-600"
        buttonClass="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition shadow-xs flex items-center gap-1 shrink-0"
        products={boysProducts}
      />

      {/* 5. SALE PROMOTIONAL CALLOUT BANNER */}
      <HomePromoBanner />

      {/* 6. GIRLS WEAR COLLECTION (👧 মেয়েদের ফ্রক ও পার্টি ড্রেস) */}
      <HomeProductRowSection
        emoji="👧"
        title="মেয়েদের ফ্রক ও পার্টি ড্রেস (Girls Collection)"
        subtitle="আরামদায়ক সুতি ফ্রক, পার্টি কুর্তি ও স্কার্ট-টপ সেট"
        linkUrl="/products?cat=girl"
        bannerClass="bg-gradient-to-r from-rose-50/80 to-transparent p-3 sm:p-4 rounded-2xl border-l-4 border-rose-500"
        buttonClass="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full transition shadow-xs flex items-center gap-1 shrink-0"
        products={girlsProducts}
      />

      {/* 7. FAMILY MATCHING SETS (👨‍👩‍👧‍👦 ম্যাচিং ফ্যামিলি কম্বো) */}
      <HomeProductRowSection
        emoji="👨‍👩‍👧‍👦"
        title="ম্যাচিং ফ্যামিলি কম্বো (Family Matching Sets)"
        subtitle="বাবা-মা ও বাচ্চার আনন্দময় মুহূর্তের পারফেক্ট ম্যাচিং পোশাক"
        linkUrl="/products"
        bannerClass="bg-gradient-to-r from-amber-50/80 to-transparent p-3 sm:p-4 rounded-2xl border-l-4 border-amber-600"
        buttonClass="px-3.5 py-1.5 bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 text-xs font-bold rounded-full transition shadow-xs flex items-center gap-1 shrink-0"
        products={familyProducts}
      />

      {/* 8. 📸 REAL CUSTOMER PHOTO REVIEWS FEED */}
      <HomePhotoReviews />

      {/* 9. PERKS & VALUE PROPOSITIONS */}
      <HomePerksBar />

      {/* 10. ❓ FAQ ACCORDION SECTION */}
      <HomeFAQ />
    </div>
  );
};

export default HomePage;