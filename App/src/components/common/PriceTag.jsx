// Price Tag with Bangladeshi Taka (৳) formatting and Strikethrough
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../../constants/theme';
import { formatPrice } from '../../utils/currency';

export default function PriceTag({
  price,
  compareAtPrice = null,
  size = 'md', // 'sm' | 'md' | 'lg'
  style = null,
}) {
  const getPriceStyle = () => {
    switch (size) {
      case 'sm':
        return styles.smPrice;
      case 'lg':
        return styles.lgPrice;
      case 'md':
      default:
        return styles.mdPrice;
    }
  };

  const getCompareStyle = () => {
    switch (size) {
      case 'sm':
        return styles.smCompare;
      case 'lg':
        return styles.lgCompare;
      case 'md':
      default:
        return styles.mdCompare;
    }
  };

  const hasDiscount =
    compareAtPrice && Number(compareAtPrice) > Number(price);

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.price, getPriceStyle()]}>
        {formatPrice(price)}
      </Text>
      {hasDiscount && (
        <Text style={[styles.compare, getCompareStyle()]}>
          {formatPrice(compareAtPrice)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  price: {
    fontWeight: '900',
    color: Colors.primary,
  },
  smPrice: {
    fontSize: 13,
  },
  mdPrice: {
    fontSize: 16,
  },
  lgPrice: {
    fontSize: 22,
  },
  compare: {
    color: Colors.textLight,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  smCompare: {
    fontSize: 10,
  },
  mdCompare: {
    fontSize: 12,
  },
  lgCompare: {
    fontSize: 15,
  },
});
