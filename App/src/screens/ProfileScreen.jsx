import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useShopSettings } from '../context/ShopSettingsContext';
import { authApi } from '../api/authApi';
import { wishlistApi } from '../api/wishlistApi';
import { theme } from '../constants/theme';
import AppBottomNav from '../components/layout/AppBottomNav';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, isStaff, logout, updateProfile, changePassword } = useAuth();
  const { totalItems } = useCart();
  const { settings } = useShopSettings();

  const [metrics, setMetrics] = useState({
    ordersCount: 0,
    pendingCount: 0,
    wishlistCount: 0,
  });

  // Modal States
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressLine, setAddressLine] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (user) {
      setEditFirstName(user.first_name || '');
      setEditLastName(user.last_name || '');
      setEditPhone(user.phone || '');
      setEditAddress(user.address || '');
      setAddressLine(user.address || '');
      setAddressPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const loadMetrics = async () => {
      try {
        if (isAuthenticated) {
          const summary = await authApi.getDashboardSummary();
          if (isMounted && summary) {
            setMetrics({
              ordersCount: summary.total_orders || 0,
              pendingCount: summary.pending_orders || 0,
              wishlistCount: summary.wishlist_count || 0,
            });
            return;
          }
        }

        // Guest fallback: check wishlist
        const wData = await wishlistApi.getWishlist();
        const count = wData?.count || (Array.isArray(wData?.items) ? wData.items.length : 0);
        if (isMounted) {
          setMetrics((prev) => ({ ...prev, wishlistCount: count }));
        }
      } catch (err) {
        console.warn('Failed to load user metrics:', err);
      }
    };

    loadMetrics();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const phone = settings?.phone || '+8801700000000';
  const cleanPhone = phone.replace(/[^0-9+]/g, '');

  const handleLogout = () => {
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

  const handleCallHotline = () => {
    const whatsapp = settings?.whatsapp_number || phone;
    Alert.alert(
      'Kids & Family Customer Care',
      `Our team is happy to assist you daily from 10:00 AM - 8:00 PM.\n\nHotline: ${phone}\nWhatsApp: ${whatsapp}`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Call Hotline',
          onPress: () => Linking.openURL(`tel:${cleanPhone}`),
        },
        {
          text: 'Open WhatsApp',
          onPress: () => Linking.openURL(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`),
        },
      ]
    );
  };

  const handleAboutUs = () => {
    Alert.alert(
      settings?.shop_name || 'Kids & Family Bangladesh',
      `Welcome to Kids & Family!\n\n${settings?.tagline || 'Bangladesh’s leading premium family lifestyle brand'}.\n\n• 100% Combed Export Cotton\n• Matching Sibling & Family Sets\n• Cash on Delivery & 7-Day Free Exchange\n\nLocation: ${settings?.address || 'Dhaka, Bangladesh'}\nHotline: ${settings?.phone || '+8801700000000'}`
    );
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const res = await updateProfile({
      first_name: editFirstName.trim(),
      last_name: editLastName.trim(),
      phone: editPhone.trim(),
      address: editAddress.trim(),
    });
    setSavingProfile(false);
    if (res.success) {
      setShowEditProfile(false);
      Alert.alert('Success', 'Your profile information has been updated.');
    } else {
      Alert.alert('Update Failed', res.message || 'Could not update profile.');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('Required', 'Please enter your current and new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters.');
      return;
    }

    setSavingPassword(true);
    const res = await changePassword(oldPassword, newPassword);
    setSavingPassword(false);
    if (res.success) {
      setShowChangePassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Your password has been changed successfully!');
    } else {
      Alert.alert('Failed', res.message || 'Incorrect old password.');
    }
  };

  const handleSaveAddress = async () => {
    setSavingAddress(true);
    const res = await updateProfile({
      address: addressLine.trim(),
      phone: addressPhone.trim(),
    });
    setSavingAddress(false);
    if (res.success) {
      setShowAddressModal(false);
      Alert.alert('Success', 'Default delivery address updated.');
    } else {
      Alert.alert('Error', res.message || 'Failed to update address.');
    }
  };

  const fullName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email?.split('@')[0] || 'Valued Customer'
    : 'Guest Shopper';

  const userEmail = user?.email || (isAuthenticated ? 'user@kidsandfamily.com' : 'Not signed in');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Purple Gradient Card (Matching Figma Screen 13) */}
        <View style={[styles.headerCard, { paddingTop: Math.max(insets.top, 24) + 16 }]}>
          <View style={[styles.avatarBorder, isStaff && styles.avatarBorderStaff]}>
            <View style={[styles.avatarInner, isStaff && styles.avatarInnerStaff]}>
              <Ionicons
                name={isStaff ? 'shield-checkmark' : 'person'}
                size={38}
                color={theme.colors.white}
              />
            </View>
          </View>

          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>

          {/* Member Badge / Staff Badge */}
          <View style={styles.badgeRow}>
            {isStaff ? (
              <View style={styles.staffBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#b45309" />
                <Text style={styles.staffBadgeText}>Store Administrator</Text>
              </View>
            ) : (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color="#b45309" />
                <Text style={styles.premiumBadgeText}>Premium Member</Text>
              </View>
            )}
          </View>

          {/* Quick Stats Summary */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statBox}
              activeOpacity={0.8}
              onPress={() => router.push('/orders')}
            >
              <Text style={styles.statNumber}>{metrics.ordersCount}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statBox}
              activeOpacity={0.8}
              onPress={() => router.push('/orders')}
            >
              <Text style={styles.statNumber}>{metrics.pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statBox}
              activeOpacity={0.8}
              onPress={() => router.push('/wishlist')}
            >
              <Text style={styles.statNumber}>{metrics.wishlistCount}</Text>
              <Text style={styles.statLabel}>Wishlist</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Guest Authentication Callout */}
        {!isAuthenticated && (
          <View style={styles.guestBanner}>
            <View style={styles.guestBannerLeft}>
              <Text style={styles.guestBannerTitle}>Welcome to Kids & Family</Text>
              <Text style={styles.guestBannerSub}>Sign in to view orders, saved addresses & sync cart.</Text>
            </View>
            <TouchableOpacity
              style={styles.guestLoginBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.guestLoginBtnText}>Login</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu Items (Matching Figma Screen 13 & 14) */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => router.push('/orders')}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="bag-handle-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.menuTitle}>My Orders</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          {/* Edit Profile */}
          {isAuthenticated && (
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => setShowEditProfile(true)}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconCircle}>
                  <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                </View>
                <Text style={styles.menuTitle}>Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}

          {/* My Addresses */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => {
              if (isAuthenticated) {
                setShowAddressModal(true);
              } else {
                router.push('/checkout');
              }
            }}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.menuTitle}>Delivery Address</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => router.push('/wishlist')}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="heart-outline" size={18} color="#e11d48" />
              </View>
              <Text style={styles.menuTitle}>Wishlist</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          {/* AI Shopping Assistant (Matching Figma Screen 13) */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => router.push('/ai')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#ede9fe' }]}>
                <Ionicons name="sparkles" size={18} color="#8b5cf6" />
              </View>
              <Text style={styles.menuTitle}>AI Shopping Assistant</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          {/* Admin Dashboard: Prominently featured for Staff with explicit Permission Tag */}
          {isStaff ? (
            <TouchableOpacity
              style={[styles.menuRow, styles.adminRow]}
              activeOpacity={0.7}
              onPress={() => router.push('/admin')}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.menuIconCircle, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="speedometer-outline" size={18} color="#b45309" />
                </View>
                <View>
                  <Text style={[styles.menuTitle, { fontWeight: '700', color: '#b45309' }]}>
                    Admin Dashboard
                  </Text>
                  <Text style={styles.menuSub}>Sales analytics, orders & stock controls</Text>
                </View>
              </View>
              <View style={styles.staffTag}>
                <Text style={styles.staffTagText}>STAFF</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => router.push('/admin')}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.menuIconCircle, { backgroundColor: '#f1f5f9' }]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#64748b" />
                </View>
                <View>
                  <Text style={styles.menuTitle}>Admin Console</Text>
                  <Text style={styles.menuSub}>Staff login & access</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}

          {/* Change Password (for authenticated users) */}
          {isAuthenticated && (
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => setShowChangePassword(true)}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconCircle}>
                  <Ionicons name="key-outline" size={18} color={theme.colors.primary} />
                </View>
                <Text style={styles.menuTitle}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={handleCallHotline}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.menuTitle}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={handleAboutUs}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.menuTitle}>About Us</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          {/* Welcome Tour (Matching Figma Screen 2) */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => router.push('/welcome')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="compass-outline" size={18} color="#16a34a" />
              </View>
              <Text style={styles.menuTitle}>Welcome Tour</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Soft Pink/Red Logout Button (Matching Figma Screen 13) */}
        {isAuthenticated ? (
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.loginCardBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginCardBtnText}>Sign In / Register</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* 1. Edit Profile Modal */}
      <Modal visible={showEditProfile} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="First name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Last name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="017XXXXXXXX"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Default Address</Text>
                <TextInput
                  style={[styles.textInput, { height: 72 }]}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="House, Road, Area..."
                  multiline
                />
              </View>
              <TouchableOpacity
                style={styles.saveBtn}
                activeOpacity={0.85}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 2. Change Password Modal */}
      <Modal visible={showChangePassword} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.textInput}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Enter current password"
                secureTextEntry
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password (min 6 characters)</Text>
              <TextInput
                style={styles.textInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-type new password"
                secureTextEntry
              />
            </View>
            <TouchableOpacity
              style={styles.saveBtn}
              activeOpacity={0.85}
              onPress={handleChangePassword}
              disabled={savingPassword}
            >
              {savingPassword ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 3. My Addresses Modal */}
      <Modal visible={showAddressModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Delivery Address</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Complete Address (House, Road, Thana/Area, District)</Text>
              <TextInput
                style={[styles.textInput, { height: 80 }]}
                value={addressLine}
                onChangeText={setAddressLine}
                placeholder="e.g. 123/A, Uttara Sector 4, Dhaka-1230"
                multiline
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivery Contact Phone</Text>
              <TextInput
                style={styles.textInput}
                value={addressPhone}
                onChangeText={setAddressPhone}
                placeholder="017XXXXXXXX"
                keyboardType="phone-pad"
              />
            </View>
            <TouchableOpacity
              style={styles.saveBtn}
              activeOpacity={0.85}
              onPress={handleSaveAddress}
              disabled={savingAddress}
            >
              {savingAddress ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Delivery Address</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Persistent Bottom Navigation - ALWAYS VISIBLE */}
      <AppBottomNav currentRoute="/(tabs)/profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf9fd',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  avatarBorder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarBorderStaff: {
    borderColor: '#fde68a',
  },
  avatarInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#3b0764',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInnerStaff: {
    backgroundColor: '#78350f',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#ddd6fe',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  staffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  staffBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#b45309',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 11,
    color: '#ede9fe',
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ede9fe',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  guestBannerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  guestBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e1b4b',
  },
  guestBannerSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  guestLoginBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  guestLoginBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  menuContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f7fc',
  },
  adminRow: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    marginVertical: 4,
    borderBottomWidth: 0,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e1b4b',
  },
  menuSub: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifBadge: {
    backgroundColor: '#e11d48',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  staffTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  staffTagText: {
    color: '#b45309',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '800',
  },
  loginCardBtn: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  loginCardBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e1b4b',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1e1b4b',
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
