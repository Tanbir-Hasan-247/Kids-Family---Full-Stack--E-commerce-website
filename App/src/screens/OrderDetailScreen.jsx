import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderApi } from '../api/orderApi';
import { formatImageUrl } from '../utils/imageHelper';
import { formatPrice } from '../utils/currency';
import { theme } from '../constants/theme';
import Header from '../components/common/Header';
import Badge from '../components/common/Badge';
import OrderStatusStepper from '../components/order/OrderStatusStepper';
import AppBottomNav from '../components/layout/AppBottomNav';

export default function OrderDetailScreen() {
  const { orderNumber } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchOrder = async () => {
      try {
        let data = null;
        try {
          data = await orderApi.getOrderDetail(orderNumber);
        } catch {
          // Fallback to tracking query for guests
          const trackRes = await orderApi.trackOrder(orderNumber);
          const list = trackRes?.orders || [];
          data = list.find((o) => o.order_number === orderNumber) || list[0];
        }

        if (isMounted && data) {
          setOrder(data);
        }
      } catch (err) {
        console.warn('Failed to load order detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [orderNumber]);

  const handleCallSupport = () => {
    Linking.openURL('tel:01700000000').catch(() => {
      Alert.alert('Customer Care', 'Please call our hotline: 01700000000');
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Order Details" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Order Details" />
        <View style={styles.centerContainer}>
          <Text style={styles.notFoundText}>Order #{orderNumber} not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = parseFloat(order.subtotal || order.total_amount || 0);
  const shippingFee = parseFloat(order.shipping_fee || 0);
  const total = parseFloat(order.total_amount || 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title={`Order #${order.order_number}`} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order Header Card */}
        <View style={styles.card}>
          <View style={styles.orderHeaderRow}>
            <View>
              <Text style={styles.orderNumber}>#{order.order_number}</Text>
              <Text style={styles.orderDate}>
                {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Recent order'}
              </Text>
            </View>
            <Badge
              text={order.status || 'Pending'}
              variant={
                order.status === 'delivered'
                  ? 'success'
                  : order.status === 'cancelled'
                  ? 'error'
                  : 'default'
              }
            />
          </View>

          {/* Stepper */}
          <OrderStatusStepper status={order.status} />
        </View>

        {/* Shipping Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Delivery Details</Text>

          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>{order.full_name || 'Customer'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>{order.phone}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>
              {order.address_line}, {order.city}
            </Text>
          </View>
        </View>

        {/* Ordered Items List */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Ordered Outfits ({items.length})</Text>

          {items.map((item, idx) => {
            const imgUrl = formatImageUrl(item.product_image || item.variant?.image);
            const itemPrice = parseFloat(item.price || 0);
            const qty = item.quantity || 1;

            return (
              <View key={item.id || idx} style={styles.itemRow}>
                <View style={styles.itemImageWrapper}>
                  {imgUrl ? (
                    <Image
                      source={{ uri: imgUrl }}
                      style={styles.itemImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.itemImageFallback}>
                      <Ionicons name="shirt-outline" size={20} color={theme.colors.textMuted} />
                    </View>
                  )}
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.product_name || 'Family Outfit'}
                  </Text>
                  {item.variant_name ? (
                    <Text style={styles.itemVariant}>{item.variant_name}</Text>
                  ) : null}
                  <Text style={styles.itemQtyPrice}>
                    {formatPrice(itemPrice)} × {qty}
                  </Text>
                </View>

                <Text style={styles.itemTotal}>{formatPrice(itemPrice * qty)}</Text>
              </View>
            );
          })}
        </View>

        {/* Payment & Financial Summary */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Payment Breakdown</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>{formatPrice(subtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping Fee</Text>
            <Text style={styles.summaryVal}>{formatPrice(shippingFee)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total (Cash on Delivery)</Text>
            <Text style={styles.totalVal}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Support Help Button */}
        <TouchableOpacity style={styles.supportBtn} onPress={handleCallSupport}>
          <Ionicons name="headset-outline" size={20} color={theme.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.supportTitle}>Need Help with this Order?</Text>
            <Text style={styles.supportSub}>Tap here to speak with customer support</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textMuted,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  orderNumber: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.text,
  },
  orderDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  cardHeading: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  detailText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text,
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 12,
  },
  itemImageWrapper: {
    width: 52,
    height: 64,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImageFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  itemVariant: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  itemQtyPrice: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  summaryVal: {
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
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  totalVal: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.primary,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
    ...theme.shadows.sm,
  },
  supportTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  supportSub: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});
