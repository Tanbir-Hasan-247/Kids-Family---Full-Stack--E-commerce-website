// Home Perks & Trust Bar (matching website HomePerksBar.jsx)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export default function HomePerksBar() {
  const perks = [
    {
      icon: 'car-outline',
      bg: '#ecfdf5',
      color: '#065f46',
      title: 'ক্যাশ অন ডেলিভারি',
      desc: 'পার্সেল খুলে চেক করে টাকা দিন',
    },
    {
      icon: 'repeat-outline',
      bg: '#fef3c7',
      color: '#92400e',
      title: '৭ দিনের ফ্রি এক্সচেঞ্জ',
      desc: 'সাইজ সহজেই পরিবর্তন করুন',
    },
    {
      icon: 'shield-checkmark-outline',
      bg: '#eff6ff',
      color: '#1e40af',
      title: '১০০% কম্বড সুতি কাপড়',
      desc: 'কোমল ত্বকের জন্য নিরাপদ',
    },
    {
      icon: 'headset-outline',
      bg: '#faf5ff',
      color: '#6b21a8',
      title: 'সরাসরি সাপোর্ট',
      desc: 'কল বা হোয়াটসঅ্যাপে অর্ডার',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {perks.map((item, index) => (
          <View key={index} style={styles.card}>
            <View style={[styles.iconWrapper, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: theme.colors.white,
    padding: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...theme.shadows.sm,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.text,
  },
  desc: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 12,
  },
});

