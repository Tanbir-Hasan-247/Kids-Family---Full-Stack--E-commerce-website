// Loading Placeholder Skeleton Component
import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';

export default function LoadingSkeleton({ count = 4, type = 'card' }) {
  if (type === 'spinner') {
    return (
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {[...Array(count)].map((_, idx) => (
        <View key={idx} style={styles.card}>
          <View style={styles.imagePlaceholder} />
          <View style={styles.textPlaceholder} />
          <View style={[styles.textPlaceholder, { width: '60%' }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  spinnerContainer: {
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  card: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  imagePlaceholder: {
    aspectRatio: 3 / 4,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.md,
  },
  textPlaceholder: {
    height: 12,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.sm,
    width: '90%',
  },
});
