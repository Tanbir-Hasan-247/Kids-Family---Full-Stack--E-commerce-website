// Product Card Component - Kids & Family Design
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows } from '../../constants/theme';
import { formatProductImageUrl } from '../../utils/imageHelper';
import wishlistApi from '../../api/wishlistApi';
import { useWishlist } from '../../context/WishlistContext';
import PriceTag from '../common/PriceTag';
import Badge from '../common/Badge';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.base * 2 - Spacing.md) / 2;

export default function ProductCard({ product, style = null }) {
  const router = useRouter();
  const { isFavorited: checkFavorited, toggleWishlist } = useWishlist();

  if (!product) return null;

  const isFav = checkFavorited(product.id) || Boolean(product.is_favorited || product.favorited);
  const imageUrl = formatProductImageUrl(product.thumbnail || product.image);
  const startingPrice = product.starting_price || product.base_price;
  const comparePrice = product.compare_at_price;
  const discount = product.max_discount || 0;
  const isOnSale = product.is_on_sale || (discount > 0 && comparePrice > startingPrice);

  const handlePress = () => {
    if (!product?.id) return;
    router.push({
      pathname: '/products/[id]',
      params: { id: product.id.toString() },
    });
  };

  const handleToggleWishlist = async () => {
    if (!product?.id) return;
    try {
      await toggleWishlist(product.id);
    } catch (err) {
      console.warn('Wishlist toggle error:', err);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={handlePress}
      activeOpacity={0.88}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />

        {/* Discount Badge */}
        {isOnSale && discount > 0 && (
          <View style={styles.badgeContainer}>
            <Badge label={`-${discount}%`} variant="sale" />
          </View>
        )}

        {/* Wishlist Heart Button (Matching Figma Design & API connected) */}
        <TouchableOpacity
          style={styles.heartBtn}
          activeOpacity={0.8}
          onPress={handleToggleWishlist}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={16}
            color={isFav ? '#e11d48' : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Info Container */}
      <View style={styles.info}>
        {product.category_name && (
          <Text style={styles.category} numberOfLines={1}>
            {product.category_name}
          </Text>
        )}

        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <PriceTag
          price={startingPrice}
          compareAtPrice={comparePrice}
          size="sm"
          style={styles.priceRow}
        />

        {/* Action Button: "অর্ডার করুন" */}
        <View style={styles.orderBtn}>
          <Ionicons name="bag-handle-outline" size={13} color={Colors.white} />
          <Text style={styles.orderBtnText}>অর্ডার করুন</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: Spacing.xs + 2,
    left: Spacing.xs + 2,
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  info: {
    padding: Spacing.sm,
    justifyContent: 'space-between',
    flex: 1,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accentDark,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  name: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 16,
    minHeight: 32,
    marginBottom: Spacing.xs,
  },
  priceRow: {
    marginBottom: Spacing.xs + 2,
  },
  orderBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: Radius.md,
    gap: 4,
  },
  orderBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
});
