// Unified Bottom Navigation Bar - Kids & Family Design (Matching Figma Mockup)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { useShopSettings } from '../../context/ShopSettingsContext';
import { theme } from '../../constants/theme';

export default function AppBottomNav({ currentRoute = null }) {
  const router = useRouter();
  const rawPathname = usePathname();
  const pathname = currentRoute || rawPathname || '';
  const insets = useSafeAreaInsets();
  const { totalItems } = useCart();
  const { settings } = useShopSettings();

  const [showSupportModal, setShowSupportModal] = useState(false);

  const phone = settings?.phone || '+8801700000000';
  const whatsapp = settings?.whatsapp_number || settings?.phone || '+8801700000000';
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const cleanWa = whatsapp.replace(/[^0-9]/g, '');

  const isHomeActive =
    pathname === '/' ||
    pathname === '' ||
    pathname === '/(tabs)' ||
    pathname === '/(tabs)/index' ||
    pathname === '/index';

  const isCategoriesActive =
    pathname.includes('categories') ||
    (pathname.startsWith('/products') && !pathname.includes('[id]'));

  const isCartActive = pathname.includes('cart');

  const isProfileActive =
    pathname.includes('profile') ||
    pathname.includes('login') ||
    pathname.includes('register') ||
    pathname.startsWith('/orders') ||
    pathname.includes('order-success');

  const handleCall = () => {
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      'আসসালামু আলাইকুম! আমি Kids & Family মোবাইল অ্যাপ থেকে প্রোডাক্ট ও অর্ডার সংক্রান্ত তথ্য জানতে যোগাযোগ করছি।'
    );
    const waUrl = `https://wa.me/${cleanWa}?text=${text}`;
    Linking.openURL(waUrl).catch(() => {});
  };

  return (
    <>
      <View
        style={[
          styles.navBar,
          {
            paddingBottom: Math.max(insets.bottom, 6),
            height: 60 + Math.max(insets.bottom, 6),
          },
        ]}
      >
        <View style={styles.navRow}>
          {/* 1. Home */}
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)')}
          >
            <View style={styles.iconWrapper}>
              <Ionicons
                name={isHomeActive ? 'home' : 'home-outline'}
                size={23}
                color={isHomeActive ? theme.colors.primary : '#9ca3af'}
              />
            </View>
            <Text style={[styles.navLabel, isHomeActive && styles.navLabelActive]}>
              Home
            </Text>
          </TouchableOpacity>

          {/* 2. Categories */}
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/categories')}
          >
            <View style={styles.iconWrapper}>
              <Ionicons
                name={isCategoriesActive ? 'grid' : 'grid-outline'}
                size={22}
                color={isCategoriesActive ? theme.colors.primary : '#9ca3af'}
              />
            </View>
            <Text style={[styles.navLabel, isCategoriesActive && styles.navLabelActive]}>
              Categories
            </Text>
          </TouchableOpacity>

          {/* 3. Cart */}
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/cart')}
          >
            <View style={styles.iconWrapper}>
              <Ionicons
                name={isCartActive ? 'bag' : 'bag-outline'}
                size={23}
                color={isCartActive ? theme.colors.primary : '#9ca3af'}
              />
              {totalItems > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {totalItems > 99 ? '99+' : totalItems}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.navLabel, isCartActive && styles.navLabelActive]}>
              Cart
            </Text>
          </TouchableOpacity>

          {/* 4. Profile / Account */}
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.iconWrapper}>
              <Ionicons
                name={isProfileActive ? 'person' : 'person-outline'}
                size={23}
                color={isProfileActive ? theme.colors.primary : '#9ca3af'}
              />
            </View>
            <Text style={[styles.navLabel, isProfileActive && styles.navLabelActive]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Helpline Modal */}
      <Modal
        visible={showSupportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSupportModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSupportModal(false)}
        >
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.phoneIconBadge}>
                  <Ionicons name="call" size={18} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Customer Support</Text>
                  <Text style={styles.modalSubtitle}>Order or inquire via call or WhatsApp</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowSupportModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.callButton}
                activeOpacity={0.85}
                onPress={handleCall}
              >
                <Ionicons name="call" size={20} color={theme.colors.white} />
                <Text style={styles.callButtonText}>Direct Call ({phone})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.waButton}
                activeOpacity={0.85}
                onPress={handleWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={22} color={theme.colors.white} />
                <Text style={styles.waButtonText}>Chat on WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  navBar: {
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: '#ede9fe',
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrapper: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  navLabelActive: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: theme.colors.sale,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.white,
  },
  cartBadgeText: {
    color: theme.colors.white,
    fontSize: 9,
    fontWeight: '900',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
    ...theme.shadows.lg,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phoneIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.text,
  },
  modalSubtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  actionButtons: {
    gap: 12,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 10,
  },
  callButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  waButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 10,
  },
  waButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
