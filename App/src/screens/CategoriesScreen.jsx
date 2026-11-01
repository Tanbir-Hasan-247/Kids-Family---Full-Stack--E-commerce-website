import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { categoryApi } from '../api/categoryApi';
import { getCategoryAvatarSource } from '../utils/categoryAvatarHelper';
import { theme } from '../constants/theme';
import Header from '../components/common/Header';
import EmptyState from '../components/common/EmptyState';
import AppBottomNav from '../components/layout/AppBottomNav';

const getCategoryTheme = (name = '', slug = '', parentName = '') => {
  const combined = (slug + ' ' + name + ' ' + parentName).toLowerCase();
  if (combined.includes('woman') || combined.includes('women') || combined.includes('মহিলা')) {
    return {
      bg: '#faf5ff',
      border: '#e9d5ff',
      badgeBg: '#f3e8ff',
      color: '#9333ea',
      icon: 'flower-outline',
      defaultParent: 'Woman',
    };
  }
  if (combined.includes('girl') || combined.includes('মেয়ে') || combined.includes('মেয়ে')) {
    return {
      bg: '#fdf2f8',
      border: '#fce7f3',
      badgeBg: '#fce7f3',
      color: '#db2777',
      icon: 'sparkles-outline',
      defaultParent: 'Girl',
    };
  }
  if (combined.includes('man') || combined.includes('men') || combined.includes('পুরুষ')) {
    return {
      bg: '#f0fdf4',
      border: '#bbf7d0',
      badgeBg: '#dcfce7',
      color: '#16a34a',
      icon: 'person-outline',
      defaultParent: 'Man',
    };
  }
  if (combined.includes('boy') || combined.includes('ছেলে')) {
    return {
      bg: '#eff6ff',
      border: '#bfdbfe',
      badgeBg: '#dbeafe',
      color: '#2563eb',
      icon: 'body-outline',
      defaultParent: 'Boy',
    };
  }
  return {
    bg: '#fffbeb',
    border: '#fde68a',
    badgeBg: '#fef3c7',
    color: '#d97706',
    icon: 'people-outline',
    defaultParent: 'Family',
  };
};

const FILTER_TABS = [
  { key: 'All', label: 'All Categories' },
  { key: 'Boy', label: 'Boys' },
  { key: 'Girl', label: 'Girls' },
  { key: 'Man', label: 'Men' },
  { key: 'Woman', label: 'Women' },
  { key: 'Family', label: 'Family' },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoryApi.getAllCategories();
      const list = Array.isArray(data) ? data : data?.results || [];

      // Check if Family matching category is present, if not add it
      const hasFamily = list.some(
        (c) =>
          c.slug?.includes('family') ||
          c.name?.toLowerCase().includes('family') ||
          c.slug?.includes('matching')
      );
      if (!hasFamily) {
        list.push({
          id: 9999,
          name: 'Family Matching Outfits',
          slug: 'matching-sets-boy',
          parent_name: 'Family',
          parent_slug: 'family',
          product_count: 5,
        });
      }

      setCategories(list);
    } catch (err) {
      console.warn('Failed to load all categories:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const handleCategoryPress = (cat) => {
    router.push({
      pathname: '/products',
      params: { category: cat.slug || cat.id, categoryName: cat.name },
    });
  };

  // Filter categories according to active tab and search query
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = cat.name?.toLowerCase().includes(q);
        const matchesParent = cat.parent_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesParent) return false;
      }

      // Tab filter
      if (activeTab === 'All') return true;

      const parentKey = (cat.parent_name || '').toLowerCase();
      const catSlug = (cat.slug || '').toLowerCase();
      const catName = (cat.name || '').toLowerCase();
      const target = activeTab.toLowerCase();

      if (target === 'family') {
        return (
          catSlug.includes('family') ||
          catSlug.includes('matching') ||
          catName.includes('family') ||
          parentKey.includes('family')
        );
      }

      return (
        parentKey.includes(target) ||
        catSlug.includes(target) ||
        catName.includes(target)
      );
    });
  }, [categories, activeTab, searchQuery]);

  // Separate parent root categories from subcategories
  const parentCategories = useMemo(() => {
    return categories.filter(
      (c) => c.parent === null || c.parent === undefined || !c.parent
    );
  }, [categories]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="ক্যাটাগরি সমূহ (Categories)"
        showBack={false}
        rightComponent={
          <TouchableOpacity
            style={styles.searchHeaderBtn}
            onPress={() => router.push('/products')}
          >
            <Ionicons name="search" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        }
      />

      {/* Search Input for Quick Category Search */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search all categories..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Horizontal Filter Tabs: All, Boys, Girls, Men, Women, Family */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
              >
                <Text
                  style={[styles.filterTabText, isActive && styles.filterTabTextActive]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          title="কোন ক্যাটাগরি পাওয়া যায়নি"
          message="অন্য কোনো নাম দিয়ে সার্চ করুন অথবা ফিল্টার পরিবর্তন করুন।"
          actionLabel="Clear Filters"
          onAction={() => {
            setActiveTab('All');
            setSearchQuery('');
          }}
        />
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id?.toString() || item.slug}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListHeaderComponent={
            activeTab === 'All' && !searchQuery.trim() ? (
              <View style={styles.parentsSection}>
                <Text style={styles.sectionTitle}>Main Departments</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.parentPillsList}
                >
                  {parentCategories.map((p) => {
                    const avatarSrc = getCategoryAvatarSource(p.slug, p.name);
                    const t = getCategoryTheme(p.name, p.slug, p.parent_name);
                    return (
                      <TouchableOpacity
                        key={p.id}
                        activeOpacity={0.85}
                        style={[styles.parentPillCard, { borderColor: t.border }]}
                        onPress={() => handleCategoryPress(p)}
                      >
                        <View style={styles.parentPillAvatarWrap}>
                          <Image
                            source={avatarSrc}
                            style={styles.parentPillAvatar}
                            contentFit="cover"
                          />
                        </View>
                        <Text style={styles.parentPillTitle} numberOfLines={1}>
                          {p.name}
                        </Text>
                        <Text style={[styles.parentPillCount, { color: t.color }]}>
                          {p.product_count || 0}+ Items
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <Text style={[styles.sectionTitle, { marginTop: 18, marginBottom: 8 }]}>
                  All Subcategories with Parent
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const parentLabel =
              item.parent_name ||
              (item.parent ? 'Parent' : 'Main Department');
            const themeConfig = getCategoryTheme(item.name, item.slug, parentLabel);
            const avatarSrc = getCategoryAvatarSource(
              item.slug || item.parent_slug,
              item.name || item.parent_name
            );
            const countText =
              item.product_count !== undefined && item.product_count !== null
                ? `${item.product_count} Products`
                : 'Collection';

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.card,
                  { backgroundColor: themeConfig.bg, borderColor: themeConfig.border },
                ]}
                onPress={() => handleCategoryPress(item)}
              >
                {/* Parent Category Badge */}
                <View
                  style={[
                    styles.parentBadge,
                    { backgroundColor: themeConfig.badgeBg },
                  ]}
                >
                  <Text style={[styles.parentBadgeText, { color: themeConfig.color }]}>
                    {parentLabel.toUpperCase()}
                  </Text>
                </View>

                {/* Avatar Icon / Graphic */}
                <View style={styles.visualContainer}>
                  <Image
                    source={avatarSrc}
                    style={styles.avatarImage}
                    contentFit="contain"
                  />
                </View>

                {/* Category Info */}
                <View style={styles.infoBox}>
                  <Text style={styles.categoryTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={[styles.productCount, { color: themeConfig.color }]}>
                    {countText}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Persistent Bottom Navigation - ALWAYS VISIBLE */}
      <AppBottomNav currentRoute="/(tabs)/categories" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchHeaderBtn: {
    padding: 6,
    marginRight: 6,
  },
  searchBarWrapper: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    height: 38,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  tabsWrapper: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabsContainer: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterTabText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  filterTabTextActive: {
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.bold,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parentsSection: {
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  parentPillsList: {
    gap: 12,
    paddingBottom: 4,
  },
  parentPillCard: {
    width: 105,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    ...theme.shadows.sm,
  },
  parentPillAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  parentPillAvatar: {
    width: 44,
    height: 44,
  },
  parentPillTitle: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  parentPillCount: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.semibold,
    marginTop: 2,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 110,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  card: {
    width: '48%',
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    position: 'relative',
    ...theme.shadows.sm,
  },
  parentBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  parentBadgeText: {
    fontSize: 9,
    fontWeight: theme.typography.fontWeight.black,
    letterSpacing: 0.5,
  },
  visualContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: theme.spacing.sm,
  },
  avatarImage: {
    width: 56,
    height: 56,
  },
  infoBox: {
    alignItems: 'center',
    paddingHorizontal: 4,
    width: '100%',
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 18,
    minHeight: 36,
  },
  productCount: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: 4,
  },
});
