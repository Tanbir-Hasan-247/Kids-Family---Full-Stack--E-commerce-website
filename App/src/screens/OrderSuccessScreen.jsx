import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { formatPrice } from '../utils/currency';
import CustomButton from '../components/common/CustomButton';
import AppBottomNav from '../components/layout/AppBottomNav';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { orderNumber, total, phone } = useLocalSearchParams();
  const [copied, setCopied] = useState(false);

  const displayOrderNumber = orderNumber ? `#${orderNumber}` : '';

  const handleCopy = async () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    try {
      await Share.share({
        title: 'Order Tracking ID',
        message: `My Kids & Family Order Tracking Number is ${displayOrderNumber}.`,
      });
    } catch (e) {
      console.warn('Share note:', e?.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Green Circle & Confetti (Matching Figma Screen 15) */}
        <View style={styles.celebrationWrapper}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={48} color={theme.colors.white} />
          </View>
          <Text style={styles.title}>Order Placed! 🎉</Text>
          <Text style={styles.subtitle}>
            Your order has been placed successfully.
          </Text>
        </View>

        {/* Tracking ID Lavender Card (Matching Figma Screen 15) */}
        <View style={styles.trackingCard}>
          <Text style={styles.trackingLabel}>Tracking ID</Text>
          <TouchableOpacity
            style={styles.trackingRow}
            onPress={handleCopy}
            activeOpacity={0.7}
          >
            <Text style={styles.trackingNumber}>{displayOrderNumber}</Text>
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Action Buttons (Matching Figma Screen 15) */}
        <View style={styles.actions}>
          <CustomButton
            title="Continue Shopping"
            variant="primary"
            style={styles.primaryBtn}
            onPress={() => router.replace('/(tabs)')}
          />

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.outlineBtn}
            onPress={() => router.push('/orders')}
          >
            <Text style={styles.outlineBtnText}>View Orders</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Festive Gift Boxes Illustration (Matching Figma Screen 15) */}
        <View style={styles.giftsIllustration}>
          <View style={styles.giftIconBox}>
            <Ionicons name="gift" size={32} color="#ec4899" />
          </View>
          <View style={[styles.giftIconBox, styles.giftIconBoxCenter]}>
            <Ionicons name="sparkles" size={38} color="#8b5cf6" />
          </View>
          <View style={styles.giftIconBox}>
            <Ionicons name="gift-outline" size={32} color="#10b981" />
          </View>
        </View>
      </ScrollView>

      {/* Persistent Bottom Navigation - ALWAYS VISIBLE */}
      <AppBottomNav currentRoute="/orders" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing['2xl'],
    alignItems: 'center',
    gap: theme.spacing.lg,
    paddingBottom: 80,
  },
  celebrationWrapper: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#10b981', // Crisp emerald green matching Figma Screen 15
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: theme.spacing.md,
  },
  trackingCard: {
    width: '100%',
    backgroundColor: '#ede9fe', // Soft pastel lavender pill card matching Figma
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#ddd6fe',
    alignItems: 'center',
  },
  trackingLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackingNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  actions: {
    width: '100%',
    gap: 12,
    marginTop: theme.spacing.sm,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingVertical: 14,
  },
  outlineBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#ddd6fe',
    borderRadius: theme.radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  outlineBtnText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  giftsIllustration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: theme.spacing.lg,
  },
  giftIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftIconBoxCenter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ede9fe',
  },
});
