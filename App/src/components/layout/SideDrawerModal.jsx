// Side Drawer / Navigation Menu - Matching Screen 14 with Permission Handling
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { theme } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

export default function SideDrawerModal({ visible, onClose }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, isStaff, logout } = useAuth();
  const { totalItems } = useCart();

  const fullName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Tanbir Hasan'
    : 'Guest Shopper';
  const email = user?.email || (isAuthenticated ? 'user@kidsandfamily.com' : 'Sign in to access your bag & orders');

  const navigateTo = (path) => {
    onClose();
    router.push(path);
  };

  const handleLogout = () => {
    onClose();
    Alert.alert('Sign Out', 'Are you sure you want to log out from this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop Pressable */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Drawer Panel */}
        <View
          style={[
            styles.drawer,
            {
              paddingTop: Math.max(insets.top, 24) + 12,
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            },
          ]}
        >
          {/* Top User Card */}
          <View style={styles.drawerHeader}>
            <TouchableOpacity
              style={styles.avatarRow}
              activeOpacity={0.8}
              onPress={() => navigateTo(isAuthenticated ? '/(tabs)/profile' : '/login')}
            >
              <View style={[styles.avatarCircle, isStaff && styles.avatarCircleStaff]}>
                <Ionicons
                  name={isStaff ? 'shield-checkmark' : 'person'}
                  size={24}
                  color={theme.colors.white}
                />
              </View>
              <View style={styles.userInfo}>
                <View style={styles.nameBadgeRow}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {fullName}
                  </Text>
                  {isStaff && (
                    <View style={styles.staffTag}>
                      <Text style={styles.staffTagText}>STAFF</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {email}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={22} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerDivider} />

          {/* Menu Items List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuList}
          >
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => navigateTo('/(tabs)')}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="home-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.menuLabel}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => navigateTo('/(tabs)/categories')}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="grid-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.menuLabel}>Categories</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => navigateTo('/(tabs)/cart')}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="bag-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.menuLabel}>Cart</Text>
              {totalItems > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalItems}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => navigateTo('/orders')}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.menuLabel}>My Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => navigateTo('/wishlist')}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="heart-outline" size={20} color="#e11d48" />
              </View>
              <Text style={styles.menuLabel}>Wishlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => navigateTo('/ai')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons name="sparkles" size={18} color="#9333ea" />
              </View>
              <Text style={styles.menuLabel}>AI Assistant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => navigateTo('/(tabs)/profile')}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.menuLabel}>My Profile</Text>
            </TouchableOpacity>

            {/* Admin Dashboard: Prominently featured for Staff */}
            {isStaff ? (
              <TouchableOpacity
                style={[styles.menuItem, styles.adminMenuItem]}
                activeOpacity={0.7}
                onPress={() => navigateTo('/admin')}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="speedometer-outline" size={18} color="#b45309" />
                </View>
                <Text style={[styles.menuLabel, { fontWeight: '700', color: '#b45309' }]}>
                  Admin Dashboard
                </Text>
                <View style={styles.staffTag}>
                  <Text style={styles.staffTagText}>STAFF</Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => navigateTo('/welcome')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="compass-outline" size={20} color="#16a34a" />
              </View>
              <Text style={styles.menuLabel}>Welcome Tour</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                Alert.alert(
                  'Help & Support',
                  'Customer Hotline: 01700000000\nWhatsApp: 01700000000\nEmail: support@kidsandfamily.com'
                );
              }}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="headset-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.menuLabel}>Help & Support</Text>
            </TouchableOpacity>

            {isAuthenticated ? (
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={handleLogout}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#fee2e2' }]}>
                  <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                </View>
                <Text style={[styles.menuLabel, { color: '#ef4444' }]}>Logout</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => navigateTo('/login')}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#ede9fe' }]}>
                  <Ionicons name="log-in-outline" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.menuLabel, { color: theme.colors.primary }]}>Login / Register</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Bottom Branding Pill Footer (Matching Figma Screen 14) */}
          <View style={styles.brandFooter}>
            <View style={styles.brandIconCircle}>
              <Ionicons name="sparkles" size={18} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.brandFooterTitle}>Kids & Family</Text>
              <Text style={styles.brandFooterSub}>Shop Smart, Grow Happy</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ede9fe',
  },
  avatarCircleStaff: {
    backgroundColor: '#b45309',
    borderColor: '#fef3c7',
  },
  userInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e1b4b',
    flexShrink: 1,
  },
  staffTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  staffTagText: {
    color: '#b45309',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 8,
  },
  menuList: {
    paddingVertical: 4,
    gap: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  adminMenuItem: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1e1b4b',
  },
  cartBadge: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  brandFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 12,
    marginTop: 12,
  },
  brandIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandFooterTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  brandFooterSub: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
});
