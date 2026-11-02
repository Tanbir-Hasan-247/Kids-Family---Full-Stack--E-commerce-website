// Administrative Command Center - Full-Stack Mobile ERP & Store Management
// Modules: Overview Analytics, Products Catalog CRUD, Category Hierarchy CRUD,
// Orders Fulfillment & Transitions, Hero Sliders & Promo Banners CRUD, Store Settings.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Switch,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/dashboardApi';
import { orderApi } from '../api/orderApi';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import { bannerApi } from '../api/bannerApi';
import { aiApi } from '../api/aiApi';
import { formatPrice } from '../utils/currency';
import { formatProductImageUrl, formatImageUrl } from '../utils/imageHelper';
import { API_BASE_URL } from '../constants/config';
import { theme } from '../constants/theme';
import Header from '../components/common/Header';
import AppBottomNav from '../components/layout/AppBottomNav';

const { width } = Dimensions.get('window');

const ADMIN_MAIN_TABS = [
  { key: 'overview', label: 'Overview', icon: 'stats-chart' },
  { key: 'products', label: 'Products', icon: 'shirt' },
  { key: 'categories', label: 'Categories', icon: 'grid' },
  { key: 'orders', label: 'Orders', icon: 'receipt' },
  { key: 'banners', label: 'Banners', icon: 'images' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

const ORDER_STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function AdminScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isStaff, login } = useAuth();

  // Active top navigation tab
  const [adminTab, setAdminTab] = useState('overview');

  // Loading & refreshing
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Overview & Analytics State
  const [stats, setStats] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [lowStockItems, setLowStockItems] = useState([]);

  // 2. Orders State
  const [orders, setOrders] = useState([]);
  const [selectedStatusTab, setSelectedStatusTab] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null);
  const [newStatus, setNewStatus] = useState('pending');
  const [newPaymentStatus, setNewPaymentStatus] = useState('pending');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // 3. Products Management State
  const [adminProducts, setAdminProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);

  // Product Form Fields
  const [prodFormName, setProdFormName] = useState('');
  const [prodFormCatId, setProdFormCatId] = useState('');
  const [prodFormBasePrice, setProdFormBasePrice] = useState('');
  const [prodFormStock, setProdFormStock] = useState('10');
  const [prodFormSku, setProdFormSku] = useState('');
  const [prodFormDesc, setProdFormDesc] = useState('');
  const [prodFormIsActive, setProdFormIsActive] = useState(true);

  // 4. Categories Management State
  const [adminCategories, setAdminCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [savingCat, setSavingCat] = useState(false);
  const [catFormName, setCatFormName] = useState('');
  const [catFormSlug, setCatFormSlug] = useState('');
  const [catFormParent, setCatFormParent] = useState('');

  // 5. Promotions, Sliders & Banners State
  const [adminBanners, setAdminBanners] = useState([]);
  const [adminSliders, setAdminSliders] = useState([]);
  const [bannerSubTab, setBannerSubTab] = useState('sliders'); // 'sliders' | 'banners'
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerModalType, setBannerModalType] = useState('slider'); // 'slider' | 'banner'
  const [savingBanner, setSavingBanner] = useState(false);
  const [togglingBannerId, setTogglingBannerId] = useState(null);

  // Banner / Slider Form Fields
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerBadge, setBannerBadge] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerLink, setBannerLink] = useState('/products');
  const [bannerCta, setBannerCta] = useState('Shop now');
  const [bannerOrder, setBannerOrder] = useState('0');
  const [bannerImageUrl, setBannerImageUrl] = useState('');

  // 6. Shop Settings State
  const [shopSettings, setShopSettings] = useState({
    shop_name: 'Kids & Family',
    delivery_inside_dhaka: '60',
    delivery_outside_dhaka: '120',
    phone: '',
    whatsapp_number: '',
    address: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // 7. AI Generator Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiProdName, setAiProdName] = useState('');
  const [aiCatName, setAiCatName] = useState('');
  const [aiFeatures, setAiFeatures] = useState('');
  const [aiGeneratedText, setAiGeneratedText] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // 8. Staff Authentication Fallback Form
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  // -------------------------------------------------------------
  // DATA FETCHING & SYNCHRONIZATION
  // -------------------------------------------------------------
  const fetchAllAdminData = useCallback(async () => {
    if (!isStaff) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [
        statsRes,
        notifRes,
        ordersRes,
        lowStockRes,
        settingsRes,
        productsRes,
        categoriesRes,
        bannersRes,
        slidersRes,
      ] = await Promise.allSettled([
        dashboardApi.getStats(),
        dashboardApi.getNotificationCount(),
        orderApi.getAdminOrders({
          status: selectedStatusTab !== 'all' ? selectedStatusTab : undefined,
          q: orderSearchQuery.trim() || undefined,
        }),
        dashboardApi.getLowStockAlert(5),
        dashboardApi.getShopSettings(),
        productApi.getProducts({ all: true, include_inactive: true }),
        categoryApi.getCategories(true),
        bannerApi.getAllBanners(),
        bannerApi.getAllSliders(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value);
      }
      if (notifRes.status === 'fulfilled' && notifRes.value) {
        setNotificationCount(
          notifRes.value?.pending_orders_count ??
          notifRes.value?.count ??
          notifRes.value?.unread ??
          0
        );
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value) {
        setOrders(ordersRes.value);
      }
      if (lowStockRes.status === 'fulfilled' && lowStockRes.value?.items) {
        setLowStockItems(lowStockRes.value.items);
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value) {
        const s = settingsRes.value;
        setShopSettings({
          shop_name: s.shop_name || 'Kids & Family',
          delivery_inside_dhaka: String(s.delivery_inside_dhaka ?? '60'),
          delivery_outside_dhaka: String(s.delivery_outside_dhaka ?? '120'),
          phone: s.phone || '',
          whatsapp_number: s.whatsapp_number || '',
          address: s.address || '',
        });
      }
      if (productsRes.status === 'fulfilled' && productsRes.value) {
        const pData = Array.isArray(productsRes.value)
          ? productsRes.value
          : productsRes.value?.results || [];
        setAdminProducts(pData);
      }
      if (categoriesRes.status === 'fulfilled' && categoriesRes.value) {
        const cData = Array.isArray(categoriesRes.value)
          ? categoriesRes.value
          : categoriesRes.value?.results || [];
        setAdminCategories(cData);
      }
      if (bannersRes.status === 'fulfilled' && bannersRes.value) {
        setAdminBanners(bannersRes.value);
      }
      if (slidersRes.status === 'fulfilled' && slidersRes.value) {
        setAdminSliders(slidersRes.value);
      }
    } catch (err) {
      console.warn('Dashboard fetch notice:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isStaff, selectedStatusTab, orderSearchQuery]);

  useEffect(() => {
    fetchAllAdminData();
  }, [fetchAllAdminData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllAdminData();
  }, [fetchAllAdminData]);

  // -------------------------------------------------------------
  // PRODUCT MANAGEMENT ACTIONS
  // -------------------------------------------------------------
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdFormName('');
    setProdFormCatId(adminCategories[0]?.id ? String(adminCategories[0].id) : '');
    setProdFormBasePrice('');
    setProdFormStock('10');
    setProdFormSku('');
    setProdFormDesc('');
    setProdFormIsActive(true);
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProdFormName(prod.name || '');
    setProdFormCatId(prod.category ? String(prod.category.id || prod.category) : '');
    setProdFormBasePrice(String(prod.base_price || prod.starting_price || ''));
    setProdFormStock(String(prod.total_stock ?? prod.stock ?? '10'));
    setProdFormSku(prod.sku || '');
    setProdFormDesc(prod.description || '');
    setProdFormIsActive(prod.is_active !== false);
    setShowProductModal(true);
  };

  const handleSaveProductSubmit = async () => {
    if (!prodFormName.trim()) {
      Alert.alert('Validation Error', 'Please enter a product name.');
      return;
    }
    const priceNum = parseFloat(prodFormBasePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid base price (e.g. 750).');
      return;
    }

    setSavingProduct(true);
    try {
      const payload = {
        name: prodFormName.trim(),
        base_price: priceNum,
        description: prodFormDesc.trim(),
        is_active: prodFormIsActive,
      };
      if (prodFormCatId) {
        payload.category = parseInt(prodFormCatId, 10);
      }

      if (editingProduct) {
        const updated = await productApi.updateProduct(editingProduct.id, payload);
        setAdminProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...updated } : p))
        );
        Alert.alert('Success', 'Product updated successfully!');
      } else {
        const created = await productApi.createProduct(payload);
        // Also create an initial variant if stock provided
        const initialStock = parseInt(prodFormStock, 10) || 10;
        try {
          await productApi.createVariant({
            product: created.id,
            price: priceNum,
            stock: initialStock,
            sku: prodFormSku.trim() || `KF-${created.id}-DEF`,
            is_active: true,
          });
        } catch (vErr) {
          console.warn('Initial variant creation note:', vErr?.message);
        }
        setAdminProducts((prev) => [created, ...prev]);
        Alert.alert('Success', 'Product created successfully!');
      }

      setShowProductModal(false);
      fetchAllAdminData();
    } catch (err) {
      Alert.alert(
        'Product Error',
        err.response?.data?.detail ||
          err.response?.data?.name?.[0] ||
          'Failed to save product. Please check required fields.'
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = (productId, productName) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingProductId(productId);
            try {
              await productApi.deleteProduct(productId);
              setAdminProducts((prev) => prev.filter((p) => p.id !== productId));
              Alert.alert('Success', 'Product removed successfully.');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.detail || 'Failed to delete product.');
            } finally {
              setDeletingProductId(null);
            }
          },
        },
      ]
    );
  };

  // -------------------------------------------------------------
  // CATEGORY MANAGEMENT ACTIONS
  // -------------------------------------------------------------
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatFormName('');
    setCatFormSlug('');
    setCatFormParent('');
    setShowCatModal(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatFormName(cat.name || '');
    setCatFormSlug(cat.slug || '');
    setCatFormParent(cat.parent ? String(cat.parent) : '');
    setShowCatModal(true);
  };

  const handleSaveCategorySubmit = async () => {
    if (!catFormName.trim()) {
      Alert.alert('Validation Error', 'Please enter category name.');
      return;
    }

    setSavingCat(true);
    try {
      const payload = {
        name: catFormName.trim(),
        slug: catFormSlug.trim() || catFormName.trim().toLowerCase().replace(/\s+/g, '-'),
      };
      if (catFormParent) {
        payload.parent = parseInt(catFormParent, 10);
      }

      if (editingCategory) {
        const updated = await categoryApi.updateCategory(editingCategory.id, payload);
        setAdminCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, ...updated } : c))
        );
        Alert.alert('Success', 'Category updated successfully!');
      } else {
        const created = await categoryApi.createCategory(payload);
        setAdminCategories((prev) => [...prev, created]);
        Alert.alert('Success', 'Category created successfully!');
      }

      setShowCatModal(false);
      fetchAllAdminData();
    } catch (err) {
      Alert.alert(
        'Category Error',
        err.response?.data?.detail ||
          err.response?.data?.name?.[0] ||
          'Failed to save category.'
      );
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = (catId, catName) => {
    Alert.alert(
      'Delete Category',
      `Delete "${catName}"? Products in this category will become unassigned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await categoryApi.deleteCategory(catId);
              setAdminCategories((prev) => prev.filter((c) => c.id !== catId));
              Alert.alert('Success', 'Category deleted successfully.');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.detail || 'Failed to delete category.');
            }
          },
        },
      ]
    );
  };

  // -------------------------------------------------------------
  // PROMOTIONS, BANNERS & SLIDERS ACTIONS
  // -------------------------------------------------------------
  const handleToggleBanner = async (id) => {
    try {
      setTogglingBannerId(id);
      const res = await bannerApi.toggleBanner(id);
      setAdminBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, is_active: res.is_active } : b))
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to toggle banner status.');
    } finally {
      setTogglingBannerId(null);
    }
  };

  const handleToggleSlider = async (id) => {
    try {
      setTogglingBannerId(id);
      const res = await bannerApi.toggleSlider(id);
      setAdminSliders((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: res.is_active } : s))
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to toggle slider status.');
    } finally {
      setTogglingBannerId(null);
    }
  };

  const handleDeleteBanner = (id) => {
    Alert.alert('Delete Banner', 'Permanently remove this promotional banner?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await bannerApi.deleteBanner(id);
            setAdminBanners((prev) => prev.filter((b) => b.id !== id));
            Alert.alert('Success', 'Banner removed.');
          } catch (err) {
            Alert.alert('Error', err.response?.data?.detail || 'Failed to delete banner.');
          }
        },
      },
    ]);
  };

  const handleDeleteSlider = (id) => {
    Alert.alert('Delete Slider', 'Permanently remove this homepage hero slider?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await bannerApi.deleteSlider(id);
            setAdminSliders((prev) => prev.filter((s) => s.id !== id));
            Alert.alert('Success', 'Slider removed.');
          } catch (err) {
            Alert.alert('Error', err.response?.data?.detail || 'Failed to delete slider.');
          }
        },
      },
    ]);
  };

  const handleCreateBannerSubmit = async () => {
    if (!bannerTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a title.');
      return;
    }

    setSavingBanner(true);
    try {
      if (bannerModalType === 'slider') {
        const payload = {
          title: bannerTitle.trim(),
          subtitle: bannerSubtitle.trim(),
          badge_text: bannerBadge.trim(),
          link_url: bannerLink.trim() || '/products',
          cta_text: bannerCta.trim() || 'Shop Now',
          order: parseInt(bannerOrder, 10) || 0,
          is_active: true,
        };
        const created = await bannerApi.createSlider(payload);
        setAdminSliders((prev) => [...prev, created]);
        Alert.alert('Success', 'Hero slider created successfully!');
      } else {
        const payload = {
          title: bannerTitle.trim(),
          subtitle: bannerSubtitle.trim(),
          badge_text: bannerBadge.trim(),
          link_url: bannerLink.trim() || '/products',
          cta_text: bannerCta.trim() || 'Shop now',
          background_color: 'pinedeep',
          is_active: true,
        };
        const created = await bannerApi.createBanner(payload);
        setAdminBanners((prev) => [created, ...prev]);
        Alert.alert('Success', 'Promo banner created successfully!');
      }

      setBannerTitle('');
      setBannerBadge('');
      setBannerSubtitle('');
      setShowBannerModal(false);
      fetchAllAdminData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to create promotion.');
    } finally {
      setSavingBanner(false);
    }
  };

  // -------------------------------------------------------------
  // ORDER STATUS & PAYMENT TRANSITIONS
  // -------------------------------------------------------------
  const handleOpenStatusModal = (ord) => {
    setSelectedOrderForStatus(ord);
    setNewStatus(ord.status || 'pending');
    setNewPaymentStatus(ord.payment_status || 'pending');
  };

  const handleSaveOrderStatus = async () => {
    if (!selectedOrderForStatus) return;
    setStatusUpdating(true);
    try {
      await orderApi.updateAdminOrderStatus(
        selectedOrderForStatus.order_number,
        newStatus,
        newPaymentStatus
      );
      setOrders((prev) =>
        prev.map((o) =>
          o.order_number === selectedOrderForStatus.order_number
            ? { ...o, status: newStatus, payment_status: newPaymentStatus }
            : o
        )
      );
      Alert.alert(
        'Success',
        `Order #${selectedOrderForStatus.order_number} status set to "${newStatus.toUpperCase()}".`
      );
      setSelectedOrderForStatus(null);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update order.');
    } finally {
      setStatusUpdating(false);
    }
  };

  // -------------------------------------------------------------
  // SHOP SETTINGS & CSV
  // -------------------------------------------------------------
  const handleSaveShopSettings = async () => {
    setSavingSettings(true);
    try {
      const payload = {
        delivery_inside_dhaka: parseFloat(shopSettings.delivery_inside_dhaka) || 60,
        delivery_outside_dhaka: parseFloat(shopSettings.delivery_outside_dhaka) || 120,
        phone: shopSettings.phone.trim(),
        whatsapp_number: shopSettings.whatsapp_number.trim(),
        address: shopSettings.address.trim(),
      };
      await dashboardApi.updateShopSettings(payload);
      Alert.alert('Success', 'Store delivery and contact settings updated.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const csvUrl = `${API_BASE_URL}/dashboard/export-orders-csv/`;
      Alert.alert(
        'Export Orders CSV',
        'Download all order records in a formatted CSV spreadsheet for Excel / Google Sheets?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Download CSV',
            onPress: () => Linking.openURL(csvUrl).catch(() => {
              Alert.alert('Notice', 'Please open browser to download CSV.');
            }),
          },
        ]
      );
    } catch (e) {
      console.warn('Export error:', e);
    }
  };

  // -------------------------------------------------------------
  // AI DESCRIPTION GENERATOR
  // -------------------------------------------------------------
  const handleGenerateAiDescription = async () => {
    if (!aiProdName.trim()) {
      Alert.alert('Input Missing', 'Please enter the product name to generate description.');
      return;
    }
    setAiGenerating(true);
    try {
      const res = await aiApi.generateProductDescription(
        aiProdName.trim(),
        aiCatName.trim(),
        aiFeatures.trim()
      );
      const text = res?.description || res?.data || res?.content || '';
      setAiGeneratedText(text);
      setProdFormDesc(text);
    } catch (err) {
      Alert.alert('AI Error', 'Could not generate copy. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  // -------------------------------------------------------------
  // STAFF LOGIN HANDLER
  // -------------------------------------------------------------
  const handleStaffLogin = async () => {
    if (!staffEmail.trim() || !staffPassword) {
      setAuthError('Please provide email and password.');
      return;
    }
    setAuthenticating(true);
    setAuthError('');
    try {
      const res = await login(staffEmail.trim(), staffPassword);
      if (!res.user?.is_staff) {
        setAuthError('Access Denied: This account lacks store administrator rights.');
      } else {
        fetchAllAdminData();
      }
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Invalid staff credentials.');
    } finally {
      setAuthenticating(false);
    }
  };

  // -------------------------------------------------------------
  // FILTERED DATA ARRAYS
  // -------------------------------------------------------------
  const filteredProducts = adminProducts.filter((p) => {
    const matchesSearch =
      !productSearch.trim() ||
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat =
      selectedCatFilter === 'all' ||
      String(p.category?.id || p.category) === String(selectedCatFilter);
    return matchesSearch && matchesCat;
  });

  const filteredCategories = adminCategories.filter((c) => {
    return (
      !catSearch.trim() ||
      c.name?.toLowerCase().includes(catSearch.toLowerCase()) ||
      c.slug?.toLowerCase().includes(catSearch.toLowerCase())
    );
  });

  // Order status badge styling helper
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return { bg: '#dbeafe', text: '#1d4ed8' };
      case 'processing':
        return { bg: '#ede9fe', text: '#6d28d9' };
      case 'shipped':
        return { bg: '#ccfbf1', text: '#0f766e' };
      case 'delivered':
        return { bg: '#dcfce7', text: '#15803d' };
      case 'cancelled':
        return { bg: '#fee2e2', text: '#b91c1c' };
      case 'pending':
      default:
        return { bg: '#fef3c7', text: '#b45309' };
    }
  };

  const metrics = stats?.metrics || {};
  const revenue = parseFloat(metrics.total_revenue ?? stats?.total_revenue ?? 0);
  const todayRevenue = parseFloat(metrics.today_revenue ?? stats?.today_revenue ?? 0);
  const totalOrders = metrics.total_orders ?? stats?.total_orders ?? 0;
  const pendingOrdersCount = metrics.pending_orders ?? stats?.pending_orders ?? 0;
  const chartData = stats?.sales_chart_14_days || stats?.chart_data || [];
  const maxRevenue = Math.max(...chartData.map((d) => parseFloat(d.revenue || 0)), 1);
  const categorySales = stats?.category_sales || [];

  // -------------------------------------------------------------
  // PERMISSION GUARD (If not staff, show authentication terminal)
  // -------------------------------------------------------------
  if (!isStaff) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Store Admin" />
        <ScrollView contentContainerStyle={styles.authScroll}>
          <View style={styles.authLockIconWrap}>
            <Ionicons name="shield-checkmark" size={44} color={theme.colors.primary} />
          </View>
          <Text style={styles.authTitle}>Administrator Portal</Text>
          <Text style={styles.authSubtitle}>
            This terminal requires authorized staff credentials to manage inventory, catalog, and orders.
          </Text>

          {Boolean(authError) && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Staff Email or Username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={theme.colors.textMuted} />
              <TextInput
                style={styles.textInput}
                placeholder="admin@kidsfamily.com"
                placeholderTextColor={theme.colors.textMuted}
                value={staffEmail}
                onChangeText={setStaffEmail}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={18} color={theme.colors.textMuted} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textMuted}
                value={staffPassword}
                onChangeText={setStaffPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.staffLoginBtn}
            disabled={authenticating}
            onPress={handleStaffLogin}
          >
            {authenticating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={18} color="#fff" />
                <Text style={styles.staffLoginBtnText}>Access Admin Terminal</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.returnStoreBtn} onPress={() => router.replace('/(tabs)')}>
            <Ionicons name="arrow-back-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.returnStoreBtnText}>Return to Storefront</Text>
          </TouchableOpacity>
        </ScrollView>
        <AppBottomNav currentRoute="/profile" />
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // AUTHORIZED STAFF TERMINAL (Full Management Suite)
  // -------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <Header
        title="Admin Control Center"
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={handleExportCsv}
              accessibilityLabel="Export CSV"
            >
              <Ionicons name="cloud-download-outline" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
            <View style={styles.pendingBadgePill}>
              <Ionicons name="time-outline" size={12} color="#b45309" />
              <Text style={styles.pendingBadgeText}>
                {pendingOrdersCount > 0 ? `${pendingOrdersCount} Pending` : 'All Clear'}
              </Text>
            </View>
          </View>
        }
      />

      {/* Main Top Navigation Segmented Bar */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          {ADMIN_MAIN_TABS.map((tab) => {
            const isActive = adminTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.mainTabBtn, isActive && styles.mainTabBtnActive]}
                onPress={() => setAdminTab(tab.key)}
              >
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={isActive ? '#fff' : theme.colors.textSecondary}
                />
                <Text style={[styles.mainTabText, isActive && styles.mainTabTextActive]}>
                  {tab.label}
                </Text>
                {tab.key === 'orders' && pendingOrdersCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{pendingOrdersCount}</Text>
                  </View>
                )}
                {tab.key === 'products' && adminProducts.length > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : '#e2e8f0' },
                    ]}
                  >
                    <Text style={[styles.tabBadgeText, { color: isActive ? '#fff' : '#64748b' }]}>
                      {adminProducts.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* ==================================================== */}
        {/* TAB 1: OVERVIEW & ANALYTICS                          */}
        {/* ==================================================== */}
        {adminTab === 'overview' && (
          <View style={styles.tabSection}>
            {/* Quick Metrics */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <View style={styles.metricCardTop}>
                  <Text style={styles.metricLabel}>Total Revenue</Text>
                  <Ionicons name="trending-up" size={14} color="#16a34a" />
                </View>
                <Text style={styles.metricVal}>{formatPrice(revenue)}</Text>
                <Text style={styles.metricSub}>Today: {formatPrice(todayRevenue)}</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricCardTop}>
                  <Text style={styles.metricLabel}>Total Orders</Text>
                  <Ionicons name="receipt-outline" size={14} color={theme.colors.primary} />
                </View>
                <Text style={styles.metricVal}>{totalOrders}</Text>
                <Text style={styles.metricSub}>{pendingOrdersCount} Pending</Text>
              </View>
            </View>

            {/* 14-Day Sales Trend Bar Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeaderRow}>
                <View>
                  <Text style={styles.chartTitle}>Sales Trend (Last 14 Days)</Text>
                  <Text style={styles.chartSubtitle}>Daily revenue trends in BDT</Text>
                </View>
                <View style={styles.chartMaxBadge}>
                  <Text style={styles.chartMaxText}>Peak: {formatPrice(maxRevenue)}</Text>
                </View>
              </View>

              {chartData.length > 0 ? (
                <View style={styles.barsContainer}>
                  {chartData.slice(-14).map((item, idx) => {
                    const itemRev = parseFloat(item.revenue || 0);
                    const heightPercent =
                      maxRevenue > 0
                        ? Math.max(Math.round((itemRev / maxRevenue) * 100), itemRev > 0 ? 14 : 4)
                        : 4;
                    const isLatest = idx === chartData.length - 1;

                    return (
                      <View key={item.iso_date || idx} style={styles.barCol}>
                        <View
                          style={[
                            styles.barFill,
                            { height: `${heightPercent}%` },
                            isLatest && styles.barFillActive,
                            itemRev === 0 && styles.barFillZero,
                          ]}
                        />
                        <Text style={styles.barLabel}>{item.date?.split(' ')?.[0] || ''}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.chartEmpty}>
                  <Text style={styles.chartEmptyText}>No sales recorded in the past 14 days.</Text>
                </View>
              )}
            </View>

            {/* Quick Management Shortcuts */}
            <View style={styles.shortcutsCard}>
              <Text style={styles.sectionHeading}>Management Actions</Text>
              <View style={styles.shortcutsGrid}>
                <TouchableOpacity
                  style={[styles.shortcutBtn, { backgroundColor: '#eff6ff' }]}
                  onPress={handleOpenAddProduct}
                >
                  <Ionicons name="add-circle" size={20} color="#2563eb" />
                  <Text style={[styles.shortcutBtnText, { color: '#1e40af' }]}>+ Add Product</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.shortcutBtn, { backgroundColor: '#f5f3ff' }]}
                  onPress={handleOpenAddCategory}
                >
                  <Ionicons name="folder-add" size={20} color="#7c3aed" />
                  <Text style={[styles.shortcutBtnText, { color: '#6d28d9' }]}>+ Add Category</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.shortcutBtn, { backgroundColor: '#f0fdf4' }]}
                  onPress={() => {
                    setBannerModalType('slider');
                    setShowBannerModal(true);
                  }}
                >
                  <Ionicons name="images" size={20} color="#16a34a" />
                  <Text style={[styles.shortcutBtnText, { color: '#15803d' }]}>+ Add Banner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.shortcutBtn, { backgroundColor: '#fff7ed' }]}
                  onPress={() => {
                    setAiProdName('');
                    setAiCatName('');
                    setAiFeatures('');
                    setAiGeneratedText('');
                    setShowAiModal(true);
                  }}
                >
                  <Ionicons name="sparkles" size={20} color="#ea580c" />
                  <Text style={[styles.shortcutBtnText, { color: '#c2410c' }]}>AI Copywriter</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Low Stock Alerts Section */}
            {lowStockItems.length > 0 && (
              <View style={styles.alertCard}>
                <View style={styles.alertHeaderRow}>
                  <View style={styles.alertTitleBadge}>
                    <Ionicons name="warning" size={16} color="#d97706" />
                    <Text style={styles.alertHeading}>Low Stock Inventory Alerts</Text>
                  </View>
                  <View style={styles.alertCountBadge}>
                    <Text style={styles.alertCountText}>{lowStockItems.length} items</Text>
                  </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lowStockScroll}>
                  {lowStockItems.map((item) => (
                    <View key={item.id} style={styles.lowStockItemCard}>
                      <View style={styles.lowStockTop}>
                        <Text style={styles.lowStockName} numberOfLines={1}>
                          {item.product_name}
                        </Text>
                        <View
                          style={[
                            styles.stockBadge,
                            item.stock === 0 ? styles.stockZero : styles.stockLow,
                          ]}
                        >
                          <Text style={styles.stockBadgeText}>
                            {item.stock === 0 ? 'Out of Stock' : `${item.stock} left`}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.lowStockAttrs}>{item.attributes || item.sku}</Text>
                      <Text style={styles.lowStockPrice}>{formatPrice(parseFloat(item.price || 0))}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Category Sales Performance */}
            {categorySales.length > 0 && (
              <View style={styles.catSalesCard}>
                <Text style={styles.sectionHeading}>Category Sales Breakdown</Text>
                <View style={styles.catSalesList}>
                  {categorySales.map((c, i) => (
                    <View key={i} style={styles.catSaleRow}>
                      <Text style={styles.catSaleName}>{c.category}</Text>
                      <Text style={styles.catSaleQty}>{c.quantity} sold</Text>
                      <Text style={styles.catSaleRev}>{formatPrice(c.revenue)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ==================================================== */}
        {/* TAB 2: PRODUCTS MANAGEMENT                           */}
        {/* ==================================================== */}
        {adminTab === 'products' && (
          <View style={styles.tabSection}>
            {/* Products Toolbar */}
            <View style={styles.moduleHeaderBar}>
              <View>
                <Text style={styles.moduleTitle}>Product Catalog</Text>
                <Text style={styles.moduleSubtitle}>{filteredProducts.length} items available</Text>
              </View>
              <TouchableOpacity style={styles.primaryActionBtn} onPress={handleOpenAddProduct}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.primaryActionBtnText}>Add Product</Text>
              </TouchableOpacity>
            </View>

            {/* Product Search & Filters */}
            <View style={styles.searchRow}>
              <View style={styles.searchInputWrapper}>
                <Ionicons name="search" size={16} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search products by title or SKU..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={productSearch}
                  onChangeText={setProductSearch}
                />
                {Boolean(productSearch) && (
                  <TouchableOpacity onPress={() => setProductSearch('')}>
                    <Ionicons name="close-circle" size={16} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsScroll}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedCatFilter === 'all' && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCatFilter('all')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCatFilter === 'all' && styles.filterChipTextActive,
                  ]}
                >
                  All ({adminProducts.length})
                </Text>
              </TouchableOpacity>
              {adminCategories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.filterChip,
                    String(selectedCatFilter) === String(c.id) && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedCatFilter(c.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      String(selectedCatFilter) === String(c.id) && styles.filterChipTextActive,
                    ]}
                  >
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Products List */}
            {filteredProducts.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Ionicons name="shirt-outline" size={42} color={theme.colors.textMuted} />
                <Text style={styles.emptyStateTitle}>No Products Found</Text>
                <Text style={styles.emptyStateDesc}>
                  {productSearch ? 'Try a different search keyword.' : 'Get started by creating your first product.'}
                </Text>
                <TouchableOpacity style={styles.emptyStateBtn} onPress={handleOpenAddProduct}>
                  <Text style={styles.emptyStateBtnText}>+ Add Product Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredProducts.map((prod) => {
                const imgUri = formatProductImageUrl(prod.thumbnail || prod.image);
                const price = prod.base_price || prod.starting_price || 0;
                const isDeleting = deletingProductId === prod.id;

                return (
                  <View key={prod.id} style={styles.productAdminCard}>
                    {/* Thumbnail Image */}
                    <View style={styles.productThumbWrap}>
                      {imgUri ? (
                        <Image source={{ uri: imgUri }} style={styles.productThumbImg} contentFit="cover" />
                      ) : (
                        <View style={styles.productThumbPlaceholder}>
                          <Ionicons name="image-outline" size={24} color={theme.colors.textMuted} />
                        </View>
                      )}
                    </View>

                    {/* Product Details */}
                    <View style={styles.productAdminDetails}>
                      <View style={styles.productAdminHeader}>
                        <Text style={styles.productAdminName} numberOfLines={2}>
                          {prod.name}
                        </Text>
                        <View
                          style={[
                            styles.statusPillSmall,
                            prod.is_active ? styles.statusPillActive : styles.statusPillInactive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillSmallText,
                              prod.is_active ? styles.statusTextActive : styles.statusTextInactive,
                            ]}
                          >
                            {prod.is_active ? 'Active' : 'Draft'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.productAdminMetaRow}>
                        <Text style={styles.productAdminCategory}>
                          {prod.category?.name || 'Uncategorized'}
                        </Text>
                        <Text style={styles.productAdminPrice}>{formatPrice(price)}</Text>
                      </View>

                      {/* Stock & SKU row */}
                      <View style={styles.productAdminStockRow}>
                        <Text style={styles.productAdminSku}>
                          SKU: {prod.sku || `KF-${prod.id}`}
                        </Text>
                        {prod.variants && prod.variants.length > 0 ? (
                          <Text style={styles.productAdminVariantsBadge}>
                            {prod.variants.length} variant(s)
                          </Text>
                        ) : null}
                      </View>

                      {/* Action Buttons: Edit, Delete, View */}
                      <View style={styles.productAdminActions}>
                        <TouchableOpacity
                          style={styles.actionBtnEdit}
                          onPress={() => handleOpenEditProduct(prod)}
                        >
                          <Ionicons name="create-outline" size={14} color="#2563eb" />
                          <Text style={styles.actionBtnEditText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionBtnDelete}
                          disabled={isDeleting}
                          onPress={() => handleDeleteProduct(prod.id, prod.name)}
                        >
                          {isDeleting ? (
                            <ActivityIndicator size="small" color="#dc2626" />
                          ) : (
                            <>
                              <Ionicons name="trash-outline" size={14} color="#dc2626" />
                              <Text style={styles.actionBtnDeleteText}>Delete</Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionBtnView}
                          onPress={() =>
                            router.push({
                              pathname: '/products/[id]',
                              params: { id: prod.id.toString() },
                            })
                          }
                        >
                          <Ionicons name="eye-outline" size={14} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ==================================================== */}
        {/* TAB 3: CATEGORIES MANAGEMENT                         */}
        {/* ==================================================== */}
        {adminTab === 'categories' && (
          <View style={styles.tabSection}>
            <View style={styles.moduleHeaderBar}>
              <View>
                <Text style={styles.moduleTitle}>Categories</Text>
                <Text style={styles.moduleSubtitle}>{filteredCategories.length} categories configured</Text>
              </View>
              <TouchableOpacity style={styles.primaryActionBtn} onPress={handleOpenAddCategory}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.primaryActionBtnText}>Add Category</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <View style={styles.searchInputWrapper}>
                <Ionicons name="search" size={16} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search categories by name or slug..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={catSearch}
                  onChangeText={setCatSearch}
                />
              </View>
            </View>

            {filteredCategories.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Ionicons name="grid-outline" size={42} color={theme.colors.textMuted} />
                <Text style={styles.emptyStateTitle}>No Categories</Text>
                <Text style={styles.emptyStateDesc}>Add product categories to organize your store catalog.</Text>
                <TouchableOpacity style={styles.emptyStateBtn} onPress={handleOpenAddCategory}>
                  <Text style={styles.emptyStateBtnText}>+ Add First Category</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredCategories.map((c) => (
                <View key={c.id} style={styles.categoryAdminCard}>
                  <View style={styles.categoryAdminIcon}>
                    <Ionicons name="folder-outline" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.categoryAdminInfo}>
                    <Text style={styles.categoryAdminName}>{c.name}</Text>
                    <Text style={styles.categoryAdminSlug}>
                      /{c.slug} {c.parent ? `• Parent: #${c.parent}` : '• Top Level'}
                    </Text>
                  </View>
                  <View style={styles.categoryAdminActions}>
                    <TouchableOpacity
                      style={styles.catActionBtn}
                      onPress={() => handleOpenEditCategory(c)}
                    >
                      <Ionicons name="pencil" size={15} color="#2563eb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.catActionBtn, styles.catActionBtnDelete]}
                      onPress={() => handleDeleteCategory(c.id, c.name)}
                    >
                      <Ionicons name="trash-outline" size={15} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ==================================================== */}
        {/* TAB 4: ORDERS MANAGEMENT                             */}
        {/* ==================================================== */}
        {adminTab === 'orders' && (
          <View style={styles.tabSection}>
            <View style={styles.moduleHeaderBar}>
              <View>
                <Text style={styles.moduleTitle}>Order Fulfillment</Text>
                <Text style={styles.moduleSubtitle}>{orders.length} orders retrieved</Text>
              </View>
              <TouchableOpacity style={styles.headerExportBtn} onPress={handleExportCsv}>
                <Ionicons name="download-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.headerExportBtnText}>CSV</Text>
              </TouchableOpacity>
            </View>

            {/* Status Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statusTabsRow}
            >
              {ORDER_STATUS_TABS.map((tab) => {
                const active = selectedStatusTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.statusTabChip, active && styles.statusTabChipActive]}
                    onPress={() => setSelectedStatusTab(tab.key)}
                  >
                    <Text style={[styles.statusTabChipText, active && styles.statusTabChipTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Order Search */}
            <View style={styles.searchRow}>
              <View style={styles.searchInputWrapper}>
                <Ionicons name="search" size={16} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search order #, phone or customer..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={orderSearchQuery}
                  onChangeText={setOrderSearchQuery}
                />
                {Boolean(orderSearchQuery) && (
                  <TouchableOpacity onPress={() => setOrderSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Orders List */}
            {orders.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Ionicons name="receipt-outline" size={42} color={theme.colors.textMuted} />
                <Text style={styles.emptyStateTitle}>No Orders Found</Text>
                <Text style={styles.emptyStateDesc}>
                  No orders match your selected status and filter parameters.
                </Text>
              </View>
            ) : (
              orders.map((ord) => {
                const statusTheme = getStatusColor(ord.status);
                const orderTotal = parseFloat(ord.total || ord.total_amount || 0);

                return (
                  <View key={ord.order_number} style={styles.orderCard}>
                    <View style={styles.orderCardHeader}>
                      <View style={styles.orderCardHeaderLeft}>
                        <View style={styles.orderAvatar}>
                          <Ionicons name="bag" size={16} color={theme.colors.primary} />
                        </View>
                        <View>
                          <Text style={styles.orderNum}>#{ord.order_number}</Text>
                          <Text style={styles.orderCustomer}>
                            {ord.full_name || ord.user_name || 'Customer'} • {ord.phone || ''}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.statusPill, { backgroundColor: statusTheme.bg }]}>
                        <Text style={[styles.statusPillText, { color: statusTheme.text }]}>
                          {ord.status?.toUpperCase() || 'PENDING'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.orderMetaBar}>
                      <Text style={styles.orderMetaText}>
                        Items: {ord.items?.length || 1} • Payment:{' '}
                        <Text style={{ fontWeight: '700' }}>
                          {ord.payment_status?.toUpperCase() || 'PENDING'}
                        </Text>
                      </Text>
                      <Text style={styles.orderTotalText}>{formatPrice(orderTotal)}</Text>
                    </View>

                    <View style={styles.orderActionRow}>
                      <TouchableOpacity
                        style={styles.orderStatusActionBtn}
                        onPress={() => handleOpenStatusModal(ord)}
                      >
                        <Ionicons name="sync-outline" size={14} color="#fff" />
                        <Text style={styles.orderStatusActionBtnText}>Update Status</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.orderDetailsActionBtn}
                        onPress={() =>
                          router.push({
                            pathname: '/orders/[orderNumber]',
                            params: { orderNumber: ord.order_number },
                          })
                        }
                      >
                        <Text style={styles.orderDetailsActionBtnText}>Order Details</Text>
                        <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ==================================================== */}
        {/* TAB 5: BANNERS & PROMOTIONS MANAGEMENT               */}
        {/* ==================================================== */}
        {adminTab === 'banners' && (
          <View style={styles.tabSection}>
            <View style={styles.moduleHeaderBar}>
              <View>
                <Text style={styles.moduleTitle}>Banners & Sliders</Text>
                <Text style={styles.moduleSubtitle}>Homepage hero carousel & promotional banners</Text>
              </View>
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => {
                  setBannerModalType(bannerSubTab === 'sliders' ? 'slider' : 'banner');
                  setBannerTitle('');
                  setBannerBadge('');
                  setBannerSubtitle('');
                  setShowBannerModal(true);
                }}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.primaryActionBtnText}>
                  {bannerSubTab === 'sliders' ? 'Add Slide' : 'Add Banner'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sub-Tabs: Hero Sliders vs Promo Banners */}
            <View style={styles.subTabsRow}>
              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  bannerSubTab === 'sliders' && styles.subTabBtnActive,
                ]}
                onPress={() => setBannerSubTab('sliders')}
              >
                <Ionicons
                  name="albums-outline"
                  size={15}
                  color={bannerSubTab === 'sliders' ? theme.colors.primary : theme.colors.textMuted}
                />
                <Text
                  style={[
                    styles.subTabText,
                    bannerSubTab === 'sliders' && styles.subTabTextActive,
                  ]}
                >
                  Hero Sliders ({adminSliders.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.subTabBtn,
                  bannerSubTab === 'banners' && styles.subTabBtnActive,
                ]}
                onPress={() => setBannerSubTab('banners')}
              >
                <Ionicons
                  name="image-outline"
                  size={15}
                  color={bannerSubTab === 'banners' ? theme.colors.primary : theme.colors.textMuted}
                />
                <Text
                  style={[
                    styles.subTabText,
                    bannerSubTab === 'banners' && styles.subTabTextActive,
                  ]}
                >
                  Promo Cards ({adminBanners.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sub-tab Content: Hero Sliders */}
            {bannerSubTab === 'sliders' ? (
              adminSliders.length === 0 ? (
                <View style={styles.emptyStateCard}>
                  <Ionicons name="images-outline" size={42} color={theme.colors.textMuted} />
                  <Text style={styles.emptyStateTitle}>No Hero Sliders Found</Text>
                  <Text style={styles.emptyStateDesc}>
                    Add responsive hero carousel slides shown at the top of your homepage.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyStateBtn}
                    onPress={() => {
                      setBannerModalType('slider');
                      setShowBannerModal(true);
                    }}
                  >
                    <Text style={styles.emptyStateBtnText}>+ Add First Hero Slide</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                adminSliders.map((slider) => {
                  const imgUri = formatImageUrl(slider.image || slider.mobile_image);
                  return (
                    <View key={slider.id} style={styles.bannerItemCard}>
                      <View style={styles.bannerThumbWrap}>
                        {imgUri ? (
                          <Image source={{ uri: imgUri }} style={styles.bannerThumbImg} contentFit="cover" />
                        ) : (
                          <View style={styles.bannerThumbPlaceholder}>
                            <Ionicons name="image" size={24} color={theme.colors.textMuted} />
                          </View>
                        )}
                      </View>

                      <View style={styles.bannerItemDetails}>
                        <View style={styles.bannerItemHeader}>
                          <Text style={styles.bannerItemTitle} numberOfLines={1}>
                            {slider.title || `Slide #${slider.id}`}
                          </Text>
                          <View
                            style={[
                              styles.statusPillSmall,
                              slider.is_active ? styles.statusPillActive : styles.statusPillInactive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillSmallText,
                                slider.is_active ? styles.statusTextActive : styles.statusTextInactive,
                              ]}
                            >
                              {slider.is_active ? 'Live' : 'Hidden'}
                            </Text>
                          </View>
                        </View>

                        {Boolean(slider.badge_text) && (
                          <Text style={styles.bannerBadgeText}>{slider.badge_text}</Text>
                        )}
                        <Text style={styles.bannerLinkText} numberOfLines={1}>
                          Order: {slider.order ?? 0} • Link: {slider.link_url || '/products'}
                        </Text>

                        <View style={styles.bannerActionsRow}>
                          <TouchableOpacity
                            style={[
                              styles.toggleActiveBtn,
                              slider.is_active ? styles.toggleActiveBtnOff : styles.toggleActiveBtnOn,
                            ]}
                            disabled={togglingBannerId === slider.id}
                            onPress={() => handleToggleSlider(slider.id)}
                          >
                            {togglingBannerId === slider.id ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.toggleActiveBtnText}>
                                {slider.is_active ? 'Turn Off' : 'Turn On'}
                              </Text>
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.bannerDeleteBtn}
                            onPress={() => handleDeleteSlider(slider.id)}
                          >
                            <Ionicons name="trash-outline" size={15} color="#dc2626" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )
            ) : adminBanners.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Ionicons name="image-outline" size={42} color={theme.colors.textMuted} />
                <Text style={styles.emptyStateTitle}>No Promo Cards Found</Text>
                <Text style={styles.emptyStateDesc}>
                  Add promotional banner cards with custom discounts and CTA buttons.
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateBtn}
                  onPress={() => {
                    setBannerModalType('banner');
                    setShowBannerModal(true);
                  }}
                >
                  <Text style={styles.emptyStateBtnText}>+ Add Promo Card</Text>
                </TouchableOpacity>
              </View>
            ) : (
              adminBanners.map((banner) => {
                const imgUri = formatImageUrl(banner.image);
                return (
                  <View key={banner.id} style={styles.bannerItemCard}>
                    <View style={styles.bannerThumbWrap}>
                      {imgUri ? (
                        <Image source={{ uri: imgUri }} style={styles.bannerThumbImg} contentFit="cover" />
                      ) : (
                        <View style={styles.bannerThumbPlaceholder}>
                          <Ionicons name="image" size={24} color={theme.colors.textMuted} />
                        </View>
                      )}
                    </View>

                    <View style={styles.bannerItemDetails}>
                      <View style={styles.bannerItemHeader}>
                        <Text style={styles.bannerItemTitle} numberOfLines={1}>
                          {banner.title}
                        </Text>
                        <View
                          style={[
                            styles.statusPillSmall,
                            banner.is_active ? styles.statusPillActive : styles.statusPillInactive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillSmallText,
                              banner.is_active ? styles.statusTextActive : styles.statusTextInactive,
                            ]}
                          >
                            {banner.is_active ? 'Live' : 'Hidden'}
                          </Text>
                        </View>
                      </View>

                      {Boolean(banner.badge_text) && (
                        <Text style={styles.bannerBadgeText}>{banner.badge_text}</Text>
                      )}
                      <Text style={styles.bannerLinkText} numberOfLines={1}>
                        CTA: {banner.cta_text || 'Shop now'} • Link: {banner.link_url || '/products'}
                      </Text>

                      <View style={styles.bannerActionsRow}>
                        <TouchableOpacity
                          style={[
                            styles.toggleActiveBtn,
                            banner.is_active ? styles.toggleActiveBtnOff : styles.toggleActiveBtnOn,
                          ]}
                          disabled={togglingBannerId === banner.id}
                          onPress={() => handleToggleBanner(banner.id)}
                        >
                          {togglingBannerId === banner.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.toggleActiveBtnText}>
                              {banner.is_active ? 'Turn Off' : 'Turn On'}
                            </Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.bannerDeleteBtn}
                          onPress={() => handleDeleteBanner(banner.id)}
                        >
                          <Ionicons name="trash-outline" size={15} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ==================================================== */}
        {/* TAB 6: SETTINGS MANAGEMENT                           */}
        {/* ==================================================== */}
        {adminTab === 'settings' && (
          <View style={styles.tabSection}>
            <View style={styles.moduleHeaderBar}>
              <View>
                <Text style={styles.moduleTitle}>Store Settings</Text>
                <Text style={styles.moduleSubtitle}>Delivery rates, support contacts & data exports</Text>
              </View>
            </View>

            <View style={styles.settingsCard}>
              <Text style={styles.settingsCardHeading}>Delivery Fees (BDT)</Text>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalFieldLabel}>Inside Dhaka Delivery Fee (৳)</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={shopSettings.delivery_inside_dhaka}
                  onChangeText={(val) => setShopSettings((s) => ({ ...s, delivery_inside_dhaka: val }))}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalFieldLabel}>Outside Dhaka Delivery Fee (৳)</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={shopSettings.delivery_outside_dhaka}
                  onChangeText={(val) => setShopSettings((s) => ({ ...s, delivery_outside_dhaka: val }))}
                />
              </View>

              <Text style={[styles.settingsCardHeading, { marginTop: 16 }]}>Customer Support Contacts</Text>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalFieldLabel}>Hotline Phone</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="+8801XXXXXXXXX"
                  value={shopSettings.phone}
                  onChangeText={(val) => setShopSettings((s) => ({ ...s, phone: val }))}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalFieldLabel}>WhatsApp Support Number</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="+8801XXXXXXXXX"
                  value={shopSettings.whatsapp_number}
                  onChangeText={(val) => setShopSettings((s) => ({ ...s, whatsapp_number: val }))}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalFieldLabel}>Store Physical Address</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Dhaka, Bangladesh"
                  value={shopSettings.address}
                  onChangeText={(val) => setShopSettings((s) => ({ ...s, address: val }))}
                />
              </View>

              <TouchableOpacity
                style={styles.saveSettingsSubmitBtn}
                disabled={savingSettings}
                onPress={handleSaveShopSettings}
              >
                {savingSettings ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveSettingsSubmitBtnText}>Save Store Configuration</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ==================================================== */}
      {/* MODAL 1: ADD / EDIT PRODUCT                          */}
      {/* ==================================================== */}
      <Modal visible={showProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModalContent]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="bag-add" size={20} color={theme.colors.primary} />
                <Text style={styles.modalTitle}>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalFieldLabel}>Product Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Baby Soft Cotton Romper"
                  placeholderTextColor={theme.colors.textMuted}
                  value={prodFormName}
                  onChangeText={setProdFormName}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalFieldLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {adminCategories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.catSelectChip,
                        String(prodFormCatId) === String(c.id) && styles.catSelectChipActive,
                      ]}
                      onPress={() => setProdFormCatId(String(c.id))}
                    >
                      <Text
                        style={[
                          styles.catSelectChipText,
                          String(prodFormCatId) === String(c.id) && styles.catSelectChipTextActive,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.rowTwoInputs}>
                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <Text style={styles.modalFieldLabel}>Base Price (৳) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="750"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="numeric"
                    value={prodFormBasePrice}
                    onChangeText={setProdFormBasePrice}
                  />
                </View>

                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <Text style={styles.modalFieldLabel}>Initial Stock</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="10"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="numeric"
                    value={prodFormStock}
                    onChangeText={setProdFormStock}
                  />
                </View>
              </View>

              <View style={styles.modalInputGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.modalFieldLabel}>Description</Text>
                  <TouchableOpacity
                    style={styles.aiCopyHelperBtn}
                    onPress={() => {
                      setAiProdName(prodFormName);
                      const catObj = adminCategories.find((c) => String(c.id) === String(prodFormCatId));
                      setAiCatName(catObj?.name || '');
                      setShowAiModal(true);
                    }}
                  >
                    <Ionicons name="sparkles" size={13} color={theme.colors.primary} />
                    <Text style={styles.aiCopyHelperText}>AI Generate</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  placeholder="Detailed product features, materials, and sizing guide..."
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  numberOfLines={4}
                  value={prodFormDesc}
                  onChangeText={setProdFormDesc}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Active in Customer Storefront</Text>
                <Switch
                  value={prodFormIsActive}
                  onValueChange={setProdFormIsActive}
                  trackColor={{ false: '#e2e8f0', true: '#bbf7d0' }}
                  thumbColor={prodFormIsActive ? '#16a34a' : '#94a3b8'}
                />
              </View>

              <TouchableOpacity
                style={styles.saveSettingsSubmitBtn}
                disabled={savingProduct}
                onPress={handleSaveProductSubmit}
              >
                {savingProduct ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveSettingsSubmitBtnText}>
                    {editingProduct ? 'Save Product Changes' : 'Create Product'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 2: ADD / EDIT CATEGORY                         */}
      {/* ==================================================== */}
      <Modal visible={showCatModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="folder-add" size={18} color={theme.colors.primary} />
                <Text style={styles.modalTitle}>
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCatModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalFieldLabel}>Category Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Summer Essentials"
                placeholderTextColor={theme.colors.textMuted}
                value={catFormName}
                onChangeText={(text) => {
                  setCatFormName(text);
                  if (!editingCategory && !catFormSlug) {
                    setCatFormSlug(text.toLowerCase().replace(/\s+/g, '-'));
                  }
                }}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalFieldLabel}>Slug (URL identifier)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="summer-essentials"
                placeholderTextColor={theme.colors.textMuted}
                value={catFormSlug}
                onChangeText={setCatFormSlug}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.saveSettingsSubmitBtn}
              disabled={savingCat}
              onPress={handleSaveCategorySubmit}
            >
              {savingCat ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveSettingsSubmitBtnText}>
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 3: ADD BANNER / SLIDER                         */}
      {/* ==================================================== */}
      <Modal visible={showBannerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModalContent]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="images" size={18} color={theme.colors.primary} />
                <Text style={styles.modalTitle}>
                  {bannerModalType === 'slider' ? 'Add Hero Carousel Slider' : 'Add Promo Banner Card'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowBannerModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalFieldLabel}>Banner Title *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Eid Festive Collection"
                  placeholderTextColor={theme.colors.textMuted}
                  value={bannerTitle}
                  onChangeText={setBannerTitle}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalFieldLabel}>Badge Text</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. FLAT 40% OFF"
                  placeholderTextColor={theme.colors.textMuted}
                  value={bannerBadge}
                  onChangeText={setBannerBadge}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalFieldLabel}>Subtitle / Tagline</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Premium clothing for little ones"
                  placeholderTextColor={theme.colors.textMuted}
                  value={bannerSubtitle}
                  onChangeText={setBannerSubtitle}
                />
              </View>

              <View style={styles.rowTwoInputs}>
                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <Text style={styles.modalFieldLabel}>Target Link URL</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="/products"
                    placeholderTextColor={theme.colors.textMuted}
                    value={bannerLink}
                    onChangeText={setBannerLink}
                    autoCapitalize="none"
                  />
                </View>

                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <Text style={styles.modalFieldLabel}>CTA Button Text</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Shop Now"
                    placeholderTextColor={theme.colors.textMuted}
                    value={bannerCta}
                    onChangeText={setBannerCta}
                  />
                </View>
              </View>

              {bannerModalType === 'slider' && (
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalFieldLabel}>Display Order (Lowest first)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="0"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="numeric"
                    value={bannerOrder}
                    onChangeText={setBannerOrder}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.saveSettingsSubmitBtn}
                disabled={savingBanner}
                onPress={handleCreateBannerSubmit}
              >
                {savingBanner ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveSettingsSubmitBtnText}>Create Promotion</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 4: ORDER STATUS TRANSITION                     */}
      {/* ==================================================== */}
      <Modal visible={Boolean(selectedOrderForStatus)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Order #{selectedOrderForStatus?.order_number}
              </Text>
              <TouchableOpacity onPress={() => setSelectedOrderForStatus(null)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalFieldLabel}>Fulfillment Status</Text>
            <View style={styles.chipsWrap}>
              {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.selectChip, newStatus === st && styles.selectChipActive]}
                  onPress={() => setNewStatus(st)}
                >
                  <Text style={[styles.selectChipText, newStatus === st && styles.selectChipTextActive]}>
                    {st.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalFieldLabel, { marginTop: 12 }]}>Payment Status</Text>
            <View style={styles.chipsWrap}>
              {['pending', 'paid', 'refunded', 'failed'].map((pst) => (
                <TouchableOpacity
                  key={pst}
                  style={[styles.selectChip, newPaymentStatus === pst && styles.selectChipActive]}
                  onPress={() => setNewPaymentStatus(pst)}
                >
                  <Text style={[styles.selectChipText, newPaymentStatus === pst && styles.selectChipTextActive]}>
                    {pst.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.saveSettingsSubmitBtn}
              disabled={statusUpdating}
              onPress={handleSaveOrderStatus}
            >
              {statusUpdating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveSettingsSubmitBtnText}>Save Order Status</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 5: AI DESCRIPTION GENERATOR                    */}
      {/* ==================================================== */}
      <Modal visible={showAiModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModalContent]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="sparkles" size={18} color={theme.colors.primary} />
                <Text style={styles.modalTitle}>AI Copywriter Assistant</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAiModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalFieldLabel}>Product Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Baby Summer Romper"
                  value={aiProdName}
                  onChangeText={setAiProdName}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalFieldLabel}>Category Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Kids Clothing"
                  value={aiCatName}
                  onChangeText={setAiCatName}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalFieldLabel}>Key Features / Notes</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="100% Organic Cotton, breathable, snap buttons..."
                  value={aiFeatures}
                  onChangeText={setAiFeatures}
                />
              </View>

              <TouchableOpacity
                style={styles.aiGenerateBtn}
                disabled={aiGenerating}
                onPress={handleGenerateAiDescription}
              >
                {aiGenerating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                    <Text style={styles.aiGenerateBtnText}>Generate Product Description</Text>
                  </>
                )}
              </TouchableOpacity>

              {Boolean(aiGeneratedText) && (
                <View style={styles.aiResultBox}>
                  <Text style={styles.aiResultHeading}>Generated Copy:</Text>
                  <Text style={styles.aiResultContent}>{aiGeneratedText}</Text>
                  <TouchableOpacity
                    style={styles.useCopyBtn}
                    onPress={() => {
                      setProdFormDesc(aiGeneratedText);
                      setShowAiModal(false);
                      Alert.alert('Copy Applied', 'Description copied to the Product Form!');
                    }}
                  >
                    <Ionicons name="checkmark-done" size={16} color="#fff" />
                    <Text style={styles.useCopyBtnText}>Apply to Product Form</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Persistent Bottom Navigation */}
      <AppBottomNav currentRoute="/profile" />
    </SafeAreaView>
  );
}

// -------------------------------------------------------------
// STYLESHEET
// -------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  pendingBadgeText: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '800',
  },

  // Segmented Main Tab Bar
  tabBarContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 8,
  },
  tabBarScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  mainTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mainTabBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  mainTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  mainTabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },

  tabSection: {
    gap: 16,
  },

  // Overview Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 4,
  },
  metricCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
  },
  metricSub: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // 14-Day Chart
  chartCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 14,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
  },
  chartSubtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  chartMaxBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  chartMaxText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 10,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barFill: {
    width: 14,
    borderRadius: 4,
    backgroundColor: '#e9d5ff',
  },
  barFillActive: {
    backgroundColor: theme.colors.primary,
  },
  barFillZero: {
    backgroundColor: '#f1f5f9',
  },
  barLabel: {
    fontSize: 9,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  chartEmpty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  chartEmptyText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },

  // Shortcuts Card
  shortcutsCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  shortcutBtn: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  shortcutBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Low Stock
  alertCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
    gap: 12,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  alertCountBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  alertCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  lowStockScroll: {
    marginHorizontal: -4,
  },
  lowStockItemCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 4,
    width: 170,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 2,
  },
  lowStockTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  lowStockName: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockZero: {
    backgroundColor: '#fee2e2',
  },
  stockLow: {
    backgroundColor: '#ffedd5',
  },
  stockBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b91c1c',
  },
  lowStockAttrs: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  lowStockPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.primary,
    marginTop: 2,
  },

  // Category Sales
  catSalesCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 10,
  },
  catSalesList: {
    gap: 8,
  },
  catSaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  catSaleName: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
  },
  catSaleQty: {
    fontSize: 11,
    color: theme.colors.textMuted,
    width: 70,
    textAlign: 'center',
  },
  catSaleRev: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primary,
  },

  // Module Header
  moduleHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.text,
  },
  moduleSubtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  primaryActionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  headerExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerExportBtnText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  // Search & Filter Bars
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text,
    padding: 0,
  },
  filterChipsScroll: {
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // Empty State Card
  emptyStateCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
  },
  emptyStateDesc: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
  },
  emptyStateBtn: {
    marginTop: 6,
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyStateBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primary,
  },

  // Product Admin Card
  productAdminCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  productThumbWrap: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  productThumbImg: {
    width: '100%',
    height: '100%',
  },
  productThumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productAdminDetails: {
    flex: 1,
    gap: 3,
  },
  productAdminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  productAdminName: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    flex: 1,
  },
  statusPillSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillActive: {
    backgroundColor: '#dcfce7',
  },
  statusPillInactive: {
    backgroundColor: '#f1f5f9',
  },
  statusPillSmallText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusTextActive: {
    color: '#15803d',
  },
  statusTextInactive: {
    color: '#64748b',
  },
  productAdminMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productAdminCategory: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  productAdminPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  productAdminStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productAdminSku: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  productAdminVariantsBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b21a8',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  productAdminActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  actionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionBtnEditText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  actionBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionBtnDeleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  actionBtnView: {
    padding: 4,
  },

  // Category Admin Card
  categoryAdminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 10,
  },
  categoryAdminIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryAdminInfo: {
    flex: 1,
    gap: 2,
  },
  categoryAdminName: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
  },
  categoryAdminSlug: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  categoryAdminActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catActionBtnDelete: {
    backgroundColor: '#fef2f2',
  },

  // Orders Section
  statusTabsRow: {
    gap: 6,
  },
  statusTabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusTabChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  statusTabChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  statusTabChipTextActive: {
    color: '#fff',
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 10,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNum: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
  },
  orderCustomer: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orderMetaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
  },
  orderMetaText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  orderTotalText: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  orderActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  orderStatusActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  orderStatusActionBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  orderDetailsActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
  },
  orderDetailsActionBtnText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },

  // Banners & Sliders Tab
  subTabsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  subTabBtnActive: {
    backgroundColor: '#f3e8ff',
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  subTabTextActive: {
    color: theme.colors.primary,
  },
  bannerItemCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  bannerThumbWrap: {
    width: 90,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  bannerThumbImg: {
    width: '100%',
    height: '100%',
  },
  bannerThumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerItemDetails: {
    flex: 1,
    gap: 2,
  },
  bannerItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    flex: 1,
  },
  bannerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  bannerLinkText: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  bannerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  toggleActiveBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleActiveBtnOff: {
    backgroundColor: '#fee2e2',
  },
  toggleActiveBtnOn: {
    backgroundColor: '#dcfce7',
  },
  toggleActiveBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text,
  },
  bannerDeleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },

  // Settings Card
  settingsCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  settingsCardHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
  },
  saveSettingsSubmitBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveSettingsSubmitBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  // Modals Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    maxHeight: '85%',
  },
  largeModalContent: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.text,
  },
  modalInputGroup: {
    gap: 4,
  },
  modalFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  modalInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: theme.colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  rowTwoInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  catSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catSelectChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  catSelectChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  catSelectChipTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  aiCopyHelperBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#f3e8ff',
  },
  aiCopyHelperText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  selectChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  selectChipTextActive: {
    color: '#fff',
  },
  aiGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  aiGenerateBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  aiResultBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 6,
  },
  aiResultHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.text,
  },
  aiResultContent: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 17,
  },
  useCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  useCopyBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  // Auth Fallback Form
  authScroll: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  authLockIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 6,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.text,
  },
  authSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 8,
  },
  inputGroup: {
    width: '100%',
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    padding: 0,
  },
  errorBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 10,
    borderRadius: 10,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  staffLoginBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  staffLoginBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  returnStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  returnStoreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
