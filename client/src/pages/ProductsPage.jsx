import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Filter,
  ArrowUpDown,
  X,
  Check,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  PackageCheck,
  Tag,
  Search,
} from 'lucide-react';
import api from '../api/axios';
import ProductCard from '../components/products/ProductCard';

const PRICE_PRESETS = [
  { label: 'সকল মূল্য', min: '', max: '' },
  { label: '৳০ - ৳১,০০০', min: '0', max: '1000' },
  { label: '৳১,০০০ - ৳২,০০০', min: '1000', max: '2000' },
  { label: '৳২,০০০ - ৳৩,০০০', min: '2000', max: '3000' },
  { label: '৳৩,০০০ এর উপরে', min: '3000', max: '' },
];

const ProductsPage = ({ saleOnly = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Mobile Filter Drawer State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Current Filter Parameters
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const selectedCat = searchParams.get('cat') || '';
  const searchQuery = searchParams.get('q') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const inStockOnly = searchParams.get('in_stock') === 'true';
  const onSaleOnly = saleOnly || searchParams.get('on_sale') === 'true';

  // Local price input state for user typing before applying
  const [inputMinPrice, setInputMinPrice] = useState(minPrice);
  const [inputMaxPrice, setInputMaxPrice] = useState(maxPrice);

  // Sync inputs with URL params
  useEffect(() => {
    setInputMinPrice(minPrice);
    setInputMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  // Fetch Categories
  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const res = await api.get('/categories/?all=true');
        const responseData = res.data;
        const categoryList = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.results)
            ? responseData.results
            : [];
        if (isMounted) setCategories(categoryList);
      } catch (err) {
        console.error('Failed to load categories:', err);
        if (isMounted) setCategories([]);
      }
    };
    fetchCats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Products based on all filters
  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const endpoint = saleOnly ? '/products/sale/' : '/products/';
        const params = new URLSearchParams();

        if (currentPage > 1) params.append('page', currentPage);
        if (selectedCat) params.append('cat', selectedCat);
        if (searchQuery) params.append('q', searchQuery);
        if (currentSort) params.append('sort', currentSort);
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);
        if (inStockOnly) params.append('in_stock', 'true');
        if (onSaleOnly && !saleOnly) params.append('on_sale', 'true');

        const url = `${endpoint}?${params.toString()}`;
        const res = await api.get(url);
        const responseData = res.data;

        const productList = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.results)
            ? responseData.results
            : [];

        if (isMounted) {
          setProducts(productList);
          setTotalCount(
            typeof responseData?.count === 'number'
              ? responseData.count
              : productList.length
          );
        }
      } catch (err) {
        console.error('Failed to load products:', err);
        if (isMounted) {
          setProducts([]);
          setTotalCount(0);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [selectedCat, searchQuery, currentSort, minPrice, maxPrice, inStockOnly, onSaleOnly, saleOnly, currentPage]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value !== '' && value !== null && value !== undefined) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key !== 'page') {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  };

  const handleApplyCustomPrice = (e) => {
    e?.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (inputMinPrice) {
      newParams.set('min_price', inputMinPrice);
    } else {
      newParams.delete('min_price');
    }
    if (inputMaxPrice) {
      newParams.set('max_price', inputMaxPrice);
    } else {
      newParams.delete('max_price');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handlePricePreset = (preset) => {
    const newParams = new URLSearchParams(searchParams);
    if (preset.min) {
      newParams.set('min_price', preset.min);
    } else {
      newParams.delete('min_price');
    }
    if (preset.max) {
      newParams.set('max_price', preset.max);
    } else {
      newParams.delete('max_price');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    if (saleOnly) {
      setSearchParams(newParams);
    } else {
      setSearchParams({});
    }
    setInputMinPrice('');
    setInputMaxPrice('');
  };

  // Pagination calculation
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    const newParams = new URLSearchParams(searchParams);
    if (newPage === 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', newPage);
    }
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Count active filter criteria
  let activeFilterCount = 0;
  if (selectedCat) activeFilterCount++;
  if (minPrice || maxPrice) activeFilterCount++;
  if (inStockOnly) activeFilterCount++;
  if (onSaleOnly && !saleOnly) activeFilterCount++;
  if (searchQuery) activeFilterCount++;

  const currentCategoryName = categories.find((c) => c.slug === selectedCat)?.name;

  // Reusable Filter Sidebar Content (used in both desktop sidebar & mobile drawer)
  const renderFilterContent = () => (
    <div className="space-y-6">
      {/* 1. Category Filter Module */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>ক্যাটাগরি (Categories)</span>
          </span>
          {selectedCat && (
            <button
              type="button"
              onClick={() => updateParam('cat', '')}
              className="text-[11px] text-rose-600 hover:underline font-semibold"
            >
              রিসেট
            </button>
          )}
        </div>

        <div className="space-y-1 text-xs max-h-64 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => {
              updateParam('cat', '');
              setMobileFilterOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-xl font-medium transition flex items-center justify-between ${
              !selectedCat
                ? 'bg-[#1b3b2b] text-white font-bold'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <span>সব পণ্য (All Products)</span>
          </button>

          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => {
                updateParam('cat', cat.slug);
                setMobileFilterOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl font-medium transition flex items-center justify-between ${
                selectedCat === cat.slug
                  ? 'bg-[#1b3b2b] text-white font-bold'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <span className="truncate">{cat.name}</span>
              {cat.product_count > 0 && (
                <span className={`text-[10px] ml-2 shrink-0 ${selectedCat === cat.slug ? 'text-amber-200' : 'text-neutral-400'}`}>
                  ({cat.product_count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Price Range Filter Module (GhorerBazar style) */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
            <span>মূল্য পরিসীমা (Price Range)</span>
          </span>
          {(minPrice || maxPrice) && (
            <button
              type="button"
              onClick={() => {
                updateParam('min_price', '');
                updateParam('max_price', '');
              }}
              className="text-[11px] text-rose-600 hover:underline font-semibold"
            >
              রিসেট
            </button>
          )}
        </div>

        {/* Quick Price Preset Chips */}
        <div className="flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map((preset, idx) => {
            const isPresetActive = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handlePricePreset(preset)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                  isPresetActive
                    ? 'border-[#1b3b2b] bg-[#1b3b2b] text-white font-bold shadow-2xs'
                    : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 bg-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Min - Max Input Range Form */}
        <form onSubmit={handleApplyCustomPrice} className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-2 text-xs text-neutral-400 font-bold">৳</span>
              <input
                type="number"
                placeholder="সর্বনিম্ন"
                value={inputMinPrice}
                onChange={(e) => setInputMinPrice(e.target.value)}
                className="w-full text-xs pl-6 pr-2 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:border-amber-600"
              />
            </div>
            <span className="text-xs text-neutral-400">-</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-2 text-xs text-neutral-400 font-bold">৳</span>
              <input
                type="number"
                placeholder="সর্বোচ্চ"
                value={inputMaxPrice}
                onChange={(e) => setInputMaxPrice(e.target.value)}
                className="w-full text-xs pl-6 pr-2 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl text-xs font-bold transition shadow-2xs"
          >
            ফিল্টার করুন (Apply Price)
          </button>
        </form>
      </div>

      {/* 3. Availability & Special Offers (GhorerBazar style) */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block pb-2.5 border-b border-neutral-100">
          প্রাপ্যতা ও অফার (Availability)
        </span>

        <div className="space-y-2 pt-1">
          {/* In Stock Only Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 hover:text-neutral-900 select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => updateParam('in_stock', e.target.checked ? 'true' : '')}
              className="w-4 h-4 rounded-md accent-[#1b3b2b]"
            />
            <div className="flex items-center gap-1.5 font-medium">
              <PackageCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>শুধুমাত্র স্টকে থাকা পণ্য (In Stock Only)</span>
            </div>
          </label>

          {/* On Sale / Discount Checkbox */}
          {!saleOnly && (
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 hover:text-neutral-900 select-none">
              <input
                type="checkbox"
                checked={onSaleOnly}
                onChange={(e) => updateParam('on_sale', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded-md accent-rose-600"
              />
              <div className="flex items-center gap-1.5 font-medium text-rose-700">
                <Tag className="w-3.5 h-3.5 text-rose-600" />
                <span>ডিসকাউন্ট ও অফার (On Sale)</span>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Reset All Filters Button */}
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={() => {
            clearAllFilters();
            setMobileFilterOpen(false);
          }}
          className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-rose-200 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>সকল ফিল্টার রিসেট করুন ({activeFilterCount})</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* Page Header (GhorerBazar style) */}
      <div className="border-b border-neutral-200 pb-4 sm:pb-6 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
            {saleOnly
              ? 'স্পেশাল অফার ও ডিসকাউন্ট (Offers & Sale)'
              : currentCategoryName || 'আমাদের সকল পণ্য (All Products)'}
          </h1>

          <p className="text-[11px] sm:text-xs text-neutral-500 mt-1">
            মোট {totalCount} টি পণ্য পাওয়া গেছে
            {searchQuery && ` ("${searchQuery}" এর জন্য)`}
            {selectedCat && currentCategoryName && ` (${currentCategoryName} ক্যাটাগরিতে)`}
          </p>
        </div>

        {/* Action Controls: Mobile Filter Button & Sort Dropdown */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
          {/* Mobile Filter Drawer Trigger Button */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-800 shadow-2xs active:scale-95 transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
            <span>ফিল্টার</span>
            {activeFilterCount > 0 && (
              <span className="bg-[#1b3b2b] text-white text-[10px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] sm:text-xs font-semibold text-neutral-500 hidden xs:flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>সর্ট:</span>
            </label>

            <select
              value={currentSort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="text-xs font-semibold bg-white border border-neutral-300 rounded-xl px-2.5 py-2 text-neutral-800 focus:outline-none focus:border-amber-500 shadow-2xs"
            >
              <option value="newest">সম্প্রতি যোগ করা (Newest)</option>
              <option value="price_asc">মূল্য: কম থেকে বেশি (Low to High)</option>
              <option value="price_desc">মূল্য: বেশি থেকে কম (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Horizontal Category Strip (1-tap quick navigation for Mobile/Tablet) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 pt-0.5 -mx-3 px-3 sm:mx-0 sm:px-0 mb-4">
        <button
          type="button"
          onClick={() => updateParam('cat', '')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs transition whitespace-nowrap ${
            !selectedCat
              ? 'bg-[#1b3b2b] text-white shadow-xs font-bold'
              : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          সব পণ্য (All)
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => updateParam('cat', cat.slug)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs transition whitespace-nowrap ${
              selectedCat === cat.slug
                ? 'bg-[#1b3b2b] text-white shadow-xs font-bold'
                : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Active Filter Chips Bar (GhorerBazar style) */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-5 p-2.5 bg-neutral-100/70 rounded-xl border border-neutral-200/60 text-xs">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">
            ফিল্টারসমূহ:
          </span>

          {selectedCat && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-neutral-800 text-[11px] font-semibold shadow-2xs">
              <span>ক্যাটাগরি: {currentCategoryName || selectedCat}</span>
              <button onClick={() => updateParam('cat', '')} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(minPrice || maxPrice) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-neutral-800 text-[11px] font-semibold shadow-2xs">
              <span>
                মূল্য: {minPrice ? `৳${minPrice}` : '৳০'} - {maxPrice ? `৳${maxPrice}` : 'সর্বোচ্চ'}
              </span>
              <button
                onClick={() => {
                  updateParam('min_price', '');
                  updateParam('max_price', '');
                }}
                className="hover:text-rose-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {inStockOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold shadow-2xs">
              <span>ইন-স্টক শুধুমাত্র</span>
              <button onClick={() => updateParam('in_stock', '')} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {onSaleOnly && !saleOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold shadow-2xs">
              <span>অফার শুধুমাত্র</span>
              <button onClick={() => updateParam('on_sale', '')} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-neutral-800 text-[11px] font-semibold shadow-2xs">
              <span>অনুসন্ধান: "{searchQuery}"</span>
              <button onClick={() => updateParam('q', '')} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline ml-auto"
          >
            সব ক্লিয়ার করুন
          </button>
        </div>
      )}

      {/* Main Content Layout: Sidebar + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
        {/* Desktop Sidebar (Sticky on scroll) */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24 space-y-6">
          {renderFilterContent()}
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-3/4 bg-neutral-200 animate-pulse rounded-2xl"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 sm:py-24 text-center bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-neutral-900">
                কোনো পণ্য খুঁজে পাওয়া যায়নি
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                আপনার নির্বাচিত ফিল্টারের সাথে মিলে এমন কোনো পণ্য নেই। অনুগ্রহ করে ফিল্টার পরিবর্তন করুন।
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-6 py-2.5 bg-[#1b3b2b] text-white rounded-full text-xs font-bold hover:bg-[#153224] transition shadow-md"
              >
                সকল ফিল্টার রিসেট করুন
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 sm:mt-12 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Status text */}
                  <p className="text-xs text-neutral-500 font-medium order-2 sm:order-1">
                    মোট <span className="font-bold text-neutral-900">{totalCount}</span> টি পণ্যের মধ্যে{' '}
                    <span className="font-bold text-neutral-900">
                      {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)}
                    </span>{' '}
                    টি প্রদর্শিত হচ্ছে
                  </p>

                  {/* Page Navigation Buttons */}
                  <div className="flex items-center gap-1.5 sm:gap-2 order-1 sm:order-2">
                    {/* Previous Button */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="p-2 sm:px-3 sm:py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      title="পূর্ববর্তী পেজ"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">পূর্ববর্তী</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((p, idx) =>
                        p === '...' ? (
                          <span key={`dots-${idx}`} className="px-2 text-xs text-neutral-400 select-none">
                            ...
                          </span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handlePageChange(p)}
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-black transition flex items-center justify-center ${
                              currentPage === p
                                ? 'bg-[#1b3b2b] text-white shadow-md scale-105 ring-2 ring-[#1b3b2b]/20'
                                : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-amber-50 hover:border-amber-300'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                    </div>

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="p-2 sm:px-3 sm:py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      title="পরবর্তী পেজ"
                    >
                      <span className="hidden sm:inline">পরবর্তী</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile & Tablet Slide-Over Filter Drawer (GhorerBazar style) */}
      {mobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileFilterOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
            <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-700" />
                  <h3 className="text-sm font-black text-neutral-900">পণ্য ফিল্টার (Filters)</h3>
                  {activeFilterCount > 0 && (
                    <span className="bg-[#1b3b2b] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-4 bg-neutral-50/40">
                {renderFilterContent()}
              </div>

              {/* Drawer Sticky Footer */}
              <div className="p-4 border-t border-neutral-200 bg-white flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    clearAllFilters();
                    setMobileFilterOpen(false);
                  }}
                  className="w-1/3 py-3 rounded-xl border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-50"
                >
                  রিসেট
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 py-3 bg-[#1b3b2b] hover:bg-[#142e22] text-white rounded-xl font-black text-xs shadow-md"
                >
                  ফিল্টার প্রয়োগ করুন ({totalCount})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;