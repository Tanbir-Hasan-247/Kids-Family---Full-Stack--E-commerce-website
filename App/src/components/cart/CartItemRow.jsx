import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { formatImageUrl } from '../../utils/imageHelper';
import { formatPrice } from '../../utils/currency';
import { theme } from '../../constants/theme';
import QuantityStepper from '../common/QuantityStepper';

export default function CartItemRow({ item, onUpdateQuantity, onRemove }) {
  if (!item) return null;

  const variant = item.variant || {};
  const rawImg = variant.image || item.image || item.product_image || item.thumbnail || variant.product_thumbnail;
  const imgUrl = formatImageUrl(rawImg);
  const unitPrice = parseFloat(variant.price || item.price || 0);
  const quantity = item.quantity || 1;
  const itemTotal = unitPrice * quantity;

  // Extract color & size names from variant attributes
  const variantAttrs = Array.isArray(variant.attributes) ? variant.attributes : [];
  const variantDesc = variantAttrs.map((a) => a.name || a.value).filter(Boolean).join(' • ');

  return (
    <View style={styles.card}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {imgUrl ? (
          <Image
            source={{ uri: imgUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.fallbackImage}>
            <Ionicons name="shirt-outline" size={24} color={theme.colors.textMuted} />
          </View>
        )}
      </View>

      {/* Info Column */}
      <View style={styles.infoCol}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={2}>
            {item.product_name || variant.product_name || 'Product'}
          </Text>
          <TouchableOpacity
            onPress={() => onRemove && onRemove(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        {variantDesc ? (
          <Text style={styles.variantBadge}>{variantDesc}</Text>
        ) : null}

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.price}>{formatPrice(unitPrice)}</Text>
            {quantity > 1 && (
              <Text style={styles.subtotalText}>Total: {formatPrice(itemTotal)}</Text>
            )}
          </View>

          <QuantityStepper
            quantity={quantity}
            maxQuantity={variant.stock || 99}
            onChange={(newQty) => onUpdateQuantity && onUpdateQuantity(item.id, newQty)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
    ...theme.shadows.sm,
  },
  imageContainer: {
    width: 80,
    height: 96,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    lineHeight: 18,
  },
  deleteBtn: {
    padding: 2,
  },
  variantBadge: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.surfaceMuted,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginVertical: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  price: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.primary,
  },
  subtotalText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});
