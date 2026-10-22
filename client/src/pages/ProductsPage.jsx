import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/products/ProductCard';
import ProductFilterSidebar from '../components/products/ProductFilterSidebar';
import ProductMobileFilterDrawer from '../components/products/ProductMobileFilterDrawer';
import ProductHeaderBar from '../components/products/ProductHeaderBar';
import ProductCategoryStrip from '../components/products/ProductCategoryStrip';
import ProductActiveFiltersBar from '../components/products/ProductActiveFiltersBar';
import ProductAiSearchBanner from '../components/products/ProductAiSearchBanner';
import ProductPagination from '../components/products/ProductPagination';
import ProductEmptyState from '../components/products/ProductEmptyState';

const ProductsPage = ({ saleOnly = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [aiSearchSummary, setAiSearchSummary] = useState('');
  const [isAiMatched, setIsAiMatched] = useState(false);

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

        let productList = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.results)
            ? responseData.results
            : [];

        let summaryText = '';
        let matchedByAi = false;

        // If regular search query returned 0 items, use AI Natural Language Search
        if (searchQuery && productList.length === 0) {
          try {
            const aiRes = await api.get(
              `/ai/search/?q=${encodeURIComponent(searchQuery)}`
            );
            if (aiRes.data?.products && aiRes.data.products.length > 0) {
              productList = aiRes.data.products;
              summaryText = aiRes.data.summary || '';
              matchedByAi = true;
            }
          } catch (aiErr) {
            console.debug('AI semantic search fallback error:', aiErr);
          }
        } else if (searchQuery) {
          summaryText = `"${searchQuery}" সম্পর্কিত পাওয়া পণ্যসমূহ:`;
        }

        if (isMounted) {
          setProducts(productList);
          setAiSearchSummary(summaryText);
          setIsAiMatched(matchedByAi);
          setTotalCount(
            typeof responseData?.count === 'number' && !matchedByAi
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
  }, [
    selectedCat,
    searchQuery,
    currentSort,
    minPrice,
    maxPrice,
    inStockOnly,
    onSaleOnly,
    saleOnly,
    currentPage,
  ]);

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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* Page Header */}
      <ProductHeaderBar
        saleOnly={saleOnly}
        currentCategoryName={currentCategoryName}
        totalCount={totalCount}
        searchQuery={searchQuery}
        selectedCat={selectedCat}
        onOpenMobileFilter={() => setMobileFilterOpen(true)}
        activeFilterCount={activeFilterCount}
        currentSort={currentSort}
        onSortChange={(val) => updateParam('sort', val)}
      />

      {/* Horizontal Category Strip */}
      <ProductCategoryStrip
        categories={categories}
        selectedCat={selectedCat}
        updateParam={updateParam}
      />

      {/* Active Filter Chips Bar */}
      <ProductActiveFiltersBar
        activeFilterCount={activeFilterCount}
        selectedCat={selectedCat}
        currentCategoryName={currentCategoryName}
        minPrice={minPrice}
        maxPrice={maxPrice}
        inStockOnly={inStockOnly}
        onSaleOnly={onSaleOnly}
        saleOnly={saleOnly}
        searchQuery={searchQuery}
        updateParam={updateParam}
        clearAllFilters={clearAllFilters}
      />

      {/* Main Content Layout: Sidebar + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
        {/* Desktop Sidebar (Sticky on scroll) */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24 space-y-6">
          <ProductFilterSidebar
            categories={categories}
            selectedCat={selectedCat}
            updateParam={updateParam}
            minPrice={minPrice}
            maxPrice={maxPrice}
            handlePricePreset={handlePricePreset}
            inputMinPrice={inputMinPrice}
            setInputMinPrice={setInputMinPrice}
            inputMaxPrice={inputMaxPrice}
            setInputMaxPrice={setInputMaxPrice}
            handleApplyCustomPrice={handleApplyCustomPrice}
            inStockOnly={inStockOnly}
            onSaleOnly={onSaleOnly}
            saleOnly={saleOnly}
            activeFilterCount={activeFilterCount}
            clearAllFilters={clearAllFilters}
          />
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {/* AI Search Intelligence Banner */}
          <ProductAiSearchBanner
            searchQuery={searchQuery}
            isAiMatched={isAiMatched}
            aiSearchSummary={aiSearchSummary}
            onResetSearch={() => updateParam('q', '')}
          />

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
            <ProductEmptyState
              onReset={clearAllFilters}
              hasFilters={Boolean(
                selectedCat ||
                searchQuery ||
                minPrice ||
                maxPrice ||
                inStockOnly ||
                onSaleOnly
              )}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination Controls */}
              <ProductPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                getPageNumbers={getPageNumbers}
                handlePageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile Slide-Over Filter Drawer */}
      <ProductMobileFilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        activeFilterCount={activeFilterCount}
        totalCount={totalCount}
        clearAllFilters={clearAllFilters}
      >
        <ProductFilterSidebar
          categories={categories}
          selectedCat={selectedCat}
          updateParam={updateParam}
          minPrice={minPrice}
          maxPrice={maxPrice}
          handlePricePreset={handlePricePreset}
          inputMinPrice={inputMinPrice}
          setInputMinPrice={setInputMinPrice}
          inputMaxPrice={inputMaxPrice}
          setInputMaxPrice={setInputMaxPrice}
          handleApplyCustomPrice={handleApplyCustomPrice}
          inStockOnly={inStockOnly}
          onSaleOnly={onSaleOnly}
          saleOnly={saleOnly}
          activeFilterCount={activeFilterCount}
          clearAllFilters={clearAllFilters}
          onCloseMobile={() => setMobileFilterOpen(false)}
        />
      </ProductMobileFilterDrawer>
    </div>
  );
};

export default ProductsPage;