// Real Customer Photo Reviews Component (matching website HomePhotoReviews.jsx)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { productApi } from '../../api/productApi';
import { formatImageUrl } from '../../utils/imageHelper';
import { theme } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.65;

export default function HomePhotoReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      try {
        const res = await productApi.getPhotoReviews();
        const list = Array.isArray(res) ? res : res?.results || [];
        if (isMounted) {
          setReviews(list.filter((r) => r.image || r.image_url));
        }
      } catch (err) {
        console.warn('Failed to load photo reviews:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  if (reviews.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="camera" size={14} color="#92400e" />
          <Text style={styles.badgeText}>আসল কাস্টমার ফটো রিভিউ</Text>
        </View>
        <Text style={styles.title}>আমাদের কিউট কাস্টমাররা কেমন সেজেছে! 📸</Text>
        <Text style={styles.subtitle}>
          অভিভাবকদের শেয়ার করা আসল ছবি ও অভিজ্ঞতা দেখে সম্পূর্ণ নিশ্চিত হয়ে অর্ডার করুন।
        </Text>
      </View>

      {/* Horizontal Photo Reviews List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 12}
      >
        {reviews.map((item) => {
          const imgUrl = formatImageUrl(item.image_url || item.image);
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              style={styles.reviewCard}
              onPress={() => setActivePhoto(imgUrl)}
            >
              {/* Review Photo */}
              <View style={styles.imageContainer}>
                {imgUrl ? (
                  <Image
                    source={{ uri: imgUrl }}
                    style={styles.reviewImage}
                    contentFit="cover"
                    transition={250}
                  />
                ) : null}
                <View style={styles.verifiedPill}>
                  <Ionicons name="checkmark-circle" size={12} color="#065f46" />
                  <Text style={styles.verifiedText}>ভেরিফাইড কাস্টমার</Text>
                </View>
              </View>

              {/* Review Info */}
              <View style={styles.infoContainer}>
                {/* Rating Stars */}
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name="star"
                      size={13}
                      color="#f59e0b"
                    />
                  ))}
                  <Text style={styles.ratingText}>5.0</Text>
                </View>

                {/* Customer Name */}
                <Text style={styles.customerName} numberOfLines={1}>
                  {item.user_name || 'সন্তুষ্ট কাস্টমার'}
                </Text>

                {/* Comment */}
                <Text style={styles.comment} numberOfLines={3}>
                  "{item.comment || 'কাপড়ের কোয়ালিটি অনেক সুন্দর ও আরামদায়ক।'}"
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Full Screen Image Lightbox Modal */}
      <Modal
        visible={Boolean(activePhoto)}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePhoto(null)}
      >
        <View style={styles.modalBg}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setActivePhoto(null)}
          >
            <Ionicons name="close" size={28} color={theme.colors.white} />
          </TouchableOpacity>
          {activePhoto ? (
            <Image
              source={{ uri: activePhoto }}
              style={styles.fullImage}
              contentFit="contain"
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.lg,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.full,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#92400e',
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  scrollList: {
    paddingHorizontal: theme.spacing.lg,
    gap: 12,
    paddingVertical: 8,
  },
  reviewCard: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...theme.shadows.sm,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: theme.colors.surfaceMuted,
    position: 'relative',
  },
  reviewImage: {
    width: '100%',
    height: '100%',
  },
  verifiedPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065f46',
  },
  infoContainer: {
    padding: 12,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
    marginLeft: 4,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  comment: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullImage: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_WIDTH * 1.3,
  },
});

