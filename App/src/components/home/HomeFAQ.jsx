// Frequently Asked Questions Component (matching website HomeFAQ.jsx)
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

const FAQ_ITEMS = [
  {
    id: 1,
    question: 'ডেলিভারি পেতে কতদিন সময় লাগবে?',
    answer:
      'ঢাকা সিটির ভেতরে অর্ডার কনফার্ম করার ১ থেকে ২ দিনের মধ্যে হোম ডেলিভারি পৌঁছে দেওয়া হয়। আর ঢাকার বাইরে দেশের যেকোনো জেলা বা উপজেলায় ২ থেকে ৩ কার্যদিবসের মধ্যে কুরিয়ারের মাধ্যমে আপনার ঠিকানায় পার্সেল পৌঁছে যাবে।',
  },
  {
    id: 2,
    question: 'আমি কি ডেলিভারির সময় পার্সেল খুলে চেক করে টাকা দিতে পারব?',
    answer:
      'হ্যাঁ, অবশ্যই! আমাদের ডেলিভারি ম্যানের সামনে আপনি পার্সেলটি খুলে কাপড়ের কোয়ালিটি, কালার ও সাইজ নিখুঁতভাবে চেক করে সন্তুষ্ট হলে তবেই ক্যাশ অন ডেলিভারিতে টাকা পরিশোধ করবেন। কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই।',
  },
  {
    id: 3,
    question: 'কাপড়ের সাইজ ছোট বা বড় হলে কি পরিবর্তন (Exchange) করা যাবে?',
    answer:
      'জি, পার্সেল রিসিভ করার পর ৭ দিনের মধ্যে যেকোনো সাইজ বা কালার সম্পূর্ণ বিনামূল্যে পরিবর্তন করে নিতে পারবেন। এর জন্য আমাদের হোয়াটসঅ্যাপে শুধু আপনার অর্ডার নাম্বার ও বাচ্চার সঠিক সাইজ জানালেই আমাদের টিম দ্রুত রিপ্লেসমেন্ট পার্সেল পাঠিয়ে দেবে।',
  },
  {
    id: 4,
    question: 'পোশাকগুলো কি ১০০% খাঁটি সুতি এবং শিশুদের কোমল ত্বকের জন্য নিরাপদ?',
    answer:
      'আমাদের প্রতিটি পোশাক ১০০% প্রিমিয়াম কম্বড কটন দিয়ে তৈরি, যা বাচ্চাদের সংবেদনশীল ত্বকের জন্য অত্যন্ত নরম, আরামদায়ক ও ঘাম-প্রতিরোধী। কোনো ধরনের ক্ষতিকর ডাই বা অস্বস্তিকর কৃত্রিম সুতা ব্যবহার করা হয় না।',
  },
  {
    id: 5,
    question: 'পেমেন্ট কীভাবে করা যাবে? বিকাশ বা কার্ডে কি পেমেন্ট করা যায়?',
    answer:
      'পণ্য হাতে পাওয়ার পর সম্পূর্ণ ক্যাশ অন ডেলিভারিতে (Cash on Delivery) টাকা দেওয়া যায়। এছাড়া আপনি চাইলে ডেলিভারি ম্যানের কাছে বিকাশ, নগদ কিংবা রকেটের মাধ্যমেও সহজেই পেমেন্ট সম্পন্ন করতে পারবেন।',
  },
];

export default function HomeFAQ() {
  const [openId, setOpenId] = useState(1);

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="help-circle" size={14} color="#92400e" />
          <Text style={styles.badgeText}>সচরাচর জিজ্ঞাসা</Text>
        </View>
        <Text style={styles.title}>আপনার সব প্রশ্নের স্পষ্ট উত্তর</Text>
      </View>

      <View style={styles.accordionList}>
        {FAQ_ITEMS.map((item) => {
          const isOpen = openId === item.id;
          return (
            <View key={item.id} style={styles.itemCard}>
              <TouchableOpacity
                style={styles.questionRow}
                activeOpacity={0.8}
                onPress={() => toggle(item.id)}
              >
                <Text style={styles.questionText}>{item.question}</Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answerText}>{item.answer}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.md,
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
  },
  accordionList: {
    gap: 8,
  },
  itemCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    gap: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 18,
  },
  answerContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  answerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
});

