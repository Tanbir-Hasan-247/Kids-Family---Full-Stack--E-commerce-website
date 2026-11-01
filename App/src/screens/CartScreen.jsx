import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useShopSettings } from '../context/ShopSettingsContext';
import { formatPrice } from '../utils/currency';
import { theme } from '../constants/theme';
import Header from '../components/common/Header';
import CustomButton from '../components/common/CustomButton';
import EmptyState from '../components/common/EmptyState';
import CartItemRow from '../components/cart/CartItemRow';

export default function CartScreen() {
  const router = useRouter();
  const { items, totalPrice, totalItems, updateQuantity, removeItem, clearCart } = useCart();
  const { settings } = useShopSettings();

  const subtotal = parseFloat(totalPrice) || 0;
  const feeInside = Number(settings?.delivery_inside_dhaka ?? 60);
  const estimatedShipping = subtotal > 0 ? feeInside : 0;
  const grandTotal = subtotal + estimatedShipping;

  const handleClearCart = () => {
    Alert.alert('Clear Bag', 'Are you sure you want to remove all items from your bag?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCart },
    ]);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="My Cart" showBack={false} />
        <EmptyState
          icon="bag-outline"
          title="Your Shopping Cart is Empty"
          message="Explore our premium collection and discover outfits for your family."
          actionLabel="Start Shopping"
          onAction={() => router.push('/products')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>My Cart</Text>
          <Text style={styles.itemCountText}>
            {totalItems} item{totalItems > 1 ? 's' : ''} in cart
          </Text>
        </View>

        <TouchableOpacity onPress={handleClearCart} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        )}
        ListFooterComponent={
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping Fee</Text>
              <Text style={styles.summaryValue}>{formatPrice(estimatedShipping)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(grandTotal)}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.inlineCheckoutBtn}
              onPress={() => router.push('/checkout')}
            >
              <Text style={styles.inlineCheckoutBtnText}>Checkout →</Text>
            </TouchableOpacity>

            <View style={styles.codNote}>
              <Ionicons name="shield-checkmark" size={16} color={theme.colors.primary} />
              <Text style={styles.codNoteText}>
                Pay with Cash on Delivery when you receive your package.
              </Text>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.extrabold,
    color: theme.colors.text,
  },
  itemCountText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearBtnText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 24,
  },
  inlineCheckoutBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.md,
  },
  inlineCheckoutBtnText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.extrabold,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.md,
    ...theme.shadows.sm,
  },
  summaryTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.primary,
  },
  codNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    gap: 8,
    marginTop: theme.spacing.md,
  },
  codNoteText: {
    fontSize: 11,
    color: theme.colors.primary,
    flex: 1,
    fontWeight: theme.typography.fontWeight.medium,
  },
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  priceCol: {
    flex: 1,
  },
  barLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  barPrice: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.primary,
  },
  checkoutBtn: {
    flex: 1.2,
  },
});
