import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderApi } from '../api/orderApi';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/currency';
import { theme } from '../constants/theme';
import Header from '../components/common/Header';
import EmptyState from '../components/common/EmptyState';
import AppBottomNav from '../components/layout/AppBottomNav';

const STATUS_TABS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered'];

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trackQuery, setTrackQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const data = await orderApi.getOrders();
      const list = Array.isArray(data) ? data : data?.results || [];
      setOrders(list);
    } catch (err) {
      console.warn('Failed to load order history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleTrackSearch = async () => {
    if (!trackQuery.trim()) return;

    setSearching(true);
    try {
      const res = await orderApi.trackOrder(trackQuery.trim());
      const list = res?.orders || [];
      setOrders(list);
    } catch (err) {
      console.warn('Track search error:', err);
      setOrders([]);
    } finally {
      setSearching(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'All') return true;
    return (o.status || '').toLowerCase() === activeTab.toLowerCase();
  });

  const getStatusStyle = (status = '') => {
    const s = status.toLowerCase();
    if (s === 'delivered') {
      return { bg: '#ecfdf5', text: '#10b981', label: 'Delivered' };
    }
    if (s === 'processing' || s === 'confirmed') {
      return { bg: '#fef3c7', text: '#d97706', label: 'Processing' };
    }
    if (s === 'shipped') {
      return { bg: '#eff6ff', text: '#2563eb', label: 'Shipped' };
    }
    if (s === 'cancelled') {
      return { bg: '#ffe4e6', text: '#e11d48', label: 'Cancelled' };
    }
    return { bg: '#f5f3ff', text: '#8b5cf6', label: 'Pending' };
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="My Orders"
        rightComponent={
          <TouchableOpacity
            style={styles.searchHeaderBtn}
            onPress={() => setSearching(!searching)}
          >
            <Ionicons name="search" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs (Matching Figma Screen 11) */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab)}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
              >
                <Text
                  style={[styles.filterTabText, isActive && styles.filterTabTextActive]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order # or 11-digit phone..."
            placeholderTextColor={theme.colors.textMuted}
            value={trackQuery}
            onChangeText={setTrackQuery}
            onSubmitEditing={handleTrackSearch}
            returnKeyType="search"
          />
          {searching ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <TouchableOpacity onPress={handleTrackSearch} style={styles.searchBtn}>
              <Text style={styles.searchBtnText}>Track</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title={trackQuery ? 'No Orders Found' : 'No Orders in this Status'}
          message={
            trackQuery
              ? `No matching orders found for "${trackQuery}". Try your 11-digit mobile number or order ID.`
              : 'You do not have any orders matching this filter.'
          }
          actionLabel="Start Shopping"
          onAction={() => router.push('/products')}
        />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id?.toString() || item.order_number}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const total = parseFloat(item.total_amount || item.total || 0);
            const statusConfig = getStatusStyle(item.status);
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent Order';

            return (
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.orderCard}
                onPress={() => router.push(`/orders/${item.order_number}`)}
              >
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.orderNum}>#{item.order_number}</Text>
                    <Text style={styles.orderDate}>{dateStr}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: statusConfig.bg },
                    ]}
                  >
                    <Text style={[styles.statusPillText, { color: statusConfig.text }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardBottom}>
                  <Text style={styles.totalValue}>{formatPrice(total)}</Text>

                  <View style={styles.viewDetailsBtn}>
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={13} color={theme.colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

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
  searchHeaderBtn: {
    padding: 6,
  },
  tabsWrapper: {
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  tabsContainer: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  filterTabTextActive: {
    color: theme.colors.white,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    height: 42,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text,
  },
  searchBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  searchBtnText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 80,
    gap: theme.spacing.md,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNum: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.text,
  },
  orderDate: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: theme.spacing.md,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primary,
  },
});
