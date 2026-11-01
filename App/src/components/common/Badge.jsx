// Badge and Tag Component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../constants/theme';

export default function Badge({
  label,
  text,
  children,
  variant = 'sale', // 'sale' | 'success' | 'warning' | 'muted' | 'default' | 'error'
  size = 'sm',
  style = null,
}) {
  const content = label || text || children || '';

  const getBadgeStyle = () => {
    switch (variant) {
      case 'success':
        return styles.successBadge;
      case 'warning':
        return styles.warningBadge;
      case 'muted':
        return styles.mutedBadge;
      case 'error':
        return styles.errorBadge;
      case 'sale':
      default:
        return styles.saleBadge;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'success':
        return styles.successText;
      case 'warning':
        return styles.warningText;
      case 'muted':
        return styles.mutedText;
      case 'error':
        return styles.errorText;
      case 'sale':
      default:
        return styles.saleText;
    }
  };

  return (
    <View style={[styles.badge, getBadgeStyle(), style]}>
      <Text style={[styles.text, getTextStyle()]}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  saleBadge: {
    backgroundColor: Colors.sale,
  },
  saleText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  successBadge: {
    backgroundColor: Colors.successLight,
  },
  successText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
  warningBadge: {
    backgroundColor: Colors.warningLight,
  },
  warningText: {
    color: Colors.accentDark,
    fontSize: 10,
    fontWeight: '700',
  },
  mutedBadge: {
    backgroundColor: Colors.borderLight,
  },
  mutedText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  errorBadge: {
    backgroundColor: Colors.errorLight,
  },
  errorText: {
    color: Colors.error,
    fontSize: 10,
    fontWeight: '700',
  },
});
