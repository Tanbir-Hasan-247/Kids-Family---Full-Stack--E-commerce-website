// Onboarding / Welcome Screen - Matching Screen 2 of High-Fidelity Mockup
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import CustomButton from '../components/common/CustomButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to Kids & Family',
    subtitle: 'Discover the best fashion for your little ones. Curated outfits designed with love and pure comfort.',
    icon: 'bag-handle',
    badgeText: 'Curated Fashion',
    badgeColor: '#ede9fe',
    iconColor: '#7c3aed',
  },
  {
    id: '2',
    title: 'Family Matching Outfits',
    subtitle: 'Coordinate style with matching sets for siblings, parents, and festive family celebrations.',
    icon: 'people',
    badgeText: 'Sibling & Family',
    badgeColor: '#fce7f3',
    iconColor: '#db2777',
  },
  {
    id: '3',
    title: 'Smart AI Shopping',
    subtitle: 'Ask our AI assistant in Bangla or English to recommend sizes, find gifts, and track orders instantly.',
    icon: 'sparkles',
    badgeText: 'AI Powered',
    badgeColor: '#fef3c7',
    iconColor: '#d97706',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    router.replace('/(tabs)');
  };

  const slide = SLIDES[currentSlide];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header with Skip */}
      <View style={styles.topHeader}>
        <View style={styles.placeholder} />
        <TouchableOpacity
          onPress={handleFinish}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.skipBtn}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Illustration Area */}
      <View style={styles.illustrationWrapper}>
        <View style={[styles.mainIconCircle, { backgroundColor: slide.badgeColor }]}>
          <Ionicons name={slide.icon} size={84} color={slide.iconColor} />
          {/* Floating decorative elements */}
          <View style={[styles.floatingDot, styles.float1]}>
            <Ionicons name="sparkles" size={18} color="#f59e0b" />
          </View>
          <View style={[styles.floatingDot, styles.float2]}>
            <Ionicons name="heart" size={16} color="#e11d48" />
          </View>
        </View>

        <View style={styles.badgePill}>
          <Text style={[styles.badgeText, { color: slide.iconColor }]}>
            {slide.badgeText}
          </Text>
        </View>
      </View>

      {/* Text Info */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        {/* 3-Dots Pagination Indicator */}
        <View style={styles.paginationRow}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                currentSlide === idx && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom Action Button & Wave */}
      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
        <TouchableOpacity
          style={styles.getStartedBtn}
          activeOpacity={0.88}
          onPress={handleNext}
        >
          <Text style={styles.getStartedText}>
            {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={theme.colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf9fd',
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  placeholder: {
    width: 40,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  mainIconCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  floatingDot: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  float1: {
    top: 10,
    right: 10,
  },
  float2: {
    bottom: 20,
    left: 10,
  },
  badgePill: {
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  textContainer: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e1b4b',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  paginationRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  bottomContainer: {
    paddingHorizontal: 28,
  },
  getStartedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  getStartedText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});

