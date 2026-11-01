import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { aiApi } from '../api/aiApi';
import { formatImageUrl } from '../utils/imageHelper';
import { formatPrice } from '../utils/currency';
import { theme } from '../constants/theme';
import Header from '../components/common/Header';
import AppBottomNav from '../components/layout/AppBottomNav';

export default function AIScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomNavHeight = 60 + Math.max(insets.bottom, 6);
  const scrollViewRef = useRef(null);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: 'আসসালামু আলাইকুম! আমি Kids & Family-এর স্মার্ট শপিং অ্যাসিস্ট্যান্ট 🤖\n\nপোশাক পছন্দ করা, সাইজ জানা কিংবা আপনার অর্ডার ট্র্যাক ও পরিবর্তন করতে আমি আপনাকে সাহায্য করতে পারি। আজ কি খুঁজছেন?',
      products: [],
      order: null,
    },
  ]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async (customText = null) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setLoading(true);

    try {
      // Build conversation history for API
      const history = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        text: m.text,
      }));

      const res = await aiApi.sendChatMessage(textToSend, history);

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: res.reply || 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি।',
        products: Array.isArray(res.products) ? res.products : [],
        order: res.order || null,
        orderDraft: res.order_draft || null,
        confirmationRequested: Boolean(res.order_confirmation_requested),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.warn('AI chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: 'দুঃখিত, সংযোগে সাময়িক সমস্যা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
          products: [],
          order: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'মেয়েদের ফ্রক দেখান',
    'ছেলেদের পাঞ্জাবি কালেকশন',
    'আমার অর্ডার ট্র্যাক করুন',
    'ডেলিভারি পলিসি কি?',
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="AI Assistant"
        rightComponent={
          <View style={styles.aiBadgePill}>
            <Ionicons name="sparkles" size={12} color="#8b5cf6" />
            <Text style={styles.aiBadgeText}>Gemini 2.5</Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.chatContent, { paddingBottom: 80 + bottomNavHeight }]}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((item) => {
            const isUser = item.role === 'user';
            return (
              <View
                key={item.id}
                style={[styles.messageBubbleRow, isUser ? styles.rowUser : styles.rowAssistant]}
              >
                {!isUser && (
                  <View style={styles.botAvatar}>
                    <Ionicons name="sparkles" size={16} color={theme.colors.white} />
                  </View>
                )}

                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
                  <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
                    {item.text}
                  </Text>

                  {/* Inline Products Grid (Matching Figma Screen 13) */}
                  {item.products && item.products.length > 0 && (
                    <View style={styles.productsGrid}>
                      {item.products.slice(0, 4).map((prod) => {
                        const img = formatImageUrl(prod.thumbnail || prod.image);
                        const price = prod.starting_price || prod.price || prod.base_price;
                        return (
                          <TouchableOpacity
                            key={prod.id}
                            style={styles.productCard}
                            activeOpacity={0.85}
                            onPress={() => router.push(`/products/${prod.id}`)}
                          >
                            <View style={styles.productImgBox}>
                              {img ? (
                                <Image source={{ uri: img }} style={styles.productImg} contentFit="cover" />
                              ) : (
                                <Ionicons name="shirt-outline" size={20} color={theme.colors.textMuted} />
                              )}
                            </View>
                            <Text style={styles.productName} numberOfLines={1}>
                              {prod.name}
                            </Text>
                            <Text style={styles.productPrice}>{formatPrice(price)}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Inline Order Status Card (Matching Figma Screen 13) */}
                  {item.order && (
                    <View style={styles.orderCard}>
                      <View style={styles.orderCardTop}>
                        <Text style={styles.orderCardNum}>#{item.order.order_number}</Text>
                        <View style={styles.orderStatusPill}>
                          <Text style={styles.orderStatusPillText}>
                            {item.order.status || 'Processing'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.orderStepperNotice}>
                        Pending ➔ Confirmed ➔ Processing
                      </Text>
                      <View style={styles.orderActionsRow}>
                        <TouchableOpacity
                          style={styles.orderActionBtn}
                          onPress={() => handleSend(`অর্ডার #${item.order.order_number} ঠিকানা পরিবর্তন করতে চাই`)}
                        >
                          <Text style={styles.orderActionText}>Change address</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.orderActionBtn, styles.orderCancelBtn]}
                          onPress={() => handleSend(`অর্ডার #${item.order.order_number} বাতিল করতে চাই`)}
                        >
                          <Text style={[styles.orderActionText, styles.orderCancelText]}>Cancel order</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={[styles.messageBubbleRow, styles.rowAssistant]}>
              <View style={styles.botAvatar}>
                <Ionicons name="sparkles" size={16} color={theme.colors.white} />
              </View>
              <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.typingText}>উত্তরের প্রস্তুতি নিচ্ছে...</Text>
              </View>
            </View>
          )}

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <View style={styles.quickPromptsContainer}>
              <Text style={styles.quickPromptsTitle}>দ্রুত জানতে ট্যাপ করুন:</Text>
              <View style={styles.quickPromptsRow}>
                {quickPrompts.map((p, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickPill}
                    onPress={() => handleSend(p)}
                  >
                    <Text style={styles.quickPillText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={[styles.inputBar, { bottom: bottomNavHeight }]}>
          <TextInput
            style={styles.inputField}
            placeholder="মেসেজ লিখুন..."
            placeholderTextColor={theme.colors.textMuted}
            value={inputMessage}
            onChangeText={setInputMessage}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputMessage.trim() && styles.sendBtnDisabled]}
            disabled={!inputMessage.trim() || loading}
            onPress={() => handleSend()}
          >
            <Ionicons name="send" size={18} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Persistent Bottom Navigation - ALWAYS VISIBLE */}
      <AppBottomNav currentRoute="/(tabs)" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  aiBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6b21a8',
  },
  chatContent: {
    padding: theme.spacing.md,
    gap: 12,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  bubbleText: {
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 19,
  },
  bubbleTextUser: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  productCard: {
    width: '47%',
    backgroundColor: '#faf5ff',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  productImgBox: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceMuted,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  productImg: {
    width: '100%',
    height: '100%',
  },
  productName: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text,
  },
  productPrice: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.primary,
    marginTop: 2,
  },
  orderCard: {
    marginTop: 10,
    backgroundColor: '#f5f3ff',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCardNum: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  orderStatusPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  orderStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
  },
  orderStepperNotice: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  orderActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  orderActionBtn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  orderActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  orderCancelBtn: {
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
  },
  orderCancelText: {
    color: '#e11d48',
  },
  quickPromptsContainer: {
    marginTop: 12,
    padding: 8,
  },
  quickPromptsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  quickPromptsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickPill: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  inputBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.md,
  },
  inputField: {
    flex: 1,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    height: 40,
    fontSize: 12,
    color: theme.colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});

