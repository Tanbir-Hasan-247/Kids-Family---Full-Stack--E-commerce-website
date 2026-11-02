import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useShopSettings } from '../context/ShopSettingsContext';
import HeroBannerSlider from '../components/home/HeroBannerSlider';
import CategoryPills from '../components/home/CategoryPills';
import ProductCard from '../components/product/ProductCard';
import HomePhotoReviews from '../components/home/HomePhotoReviews';
import HomePerksBar from '../components/home/HomePerksBar';
import HomeFAQ from '../components/home/HomeFAQ';
import SideDrawerModal from '../components/layout/SideDrawerModal';

export default function HomeScreen() {
  const router = useRouter();
  const { totalItems } = useCart();
  const { isAuthenticated } = useAuth();
  const { settings } = useShopSettings();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [dynamicCategorySections, setDynamicCategorySections] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [featRes, saleRes, latestRes, catsRes] = await Promise.allSettled([
        productApi.getFeaturedProducts(6),
        productApi.getSaleProducts(),
        productApi.getProducts({ page_size: 6 }),
        categoryApi.getCategories(true),
      ]);

      const normalize = (res) => {
        if (res.status === 'fulfilled' && res.value) {
          const val = res.value;
          return Array.isArray(val) ? val : val.results || [];
        }
        return [];
      };

      const feat = normalize(featRes).slice(0, 6);
      const sale = normalize(saleRes).slice(0, 4);
      const latest = normalize(latestRes).slice(0, 6);
      const cats = normalize(catsRes);

      setFeaturedProducts(feat);
      setSaleProducts(sale);
      setLatestProducts(latest);

      // Dynamically load products for up to 3 top categories
      if (cats.length > 0) {
        const topCats = cats.slice(0, 3);
        const catPromises = topCats.map((c) =>
          productApi.getProducts({ cat: c.slug, page_size: 4 }).catch(() => [])
        );
        const catResults = await Promise.allSettled(catPromises);
        const sections = [];
        topCats.forEach((c, idx) => {
          const cProds = normalize(catResults[idx]).slice(0, 4);
          if (cProds.length > 0) {
            sections.push({ category: c, products: cProds });
          }
        });
        setDynamicCategorySections(sections);
      }
    } catch (err) {
      console.warn('HomeScreen data load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const navigateToSearch = (searchTerm = '') => {
    router.push({
      pathname: '/products',
      params: { q: searchTerm },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header matching Figma Screen 5 */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => setDrawerVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu-outline" size={26} color={theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.brandingCenter}>
          <Text style={styles.brandTitle}>Kids & Family</Text>
        </View>

        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => router.push('/(tabs)/profile')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      {/* Side Drawer Modal (Matching Figma Screen 14) */}
      <SideDrawerModal
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Search Input Button with AI Shortcut (Matching Figma Screen 4) */}
      <View style={styles.searchBarRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.searchBar}
          onPress={() => navigateToSearch('')}
        >
          <Ionicons name="search" size={20} color={theme.colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search products or ask AI...</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aiQuickBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/ai')}
        >
          <Ionicons name="sparkles" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* 1. Live Hero Carousel */}
        <HeroBannerSlider />

        {/* 2. Interactive Category Pills */}
        <CategoryPills />

        {/* 3. Featured Trending Styles */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Featured Products</Text>
                <Text style={styles.sectionSubtitle}>Handpicked trending outfits</Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => router.push({ pathname: '/products', params: { featured: 'true' } })}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="arrow-forward" size={13} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.gridContainer}>
              {featuredProducts.map((item) => (
                <View key={item.id} style={styles.gridItem}>
                  <ProductCard product={item} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 4. Special Offers & Sale */}
        {saleProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Special Offers & Sale 🔥</Text>
                <Text style={styles.sectionSubtitle}>Exclusive discounted prices for limited time</Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => router.push({ pathname: '/products', params: { on_sale: 'true' } })}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="arrow-forward" size={13} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.gridContainer}>
              {saleProducts.map((item) => (
                <View key={item.id} style={styles.gridItem}>
                  <ProductCard product={item} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 5. Dynamic Category Collections (Driven 100% by backend categories) */}
        {dynamicCategorySections.map(({ category, products }) => (
          <View key={category.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{category.name}</Text>
                <Text style={styles.sectionSubtitle}>Curated styles in {category.name}</Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => router.push({ pathname: '/products', params: { category: category.slug } })}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="arrow-forward" size={13} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.gridContainer}>
              {products.map((item) => (
                <View key={item.id} style={styles.gridItem}>
                  <ProductCard product={item} />
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* 6. Latest Arrivals Fallback */}
        {dynamicCategorySections.length === 0 && latestProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>New Arrivals</Text>
                <Text style={styles.sectionSubtitle}>Explore the latest kids & family fashion</Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => router.push('/products')}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="arrow-forward" size={13} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.gridContainer}>
              {latestProducts.map((item) => (
                <View key={item.id} style={styles.gridItem}>
                  <ProductCard product={item} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 7. Real Customer Photo Reviews */}
        <HomePhotoReviews />

        {/* 8. Trust Perks */}
        <HomePerksBar />

        {/* 9. Interactive FAQ Accordion */}
        <HomeFAQ />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  brandingCenter: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: -0.3,
  },
  headerIconBtn: {
    padding: 6,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e11d48',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  topAnnouncementBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1b3b2b',
    paddingVertical: 5,
    paddingHorizontal: theme.spacing.md,
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  announcementText: {
    color: '#d1fae5',
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    gap: 10,
  },
  aiQuickBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchPlaceholder: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.extrabold,
    color: theme.colors.text,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  seeAllText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48.5%',
  },
});
