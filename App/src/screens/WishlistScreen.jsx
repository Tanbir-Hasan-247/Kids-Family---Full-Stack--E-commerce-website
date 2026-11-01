import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { wishlistApi } from '../api/wishlistApi';
import { useCart } from '../context/CartContext';
import { formatImageUrl } from '../utils/imageHelper';
import { formatPrice } from '../utils/currency';
import { theme } from '../constants/theme';
import Header from '../components/common/Header';
import EmptyState from '../components/common/EmptyState';
import AppBottomNav from '../components/layout/AppBottomNav';

export default function WishlistScreen() {
  const router = useRouter();
  const { addToCart } = useCart();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [movingId, setMovingId] = useState(null);

  const fetchWishlist = useCallback(async () => {
    try {
      const data = await wishlistApi.getWishlist();
      const list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      setWishlistItems(list);
    } catch (err) {
      console.warn('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWishlist();
  };

  const handleRemove = async (productId) => {
    try {
      // Optimistic update
      setWishlistItems((prev) => prev.filter((item) => (item.product?.id || item.id) !== productId));
      await wishlistApi.toggleWishlist(productId);
    } catch (err) {
      console.warn('Failed to toggle wishlist:', err);
      fetchWishlist();
    }
  };

  const handleMoveToCart = async (product) => {
    const prodId = product.id;
    setMovingId(prodId);
    try {
      // Find default variant or first variant
      let variant = product.variants?.find((v) => v.stock > 0) || product.variants?.[0];
      if (!variant) {
        try {
          const fullProd = await productApi.getProductDetail(prodId);
          variant = fullProd?.variants?.find((v) => v.stock > 0) || fullProd?.variants?.[0];
        } catch {}
      }

      if (!variant) {
        // If variants need selection, navigate to detail
        router.push(`/products/${prodId}`);
        return;
      }

      const res = await addToCart(variant.id, 1);
      if (res.success) {
        await handleRemove(prodId);
        Alert.alert('Added to Cart', `${product.name} moved to your shopping bag!`);
      } else {
        router.push(`/products/${prodId}`);
      }
    } catch (err) {
      router.push(`/products/${prodId}`);
    } finally {
      setMovingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Wishlist" />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : wishlistItems.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="Your Wishlist is Empty"
          message="Save your favorite outfits by tapping the heart icon while browsing."
          actionLabel="Explore Collections"
          onAction={() => router.push('/products')}
        />
      ) : (
        <FlatList
          data={wishlistItems}
          keyExtractor={(item) => (item.id || item.product?.id || Math.random()).toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const product = item.product || item;
            const imgUrl = formatImageUrl(product.thumbnail || product.image);
            const price = parseFloat(product.starting_price || product.base_price || product.price || 0);

            return (
              <View style={styles.card}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.imageWrapper}
                  onPress={() => router.push(`/products/${product.id}`)}
                >
                  {imgUrl ? (
                    <Image source={{ uri: imgUrl }} style={styles.image} contentFit="cover" />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="shirt-outline" size={24} color={theme.colors.textMuted} />
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.infoCol}>
                  <Text style={styles.title} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.price}>{formatPrice(price)}</Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.moveToCartBtn}
                    onPress={() => handleMoveToCart(product)}
                  >
                    {movingId === product.id ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <>
                        <Ionicons name="bag-handle-outline" size={13} color={theme.colors.primary} />
                        <Text style={styles.moveToCartText}>Move to cart</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Heart Toggle Button */}
                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={() => handleRemove(product.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="heart" size={20} color="#e11d48" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Persistent Bottom Navigation - ALWAYS VISIBLE */}
      <AppBottomNav currentRoute="/profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 80,
    gap: theme.spacing.md,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 12,
    ...theme.shadows.sm,
  },
  imageWrapper: {
    width: 72,
    height: 84,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f5f3ff',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 17,
  },
  price: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  moveToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingVertical: 4,
  },
  moveToCartText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  heartBtn: {
    padding: 8,
  },
});
