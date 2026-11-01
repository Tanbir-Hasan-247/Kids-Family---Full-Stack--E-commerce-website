import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useShopSettings } from '../context/ShopSettingsContext';
import { orderApi } from '../api/orderApi';
import { formatPrice } from '../utils/currency';
import { formatImageUrl } from '../utils/imageHelper';
import { theme } from '../constants/theme';
import Header from '../components/common/Header';
import CustomButton from '../components/common/CustomButton';
import AppBottomNav from '../components/layout/AppBottomNav';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomNavHeight = 60 + Math.max(insets.bottom, 6);
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { settings } = useShopSettings();

  const feeInside = Number(settings?.delivery_inside_dhaka ?? 60);
  const feeOutside = Number(settings?.delivery_outside_dhaka ?? 120);

  const [deliveryZone, setDeliveryZone] = useState('inside_dhaka');
  const [fullName, setFullName] = useState(
    user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : ''
  );
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [notes, setNotes] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(!user?.address);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(`${user.first_name || ''} ${user.last_name || ''}`.trim());
      if (!phone && user.phone) setPhone(user.phone);
      if (!address && user.address) setAddress(user.address);
    }
  }, [user]);

  const subtotal = parseFloat(totalPrice) || 0;
  const shippingFee = deliveryZone === 'inside_dhaka' ? feeInside : feeOutside;
  const grandTotal = subtotal + shippingFee;

  const handlePlaceOrder = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 11) {
      Alert.alert('Invalid Phone', 'Please enter a valid 11-digit mobile number (e.g. 01712345678).');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Required Field', 'Please enter your complete delivery address.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        phone: cleanPhone,
        email: user?.email || '',
        address_line: address.trim(),
        city: deliveryZone === 'inside_dhaka' ? 'Dhaka' : 'Outside Dhaka',
        notes: notes.trim(),
        payment_method: 'cod',
        shipping_fee: shippingFee,
      };

      const res = await orderApi.checkout(payload);

      if (res && (res.success || res.order)) {
        const orderData = res.order || res;
        await clearCart();

        router.replace({
          pathname: `/order-success/${orderData.order_number}`,
          params: {
            orderNumber: orderData.order_number,
            total: grandTotal.toString(),
            phone: cleanPhone,
          },
        });
      } else {
        Alert.alert('Checkout Failed', res?.message || 'Could not place your order. Please retry.');
      }
    } catch (err) {
      console.warn('Checkout error:', err);
      Alert.alert(
        'Submission Error',
        err.response?.data?.message || err.message || 'Network error occurred during checkout.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Checkout" />

      {/* 3-Step Checkout Stepper (Matching Figma Screen 10) */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, styles.stepCircleActive]}>
            <Ionicons name="checkmark" size={13} color={theme.colors.white} />
          </View>
          <Text style={[styles.stepLabel, styles.stepLabelActive]}>Address</Text>
        </View>

        <View style={styles.stepLineActive} />

        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, styles.stepCircleActive]}>
            <Ionicons name="checkmark" size={13} color={theme.colors.white} />
          </View>
          <Text style={[styles.stepLabel, styles.stepLabelActive]}>Payment</Text>
        </View>

        <View style={styles.stepLineActive} />

        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, styles.stepCircleActive]}>
            <Ionicons name="checkmark" size={13} color={theme.colors.white} />
          </View>
          <Text style={[styles.stepLabel, styles.stepLabelActive]}>Confirm</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 + bottomNavHeight }]}
        >
          {/* Delivery Address Card (Matching Figma Screen 10) */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeading}>Delivery Address</Text>
              <TouchableOpacity
                onPress={() => setIsEditingAddress(!isEditingAddress)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.changeBtnText}>
                  {isEditingAddress ? 'Done' : 'Change'}
                </Text>
              </TouchableOpacity>
            </View>

            {!isEditingAddress && address ? (
              <View style={styles.savedAddressRow}>
                <View style={styles.addressIconCircle}>
                  <Ionicons name="home" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.addressTextCol}>
                  <Text style={styles.savedName}>{fullName || 'Customer'}</Text>
                  <Text style={styles.savedAddress}>{address}</Text>
                  <Text style={styles.savedPhone}>{phone}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.formFields}>
                <View style={styles.field}>
                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Tanbir Hasan"
                    placeholderTextColor={theme.colors.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Mobile Phone Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="017XXXXXXXX"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Delivery Address *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="House, Road, Area, Ward/Thana..."
                    placeholderTextColor={theme.colors.textMuted}
                    multiline
                    numberOfLines={3}
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Order Note (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Special delivery instructions..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Delivery Location Selection */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Delivery Zone</Text>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.zoneOption,
                deliveryZone === 'inside_dhaka' && styles.zoneOptionActive,
              ]}
              onPress={() => setDeliveryZone('inside_dhaka')}
            >
              <View style={styles.zoneLeft}>
                <Ionicons
                  name={deliveryZone === 'inside_dhaka' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={deliveryZone === 'inside_dhaka' ? theme.colors.primary : theme.colors.textMuted}
                />
                <View>
                  <Text style={styles.zoneTitle}>Inside Dhaka</Text>
                  <Text style={styles.zoneSub}>Delivered within 24-48 hours</Text>
                </View>
              </View>
              <Text style={styles.zoneFee}>{formatPrice(feeInside)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.zoneOption,
                deliveryZone === 'outside_dhaka' && styles.zoneOptionActive,
              ]}
              onPress={() => setDeliveryZone('outside_dhaka')}
            >
              <View style={styles.zoneLeft}>
                <Ionicons
                  name={deliveryZone === 'outside_dhaka' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={deliveryZone === 'outside_dhaka' ? theme.colors.primary : theme.colors.textMuted}
                />
                <View>
                  <Text style={styles.zoneTitle}>Outside Dhaka</Text>
                  <Text style={styles.zoneSub}>Delivered within 2-4 days</Text>
                </View>
              </View>
              <Text style={styles.zoneFee}>{formatPrice(feeOutside)}</Text>
            </TouchableOpacity>
          </View>

          {/* Payment Method */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Payment Method</Text>
            <View style={styles.paymentCard}>
              <Ionicons name="cash-outline" size={24} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                <Text style={styles.paymentSub}>Pay safely when you receive your package.</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
            </View>
          </View>

          {/* Order Summary with Mini Items (Matching Figma Screen 10) */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Order Summary</Text>

            {items.map((it) => {
              const rawImg = it.variant?.image || it.image || it.product_image || it.thumbnail;
              const imgUrl = formatImageUrl(rawImg);
              const uPrice = parseFloat(it.variant?.price || it.price || 0);
              const variantAttrs = Array.isArray(it.variant?.attributes) ? it.variant.attributes : [];
              const variantDesc = variantAttrs.map((a) => a.name || a.value).filter(Boolean).join(' • ');

              return (
                <View key={it.id} style={styles.miniItemRow}>
                  {imgUrl ? (
                    <Image source={{ uri: imgUrl }} style={styles.miniItemImage} contentFit="cover" />
                  ) : (
                    <View style={styles.miniItemFallback}>
                      <Ionicons name="shirt-outline" size={16} color={theme.colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.miniItemInfo}>
                    <Text style={styles.miniItemName} numberOfLines={1}>
                      {it.product_name || it.variant?.product_name || 'Product'}
                    </Text>
                    {variantDesc ? (
                      <Text style={styles.miniItemDesc}>{variantDesc}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.miniItemPrice}>
                    {it.quantity} × {formatPrice(uPrice)}
                  </Text>
                </View>
              );
            })}

            <View style={styles.divider} />

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
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalVal}>{formatPrice(grandTotal)}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Confirm Order Button (sitting right above AppBottomNav) */}
      <View style={[styles.stickyFooter, { bottom: bottomNavHeight }]}>
        <CustomButton
          title={`Place Order →  ${formatPrice(grandTotal)}`}
          variant="primary"
          icon="shield-checkmark"
          loading={submitting}
          onPress={handlePlaceOrder}
        />
      </View>

      {/* Persistent Bottom Navigation - ALWAYS VISIBLE */}
      <AppBottomNav currentRoute="/cart" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: theme.colors.primary,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  stepLabelActive: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  stepLineActive: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.primary,
    marginHorizontal: 8,
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardHeading: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  changeBtnText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  savedAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#faf5ff',
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  addressIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTextCol: {
    flex: 1,
    gap: 2,
  },
  savedName: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
  },
  savedAddress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 17,
  },
  savedPhone: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 2,
  },
  formFields: {
    gap: theme.spacing.xs,
  },
  field: {
    marginBottom: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text,
  },
  textArea: {
    height: 70,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  zoneOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
  zoneOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#faf5ff',
  },
  zoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zoneTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  zoneSub: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  zoneFee: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.extrabold,
    color: theme.colors.primary,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#faf5ff',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  paymentTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  paymentSub: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  miniItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  miniItemImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceMuted,
  },
  miniItemFallback: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniItemInfo: {
    flex: 1,
  },
  miniItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  miniItemDesc: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  miniItemPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: theme.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
  totalLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  totalVal: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.primary,
  },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.lg,
    zIndex: 90,
  },
});
