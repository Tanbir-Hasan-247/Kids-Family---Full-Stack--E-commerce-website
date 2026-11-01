import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { categoryApi } from '../../api/categoryApi';
import { formatImageUrl } from '../../utils/imageHelper';
import { getCategoryAvatarSource } from '../../utils/categoryAvatarHelper';
import { theme } from '../../constants/theme';

const getCategoryPastel = (name = '', slug = '') => {
  const s = (slug + ' ' + name).toLowerCase();
  if (s.includes('boy')) {
    return { bg: '#eff6ff', border: '#dbeafe', icon: 'body-outline', color: '#2563eb' };
  }
  if (s.includes('girl')) {
    return { bg: '#fdf2f8', border: '#fce7f3', icon: 'sparkles-outline', color: '#db2777' };
  }
  if (s.includes('man') || s.includes('men')) {
    return { bg: '#f0fdf4', border: '#dcfce7', icon: 'person-outline', color: '#16a34a' };
  }
  if (s.includes('woman') || s.includes('women')) {
    return { bg: '#faf5ff', border: '#f3e8ff', icon: 'flower-outline', color: '#9333ea' };
  }
  return { bg: '#fffbeb', border: '#fef3c7', icon: 'people-outline', color: '#d97706' };
};

export default function CategoryPills() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAllCategories();
        if (isMounted) {
          const list = Array.isArray(data) ? data : data?.results || [];

          // ONLY SHOW PARENT CATEGORIES (parent is null or undefined)
          let parents = list.filter(
            (c) => c.parent === null || c.parent === undefined || !c.parent
          );

          // Ensure Family is present in parent list
          const hasFamily = parents.some(
            (c) => c.slug?.includes('family') || c.name?.toLowerCase().includes('family')
          );
          if (!hasFamily) {
            parents.push({
              id: 'family-matching',
              name: 'Family',
              slug: 'matching-sets-boy',
              product_count: 12,
            });
          }

          setCategories(parents);
        }
      } catch (err) {
        console.warn('Failed to load parent categories:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (categories.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Categories</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/categories')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.seeAllBtn}
        >
          <Text style={styles.seeAll}>See All</Text>
          <Ionicons name="arrow-forward" size={13} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id?.toString() || item.slug}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const pastel = getCategoryPastel(item.name, item.slug);
          // 1. Check local client avatar image (boy.png, girl.png, man.png, woman.png, family.png)
          const localAvatar = getCategoryAvatarSource(item.slug, item.name);
          // 2. Check if API has an explicit image URL
          const remoteImgUrl = item.image && typeof item.image === 'string' ? formatImageUrl(item.image) : null;

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.pillItem}
              onPress={() =>
                router.push({
                  pathname: '/products',
                  params: { category: item.slug || item.id, categoryName: item.name },
                })
              }
            >
              <View
                style={[
                  styles.avatarWrapper,
                  { backgroundColor: pastel.bg, borderColor: pastel.border },
                ]}
              >
                {localAvatar ? (
                  <Image
                    source={localAvatar}
                    style={styles.avatarImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : remoteImgUrl ? (
                  <Image
                    source={{ uri: remoteImgUrl }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.iconContainer}>
                    <Ionicons name={pastel.icon} size={26} color={pastel.color} />
                  </View>
                )}
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  heading: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.extrabold,
    color: theme.colors.text,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  seeAll: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  pillItem: {
    alignItems: 'center',
    width: 72,
  },
  avatarWrapper: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
});
