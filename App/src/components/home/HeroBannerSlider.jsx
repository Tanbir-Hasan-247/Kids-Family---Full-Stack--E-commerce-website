import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { bannerApi } from '../../api/bannerApi';
import { formatImageUrl } from '../../utils/imageHelper';
import { theme } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - theme.spacing.lg * 2;
// Default aspect ratio for Kids & Family banners (2400x880 ~= 2.727)
const DEFAULT_ASPECT_RATIO = 2400 / 880;

export default function HeroBannerSlider() {
  const router = useRouter();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO);
  const flatListRef = useRef(null);
  const timerRef = useRef(null);

  const bannerHeight = Math.round(BANNER_WIDTH / aspectRatio);

  useEffect(() => {
    let isMounted = true;
    const fetchSliders = async () => {
      try {
        let list = await bannerApi.getHeroSliders();
        if (!list || list.length === 0) {
          list = await bannerApi.getLiveBanners();
        }
        if (isMounted) {
          setBanners(Array.isArray(list) ? list : list?.results || []);
        }
      } catch (err) {
        console.warn('Failed to load sliders:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSliders();
    return () => {
      isMounted = false;
    };
  }, []);

  // 5-second Auto-scroll
  useEffect(() => {
    if (banners.length <= 1) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % banners.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length]);

  const handleBannerPress = (banner) => {
    const link = banner.link_url || banner.link || '';
    if (link) {
      if (link.includes('cat=')) {
        const catMatch = link.match(/cat=([^&]+)/);
        if (catMatch) {
          router.push({ pathname: '/products', params: { category: catMatch[1] } });
          return;
        }
      }
      if (link.includes('/products/')) {
        const idMatch = link.match(/\/products\/(\d+)/);
        if (idMatch) {
          router.push(`/products/${idMatch[1]}`);
          return;
        }
      }
    }
    router.push('/products');
  };

  const handleMomentumScrollEnd = (e) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / (BANNER_WIDTH + theme.spacing.md));
    if (index >= 0 && index < banners.length) {
      setActiveIndex(index);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.placeholder, { height: bannerHeight }]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (banners.length === 0) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.defaultCard, { height: bannerHeight }]}
          onPress={() => router.push('/products')}
        >
          <View style={styles.defaultContent}>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>SPECIAL OFFER</Text>
            </View>
            <Text style={styles.defaultTitle}>Up to 50% OFF On Fashion</Text>
            <Text style={styles.defaultSub}>Discover curated outfits for your little ones</Text>
            <View style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Shop Now →</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        horizontal
        pagingEnabled={false}
        snapToInterval={BANNER_WIDTH + theme.spacing.md}
        snapToAlignment="center"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item }) => {
          const imgUrl = formatImageUrl(item.mobile_image || item.image);
          return (
            <TouchableOpacity
              activeOpacity={0.92}
              style={[styles.slide, { height: bannerHeight }]}
              onPress={() => handleBannerPress(item)}
            >
              {imgUrl ? (
                <Image
                  source={{ uri: imgUrl }}
                  style={styles.bannerImage}
                  contentFit="cover"
                  transition={200}
                  onLoad={(e) => {
                    if (e?.source?.width && e?.source?.height) {
                      const ratio = e.source.width / e.source.height;
                      if (ratio > 0.5 && Math.abs(ratio - aspectRatio) > 0.05) {
                        setAspectRatio(ratio);
                      }
                    }
                  }}
                />
              ) : (
                <View style={styles.textBannerContent}>
                  {item.badge_text ? (
                    <View style={styles.badgePill}>
                      <Text style={styles.badgePillText}>{item.badge_text}</Text>
                    </View>
                  ) : null}
                  {item.title ? (
                    <Text style={styles.slideTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  ) : null}
                  {item.subtitle ? (
                    <Text style={styles.slideSubtitle} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                  {item.cta_text ? (
                    <View style={styles.ctaButton}>
                      <Text style={styles.ctaButtonText}>{item.cta_text}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Pagination Dots */}
      {banners.length > 1 ? (
        <View style={styles.dotsContainer}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.sm,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  placeholder: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 16,
    marginHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    width: BANNER_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    position: 'relative',
    ...theme.shadows.sm,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  textBannerContent: {
    padding: 16,
    justifyContent: 'center',
    height: '100%',
    backgroundColor: '#4c1d95',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    padding: 16,
    justifyContent: 'flex-end',
  },
  badgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgePillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  slideTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  slideSubtitle: {
    fontSize: 11,
    color: '#e2e8f0',
    marginTop: 2,
    marginBottom: 8,
    lineHeight: 15,
  },
  ctaButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    color: '#4c1d95',
    fontSize: 11,
    fontWeight: '900',
  },
  defaultCard: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: 16,
    backgroundColor: '#4c1d95',
    padding: theme.spacing.lg,
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  defaultContent: {
    maxWidth: '85%',
  },
  defaultTag: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  defaultTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.white,
    lineHeight: 24,
  },
  defaultSub: {
    fontSize: theme.typography.fontSize.xs,
    color: '#cbd5e1',
    marginTop: 6,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
  },
  activeDot: {
    width: 20,
    backgroundColor: theme.colors.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#e2e8f0',
  },
});
