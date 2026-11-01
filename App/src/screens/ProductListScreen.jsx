import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import { theme } from '../constants/theme';
import Header from '../components/common/Header';
import ProductCard from '../components/product/ProductCard';
import EmptyState from '../components/common/EmptyState';
import AppBottomNav from '../components/layout/AppBottomNav';

const PRICE_PRESETS = [
  { label: 'সকল মূল্য', min: '', max: '' },
  { label: '৳০ - ৳১,০০০', min: '0', max: '1000' },
  { label: '৳১,০০০ - ৳২,০০০', min: '1000', max: '2000' },
  { label: '৳২,০০০ - ৳৩,০০০', min: '2000', max: '3000' },
  { label: '৳৩,০০০ এর উপরে', min: '3000', max: '' },
];

const SORT_OPTIONS = [
  { label: 'সর্বশেষ পণ্য (Newest)', value: 'newest' },
  { label: 'মূল্য: কম থেকে বেশি (Price: Low to High)', value: 'price_asc' },
  { label: 'মূল্য: বেশি থেকে কম (Price: High to Low)', value: 'price_desc' },
  { label: 'জনপ্রিয় (Popular)', value: 'popular' },
];

export default function ProductListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const [selectedCat, setSelectedCat] = useState(params.category || '');
  const [selectedSort, setSelectedSort] = useState(params.sort || 'newest');
  const [minPrice, setMinPrice] = useState(params.min_price || '');
  const [maxPrice, setMaxPrice] = useState(params.max_price || '');
  const [inStockOnly, setInStockOnly] = useState(params.in_stock === 'true');
  const [onSaleOnly, setOnSaleOnly] = useState(params.on_sale === 'true');

  // Temporary inputs inside filter modal
  const [tempCat, setTempCat] = useState(selectedCat);
  const [tempSort, setTempSort] = useState(selectedSort);
  const [tempMinPrice, setTempMinPrice] = useState(minPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState(maxPrice);
  const [tempInStock, setTempInStock] = useState(inStockOnly);
  const [tempOnSale, setTempOnSale] = useState(onSaleOnly);

  // Filter drawer modal & dropdown
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [aiSummary, setAiSummary] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load all categories for filter drawer
  useEffect(() => {
    let mounted = true;
    categoryApi
      .getAllCategories()
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : data?.results || [];
        setCategories(list);
      })
      .catch((err) => console.warn('Filter categories load failed:', err));
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch products with backend filters
  const fetchProducts = useCallback(
    async (pageToLoad = 1, isRefresh = false) => {
      try {
        if (pageToLoad === 1 && !isRefresh) setLoading(true);

        const apiParams = {
          page: pageToLoad,
          sort: selectedSort,
        };

        if (selectedCat) apiParams.cat = selectedCat;
        if (searchQuery.trim()) apiParams.q = searchQuery.trim();
        if (minPrice) apiParams.min_price = minPrice;
        if (maxPrice) apiParams.max_price = maxPrice;
        if (inStockOnly) apiParams.in_stock = 'true';
        if (onSaleOnly) apiParams.on_sale = 'true';
        if (params.featured) apiParams.featured = 'true';

        const data = await productApi.getProducts(apiParams);
        let results = Array.isArray(data) ? data : data?.results || [];
        const count = data?.count !== undefined ? data.count : results.length;
        setTotalCount(count);

        // AI Semantic Search Fallback when regular search has no matches
        if (pageToLoad === 1 && searchQuery.trim() && results.length === 0) {
          try {
            const aiRes = await productApi.searchAiProducts(searchQuery.trim());
            if (aiRes && Array.isArray(aiRes.products) && aiRes.products.length > 0) {
              results = aiRes.products;
              setAiSummary(aiRes.summary || `AI semantic matches for "${searchQuery}"`);
            } else {
              setAiSummary('');
            }
          } catch {
            setAiSummary('');
          }
        } else {
          setAiSummary('');
        }

        if (pageToLoad === 1) {
          setProducts(results);
        } else {
          setProducts((prev) => [...prev, ...results]);
        }

        setHasMore(Boolean(data?.next));
        setPage(pageToLoad);
      } catch (err) {
        console.warn('Failed to fetch filtered products:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [selectedCat, searchQuery, selectedSort, minPrice, maxPrice, inStockOnly, onSaleOnly, params.featured]
  );

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(1, true);
  };

  const onEndReached = () => {
    if (!loading && !loadingMore && hasMore) {
      setLoadingMore(true);
      fetchProducts(page + 1);
    }
  };

  // Open modal and sync temp filters
  const openFilterModal = () => {
    setTempCat(selectedCat);
    setTempSort(selectedSort);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempInStock(inStockOnly);
    setTempOnSale(onSaleOnly);
    setFilterModalOpen(true);
  };

  // Apply filters from modal
  const applyFilters = () => {
    setSelectedCat(tempCat);
    setSelectedSort(tempSort);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setInStockOnly(tempInStock);
    setOnSaleOnly(tempOnSale);
    setFilterModalOpen(false);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCat('');
    setSelectedSort('newest');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSearchQuery('');
    setTempCat('');
    setTempSort('newest');
    setTempMinPrice('');
    setTempMaxPrice('');
    setTempInStock(false);
    setTempOnSale(false);
  };

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCat) count++;
    if (minPrice || maxPrice) count++;
    if (inStockOnly) count++;
    if (onSaleOnly) count++;
    if (selectedSort !== 'newest') count++;
    return count;
  }, [selectedCat, minPrice, maxPrice, inStockOnly, onSaleOnly, selectedSort]);

  // Selected category object
  const selectedCatObj = useMemo(() => {
    return categories.find((c) => c.slug === selectedCat || String(c.id) === String(selectedCat));
  }, [categories, selectedCat]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title={
          selectedCatObj
            ? selectedCatObj.name
            : params.categoryName || 'আমাদের সকল পণ্য (All Products)'
        }
        showCart
      />

      {/* Top Search & Filter Bar */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={theme.colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Search products or style..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => fetchProducts(1)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={openFilterModal}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilterCount > 0 ? theme.colors.white : theme.colors.primary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Horizontal Category Strip & Quick Sort Chips */}
      <View style={styles.quickFiltersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFiltersScroll}
        >
          {/* Quick All Button */}
          <TouchableOpacity
            style={[styles.quickChip, !selectedCat && styles.quickChipActive]}
            onPress={() => setSelectedCat('')}
          >
            <Text style={[styles.quickChipText, !selectedCat && styles.quickChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          {/* Quick Categories */}
          {categories.slice(0, 10).map((cat) => {
            const isCatActive = selectedCat === cat.slug;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.quickChip, isCatActive && styles.quickChipActive]}
                onPress={() => setSelectedCat(isCatActive ? '' : cat.slug)}
              >
                <Text
                  style={[
                    styles.quickChipText,
                    isCatActive && styles.quickChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Active Filters Summary Bar */}
      {activeFilterCount > 0 && (
        <View style={styles.activeBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeBarScroll}
          >
            {selectedCatObj && (
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>Cat: {selectedCatObj.name}</Text>
                <TouchableOpacity onPress={() => setSelectedCat('')}>
                  <Ionicons name="close" size={14} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            {(minPrice || maxPrice) && (
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>
                  ৳{minPrice || 0} - ৳{maxPrice || '∞'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                >
                  <Ionicons name="close" size={14} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            {inStockOnly && (
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>In Stock</Text>
                <TouchableOpacity onPress={() => setInStockOnly(false)}>
                  <Ionicons name="close" size={14} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            {onSaleOnly && (
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>On Sale</Text>
                <TouchableOpacity onPress={() => setOnSaleOnly(false)}>
                  <Ionicons name="close" size={14} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            {selectedSort !== 'newest' && (
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>
                  {SORT_OPTIONS.find((s) => s.value === selectedSort)?.label.split(' ')[0]}
                </Text>
                <TouchableOpacity onPress={() => setSelectedSort('newest')}>
                  <Ionicons name="close" size={14} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.clearAllBtn} onPress={clearAllFilters}>
              <Text style={styles.clearAllBtnText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* AI Semantic Search Summary */}
      {Boolean(aiSummary) && (
        <View style={styles.aiBanner}>
          <Ionicons name="sparkles" size={16} color="#d97706" />
          <Text style={styles.aiBannerText}>{aiSummary}</Text>
        </View>
      )}

      {/* Product Grid / Empty State */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : products.length === 0 ? (
        <EmptyState
          title="কোন পণ্য পাওয়া যায়নি (No Products Found)"
          message="আপনার অনুসন্ধান বা ফিল্টার শর্ত পরিবর্তন করে আবার চেষ্টা করুন।"
          actionLabel="ফিল্টার রিসেট করুন (Reset Filters)"
          onAction={clearAllFilters}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard product={item} />
            </View>
          )}
        />
      )}

      {/* COMPREHENSIVE FILTER DRAWER MODAL (MATCHING WEBSITE) */}
      <Modal
        visible={filterModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="options" size={20} color={theme.colors.primary} />
                <Text style={styles.modalTitle}>পণ্য ফিল্টার (Filters)</Text>
              </View>
              <TouchableOpacity
                onPress={() => setFilterModalOpen(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Modal Scrollable Body */}
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Sorting Options */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionHeader}>সর্টিং (Sort By)</Text>
                <View style={styles.sortChipsWrap}>
                  {SORT_OPTIONS.map((opt) => {
                    const isSortActive = tempSort === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.sortRadioChip,
                          isSortActive && styles.sortRadioChipActive,
                        ]}
                        onPress={() => setTempSort(opt.value)}
                      >
                        <Ionicons
                          name={
                            isSortActive
                              ? 'radio-button-on'
                              : 'radio-button-off'
                          }
                          size={16}
                          color={
                            isSortActive
                              ? theme.colors.primary
                              : theme.colors.textMuted
                          }
                        />
                        <Text
                          style={[
                            styles.sortRadioText,
                            isSortActive && styles.sortRadioTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 2. Availability Toggles */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionHeader}>স্টক ও অফার (Availability)</Text>
                <View style={styles.switchRow}>
                  <View style={styles.switchLabelWrap}>
                    <Ionicons name="cube-outline" size={18} color="#16a34a" />
                    <Text style={styles.switchLabel}>শুধু স্টক থাকা পণ্য (In Stock)</Text>
                  </View>
                  <Switch
                    value={tempInStock}
                    onValueChange={setTempInStock}
                    trackColor={{ false: '#e2e8f0', true: '#bbf7d0' }}
                    thumbColor={tempInStock ? '#16a34a' : '#f8fafc'}
                  />
                </View>

                <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.switchLabelWrap}>
                    <Ionicons name="pricetag-outline" size={18} color="#db2777" />
                    <Text style={styles.switchLabel}>ডিসকাউন্ট যুক্ত পণ্য (On Sale)</Text>
                  </View>
                  <Switch
                    value={tempOnSale}
                    onValueChange={setTempOnSale}
                    trackColor={{ false: '#e2e8f0', true: '#fbcfe8' }}
                    thumbColor={tempOnSale ? '#db2777' : '#f8fafc'}
                  />
                </View>
              </View>

              {/* 3. Price Presets & Range */}
              <View style={styles.filterSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeader}>মূল্য পরিসীমা (Price Range)</Text>
                  {(tempMinPrice || tempMaxPrice) && (
                    <TouchableOpacity
                      onPress={() => {
                        setTempMinPrice('');
                        setTempMaxPrice('');
                      }}
                    >
                      <Text style={styles.resetSectionText}>রিসেট</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Preset Chips */}
                <View style={styles.presetChipsWrap}>
                  {PRICE_PRESETS.map((preset, idx) => {
                    const isPresetActive =
                      tempMinPrice === preset.min && tempMaxPrice === preset.max;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.presetChip,
                          isPresetActive && styles.presetChipActive,
                        ]}
                        onPress={() => {
                          setTempMinPrice(preset.min);
                          setTempMaxPrice(preset.max);
                        }}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            isPresetActive && styles.presetChipTextActive,
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom Min / Max Inputs */}
                <View style={styles.customPriceRow}>
                  <View style={styles.priceInputWrap}>
                    <Text style={styles.priceInputPrefix}>৳</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="Min"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="numeric"
                      value={tempMinPrice}
                      onChangeText={setTempMinPrice}
                    />
                  </View>
                  <Text style={styles.priceDash}>-</Text>
                  <View style={styles.priceInputWrap}>
                    <Text style={styles.priceInputPrefix}>৳</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="Max"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="numeric"
                      value={tempMaxPrice}
                      onChangeText={setTempMaxPrice}
                    />
                  </View>
                </View>
              </View>

              {/* 4. Category Selector */}
              <View style={styles.filterSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeader}>ক্যাটাগরি (Categories)</Text>
                  {tempCat && (
                    <TouchableOpacity onPress={() => setTempCat('')}>
                      <Text style={styles.resetSectionText}>সকল ক্যাটাগরি</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.catChipsGrid}>
                  <TouchableOpacity
                    style={[
                      styles.categoryFilterChip,
                      !tempCat && styles.categoryFilterChipActive,
                    ]}
                    onPress={() => setTempCat('')}
                  >
                    <Text
                      style={[
                        styles.categoryFilterChipText,
                        !tempCat && styles.categoryFilterChipTextActive,
                      ]}
                    >
                      সব পণ্য (All)
                    </Text>
                  </TouchableOpacity>

                  {categories.map((cat) => {
                    const isSelected = tempCat === cat.slug;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryFilterChip,
                          isSelected && styles.categoryFilterChipActive,
                        ]}
                        onPress={() => setTempCat(isSelected ? '' : cat.slug)}
                      >
                        <Text
                          style={[
                            styles.categoryFilterChipText,
                            isSelected && styles.categoryFilterChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {cat.name}
                        </Text>
                        {cat.product_count > 0 && (
                          <Text
                            style={[
                              styles.categoryCountBadge,
                              isSelected && styles.categoryCountBadgeActive,
                            ]}
                          >
                            {cat.product_count}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Modal Sticky Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setTempCat('');
                  setTempSort('newest');
                  setTempMinPrice('');
                  setTempMaxPrice('');
                  setTempInStock(false);
                  setTempOnSale(false);
                }}
              >
                <Text style={styles.resetBtnText}>রিসেট (Reset)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>ফিল্টার প্রয়োগ করুন (Apply)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Persistent Bottom Navigation - ALWAYS VISIBLE */}
      <AppBottomNav currentRoute="/products" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: 10,
    backgroundColor: theme.colors.surface,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#db2777',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickFiltersContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 8,
  },
  quickFiltersScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
  },
  quickChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  quickChipTextActive: {
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.bold,
  },
  activeBar: {
    backgroundColor: '#FAF5FF',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
  },
  activeBarScroll: {
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    gap: 8,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  activeTagText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  clearAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#dc2626',
    textDecorationLine: 'underline',
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    gap: 8,
  },
  aiBannerText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#92400e',
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 110,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  gridItem: {
    width: '48%',
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    flexGrow: 0,
  },
  modalBodyContent: {
    padding: theme.spacing.lg,
    gap: 20,
  },
  filterSection: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resetSectionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  sortChipsWrap: {
    gap: 8,
  },
  sortRadioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sortRadioChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FAF5FF',
  },
  sortRadioText: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
  },
  sortRadioTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  switchLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
  },
  presetChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  presetChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  presetChipTextActive: {
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.bold,
  },
  customPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  priceInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    height: 40,
  },
  priceInputPrefix: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.textMuted,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  priceDash: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: 'bold',
  },
  catChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryFilterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryFilterChipText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
  },
  categoryFilterChipTextActive: {
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.bold,
  },
  categoryCountBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textMuted,
    backgroundColor: '#fff',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  categoryCountBadgeActive: {
    color: theme.colors.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  resetBtn: {
    width: '35%',
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
});
