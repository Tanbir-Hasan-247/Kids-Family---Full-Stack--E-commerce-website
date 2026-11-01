import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productApi } from '../api/productApi';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { formatImageUrl } from '../utils/imageHelper';
import { formatPrice, calculateDiscountPercent } from '../utils/currency';
import { theme } from '../constants/theme';
import Header from '../components/common/Header';
import CustomButton from '../components/common/CustomButton';
import Badge from '../components/common/Badge';
import QuantityStepper from '../components/common/QuantityStepper';
import VariantSelector from '../components/product/VariantSelector';
import AppBottomNav from '../components/layout/AppBottomNav';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GALLERY_HEIGHT = SCREEN_WIDTH * 0.95;

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isFavorited: checkFavorited, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeVariant, setActiveVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Reviews state
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newReviewerName, setNewReviewerName] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const isFavorited = product?.id ? checkFavorited(product.id) : false;

  const handleToggleWishlist = async () => {
    if (!product?.id) return;
    try {
      await toggleWishlist(product.id);
    } catch (err) {
      console.warn('Wishlist toggle error:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      try {
        const prod = await productApi.getProductDetail(id);
        if (isMounted) {
          setProduct(prod);
          setReviewsList(Array.isArray(prod.reviews) ? prod.reviews : []);

          if (prod.variants && prod.variants.length > 0) {
            const defaultV = prod.variants.find((v) => v.stock > 0) || prod.variants[0];
            setActiveVariant(defaultV);

            if (defaultV.attributes && Array.isArray(defaultV.attributes)) {
              const cAttr = defaultV.attributes.find(
                (a) => a.attribute_type === 1 || a.type_name?.toLowerCase() === 'color'
              );
              const sAttr = defaultV.attributes.find(
                (a) => a.attribute_type === 2 || a.type_name?.toLowerCase() === 'size'
              );
              if (cAttr) setSelectedColor(cAttr.id);
              if (sAttr) setSelectedSize(sAttr.id);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load product detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Handle color & size combination selection
  useEffect(() => {
    if (!product || !product.variants || product.variants.length === 0) return;

    if (selectedColor && selectedSize) {
      const matched = product.variants.find((v) => {
        const hasColor = v.attributes?.some((a) => a.id === selectedColor);
        const hasSize = v.attributes?.some((a) => a.id === selectedSize);
        return hasColor && hasSize;
      });

      if (matched) {
        setActiveVariant(matched);
      } else {
        productApi
          .getVariant(product.id, selectedColor, selectedSize)
          .then((res) => {
            if (res && res.available) {
              const found = product.variants.find((v) => v.id === res.variant_id);
              setActiveVariant(found || res);
            }
          })
          .catch(() => {});
      }
    } else if (selectedColor && !selectedSize) {
      const colorV = product.variants.find((v) =>
        v.attributes?.some((a) => a.id === selectedColor)
      );
      if (colorV) setActiveVariant(colorV);
    } else if (!selectedColor && selectedSize) {
      const sizeV = product.variants.find((v) =>
        v.attributes?.some((a) => a.id === selectedSize)
      );
      if (sizeV) setActiveVariant(sizeV);
    } else if (product.variants.length === 1) {
      setActiveVariant(product.variants[0]);
    }
  }, [selectedColor, selectedSize, product]);

  // Non-locking color & size selection: allow switching or deselecting smoothly
  const handleSelectColor = (colorId) => {
    if (colorId === null || selectedColor === colorId) {
      setSelectedColor(null);
      return;
    }
    // If the currently selected size has no matching variant with this color, clear size so user is not stuck
    if (selectedSize) {
      const matchExists = product?.variants?.some((v) =>
        v.attributes?.some((a) => a.id === colorId) &&
        v.attributes?.some((a) => a.id === selectedSize) &&
        v.stock > 0
      );
      if (!matchExists) {
        setSelectedSize(null);
      }
    }
    setSelectedColor(colorId);
  };

  const handleSelectSize = (sizeId) => {
    if (sizeId === null || selectedSize === sizeId) {
      setSelectedSize(null);
      return;
    }
    // If the currently selected color has no matching variant with this size, clear color so user is not stuck
    if (selectedColor) {
      const matchExists = product?.variants?.some((v) =>
        v.attributes?.some((a) => a.id === selectedColor) &&
        v.attributes?.some((a) => a.id === sizeId) &&
        v.stock > 0
      );
      if (!matchExists) {
        setSelectedColor(null);
      }
    }
    setSelectedSize(sizeId);
  };

  const isColorAvailable = (colorId) => {
    if (!product?.variants || product.variants.length === 0) return true;
    if (!selectedSize) {
      return product.variants.some((v) =>
        v.attributes?.some((a) => a.id === colorId) && v.stock > 0
      );
    }
    return product.variants.some(
      (v) =>
        v.attributes?.some((a) => a.id === colorId) &&
        v.attributes?.some((a) => a.id === selectedSize) &&
        v.stock > 0
    );
  };

  const isSizeAvailable = (sizeId) => {
    if (!product?.variants || product.variants.length === 0) return true;
    if (!selectedColor) {
      return product.variants.some((v) =>
        v.attributes?.some((a) => a.id === sizeId) && v.stock > 0
      );
    }
    return product.variants.some(
      (v) =>
        v.attributes?.some((a) => a.id === selectedColor) &&
        v.attributes?.some((a) => a.id === sizeId) &&
        v.stock > 0
    );
  };

  const validateVariantSelection = () => {
    if (!product) return null;

    const hasColors = Array.isArray(product.colors) && product.colors.length > 0;
    const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;

    if (hasColors && !selectedColor) {
      Alert.alert('Color Required', 'Please select a color for this outfit.');
      return null;
    }
    if (hasSizes && !selectedSize) {
      Alert.alert('Size Required', 'Please select a size for this outfit.');
      return null;
    }

    const targetVariant = activeVariant || product.variants?.[0];
    if (!targetVariant) {
      Alert.alert('Unavailable', 'This variation is currently unavailable.');
      return null;
    }

    return targetVariant;
  };

  const handleAddToBag = async () => {
    const targetVariant = validateVariantSelection();
    if (!targetVariant) return;

    setAddingToCart(true);
    setFeedback(null);

    const result = await addToCart(targetVariant.id, quantity);
    setAddingToCart(false);

    if (result.success) {
      setFeedback('Added to your shopping bag!');
      setTimeout(() => setFeedback(null), 3000);
    } else {
      Alert.alert('Could Not Add', result.message || 'Failed to add item to bag.');
    }
  };

  const handleBuyNow = async () => {
    const targetVariant = validateVariantSelection();
    if (!targetVariant) return;

    setAddingToCart(true);
    const result = await addToCart(targetVariant.id, quantity);
    setAddingToCart(false);

    if (result.success) {
      router.push('/checkout');
    } else {
      Alert.alert('Could Not Proceed', result.message || 'Failed to add item to bag.');
    }
  };

  // Review submission
  const handleOpenReviewModal = () => {
    const defaultName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.email?.split('@')[0] || '');
    setNewReviewerName(defaultName);
    setNewRating(5);
    setNewComment('');
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async () => {
    if (!newComment.trim()) {
      Alert.alert('Comment Required', 'Please write a few words about your experience.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await productApi.addReview(product.id, {
        rating: newRating,
        comment: newComment.trim(),
        user_name: newReviewerName.trim() || 'সম্মানিত ক্রেতা',
      });

      // Update reviews state
      setReviewsList((prev) => [res, ...prev]);
      setReviewModalVisible(false);
      Alert.alert('Thank You!', 'Your review has been submitted successfully.');
    } catch (err) {
      console.warn('Failed to submit review:', err);
      Alert.alert('Submission Error', 'Could not post your review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Loading..." />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
        <AppBottomNav currentRoute="/products/[id]" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Product Details" />
        <View style={styles.centerContainer}>
          <Text style={styles.notFoundText}>Product Not Found</Text>
        </View>
        <AppBottomNav currentRoute="/products/[id]" />
      </SafeAreaView>
    );
  }

  // Collect all gallery images: variants + product thumbnail/image + extra images
  const variantImages = (product.variants || []).map((v) => v.image).filter(Boolean);
  const extraImages = (Array.isArray(product.images) ? product.images.map((img) => img.image || img) : []).filter(Boolean);
  const galleryImages = [
    activeVariant?.image,
    product.thumbnail,
    product.image,
    ...variantImages,
    ...extraImages,
  ]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  const price = parseFloat(activeVariant?.price || product.base_price || product.price || product.starting_price || 0);
  const comparePrice = parseFloat(activeVariant?.compare_at_price || product.compare_at_price || 0);
  const discountPercent = calculateDiscountPercent(price, comparePrice);
  const categoryTitle = product.category_name || product.category?.name || (typeof product.category === 'string' ? product.category : '');

  const bottomNavHeight = 60 + Math.max(insets.bottom, 6);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title={product.name || 'Product Details'}
        rightComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={handleToggleWishlist}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorited ? '#e11d48' : theme.colors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Alert.alert('Share', 'Share link copied!')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="share-social-outline" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating feedback message */}
      {Boolean(feedback) && (
        <View style={styles.feedbackToast}>
          <Ionicons name="checkmark-circle" size={16} color={theme.colors.white} />
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 + bottomNavHeight }]}
      >
        {/* Gallery Carousel */}
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImageIndex(idx);
            }}
            scrollEventThrottle={16}
          >
            {galleryImages.length > 0 ? (
              galleryImages.map((img, idx) => {
                const fullUrl = formatImageUrl(img);
                return (
                  <View key={idx} style={styles.slide}>
                    <Image
                      source={{ uri: fullUrl }}
                      style={styles.mainImage}
                      contentFit="cover"
                      transition={300}
                    />
                  </View>
                );
              })
            ) : (
              <View style={styles.slide}>
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={48} color={theme.colors.border} />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Dots Indicator */}
          {galleryImages.length > 1 && (
            <View style={styles.paginationDots}>
              {galleryImages.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === activeImageIndex && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailStrip}
            >
              {galleryImages.map((img, idx) => {
                const fullUrl = formatImageUrl(img);
                const isSelected = idx === activeImageIndex;
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    style={[styles.thumbWrapper, isSelected && styles.thumbWrapperActive]}
                    onPress={() => setActiveImageIndex(idx)}
                  >
                    <Image source={{ uri: fullUrl }} style={styles.thumbImage} contentFit="cover" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Product Details Section */}
        <View style={styles.detailsContainer}>
          {Boolean(categoryTitle) && (
            <Text style={styles.categoryBadge}>{categoryTitle}</Text>
          )}

          <Text style={styles.productTitle}>{product.name}</Text>

          {/* Rating Display */}
          <View style={styles.ratingRow}>
            <View style={styles.ratingStars}>
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text style={styles.ratingScore}>
                {product.average_rating ? Number(product.average_rating).toFixed(1) : '4.8'}
              </Text>
            </View>
            <Text style={styles.reviewCount}>
              ({reviewsList.length > 0 ? `${reviewsList.length} reviews` : '2.5k reviews'})
            </Text>
          </View>

          {/* Pricing Row with Discount Pill */}
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>{formatPrice(price)}</Text>
            {comparePrice > price ? (
              <Text style={styles.originalPrice}>{formatPrice(comparePrice)}</Text>
            ) : null}
            {discountPercent > 0 ? (
              <View style={styles.discountPill}>
                <Text style={styles.discountPillText}>-{discountPercent}%</Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          <Text style={styles.shortDescription}>
            {product.description ||
              'Beautiful high quality design for your little ones. Soft fabric, comfortable and stylish.'}
          </Text>

          {/* Variants Selector */}
          <VariantSelector
            colors={product.colors}
            sizes={product.sizes}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            onSelectColor={handleSelectColor}
            onSelectSize={handleSelectSize}
            isColorAvailable={isColorAvailable}
            isSizeAvailable={isSizeAvailable}
            activeVariant={activeVariant}
          />

          {/* Quantity Stepper Row */}
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <QuantityStepper
              quantity={quantity}
              maxQuantity={activeVariant?.stock || 99}
              onChange={setQuantity}
            />
          </View>

          {/* Product Description */}
          {Boolean(product.description) && (
            <View style={styles.descSection}>
              <Text style={styles.descHeading}>Product Description</Text>
              <Text style={styles.descText}>{product.description}</Text>
            </View>
          )}

          {/* Customer Reviews & Comments Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <View>
                <Text style={styles.reviewsTitle}>
                  Customer Reviews ({reviewsList.length})
                </Text>
                <Text style={styles.reviewsSubtitle}>Feedback from verified families</Text>
              </View>
              <TouchableOpacity
                style={styles.addReviewBtn}
                activeOpacity={0.8}
                onPress={handleOpenReviewModal}
              >
                <Ionicons name="create-outline" size={15} color={theme.colors.white} />
                <Text style={styles.addReviewBtnText}>Write Review</Text>
              </TouchableOpacity>
            </View>

            {reviewsList.length > 0 ? (
              reviewsList.map((r, i) => (
                <View key={r.id || i} style={styles.reviewItem}>
                  <View style={styles.reviewTop}>
                    <View style={styles.reviewerInfo}>
                      <View style={styles.reviewerAvatar}>
                        <Text style={styles.reviewerAvatarText}>
                          {(r.user_name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.reviewerName}>{r.user_name || 'Verified Customer'}</Text>
                        <Text style={styles.reviewDate}>
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name={s <= (r.rating || 5) ? 'star' : 'star-outline'}
                          size={13}
                          color="#f59e0b"
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{r.comment}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyReviews}>
                <Ionicons name="chatbubble-ellipses-outline" size={28} color={theme.colors.border} />
                <Text style={styles.emptyReviewsText}>No reviews yet.</Text>
                <TouchableOpacity onPress={handleOpenReviewModal}>
                  <Text style={styles.firstReviewPrompt}>Be the first to share your thoughts!</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Assurance Box */}
          <View style={styles.guaranteeBox}>
            <View style={styles.guaranteeRow}>
              <Ionicons name="sparkles-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.guaranteeText}>100% genuine premium export quality cotton</Text>
            </View>
            <View style={styles.guaranteeRow}>
              <Ionicons name="car-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.guaranteeText}>Fast doorstep delivery with Cash on Delivery</Text>
            </View>
            <View style={styles.guaranteeRow}>
              <Ionicons name="repeat-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.guaranteeText}>7-day hassle-free size exchange guarantee</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={[styles.bottomBar, { bottom: bottomNavHeight }]}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceLabel}>Total:</Text>
          <Text style={styles.bottomPriceVal}>{formatPrice(price * quantity)}</Text>
        </View>

        <View style={styles.bottomButtons}>
          <CustomButton
            title="Add to Bag"
            variant="outline"
            icon="bag-outline"
            style={styles.addBtn}
            loading={addingToCart}
            onPress={handleAddToBag}
          />
          <CustomButton
            title="Buy Now"
            variant="primary"
            style={styles.buyBtn}
            loading={addingToCart}
            onPress={handleBuyNow}
          />
        </View>
      </View>

      {/* Review Submission Modal */}
      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity
                onPress={() => setReviewModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Star Rating Picker */}
            <View style={styles.starPickerRow}>
              <Text style={styles.ratingPickerLabel}>Your Rating:</Text>
              <View style={styles.starsSelectGroup}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    activeOpacity={0.7}
                    onPress={() => setNewRating(star)}
                    style={{ padding: 4 }}
                  >
                    <Ionicons
                      name={star <= newRating ? 'star' : 'star-outline'}
                      size={28}
                      color="#f59e0b"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reviewer Name */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Your Name</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Tanbir Hasan"
                value={newReviewerName}
                onChangeText={setNewReviewerName}
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>

            {/* Comment Body */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Your Experience / Comment *</Text>
              <TextInput
                style={[styles.inputField, styles.textArea]}
                placeholder="Describe fabric quality, sizing, delivery..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitReviewBtn, submittingReview && { opacity: 0.7 }]}
              activeOpacity={0.85}
              disabled={submittingReview}
              onPress={handleSubmitReview}
            >
              {submittingReview ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text style={styles.submitReviewBtnText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Persistent Bottom Navigation */}
      <AppBottomNav currentRoute="/products/[id]" />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  feedbackToast: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  feedbackText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
  },
  scrollContent: {
    flexGrow: 1,
  },
  galleryContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: GALLERY_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
  },
  activeDot: {
    width: 18,
    backgroundColor: theme.colors.primary,
  },
  thumbnailStrip: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 12,
    gap: 8,
  },
  thumbWrapper: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  thumbWrapperActive: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  productTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.text,
    lineHeight: 28,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  ratingScore: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#b45309',
  },
  reviewCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.primary,
  },
  originalPrice: {
    fontSize: 15,
    color: theme.colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  discountPill: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  discountPillText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.extrabold,
    color: '#ef4444',
  },
  shortDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 4,
  },
  quantityLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  descSection: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  descHeading: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 6,
  },
  descText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 21,
  },
  reviewsSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  reviewsTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.text,
  },
  reviewsSubtitle: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    marginTop: 1,
  },
  addReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
  },
  addReviewBtnText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  reviewItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerAvatarText: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  reviewerName: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  reviewDate: {
    fontSize: 10,
    color: theme.colors.textTertiary,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  emptyReviews: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyReviewsText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  firstReviewPrompt: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  guaranteeBox: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: '#faf5ff',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#f3e8ff',
    gap: 8,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guaranteeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 8,
  },
  bottomPriceCol: {
    gap: 2,
  },
  bottomPriceLabel: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
  },
  bottomPriceVal: {
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.primary,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addBtn: {
    paddingHorizontal: 16,
    height: 42,
  },
  buyBtn: {
    paddingHorizontal: 22,
    height: 42,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.text,
  },
  starPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  ratingPickerLabel: {
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  starsSelectGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  formGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  inputField: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: theme.colors.text,
  },
  textArea: {
    height: 80,
  },
  submitReviewBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitReviewBtnText: {
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
});
