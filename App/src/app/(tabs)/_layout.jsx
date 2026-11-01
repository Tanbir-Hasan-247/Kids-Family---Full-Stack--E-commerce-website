import React from 'react';
import { Tabs } from 'expo-router';
import AppBottomNav from '../../components/layout/AppBottomNav';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={() => <AppBottomNav />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="categories" options={{ title: 'Categories' }} />
      <Tabs.Screen name="cart" options={{ title: 'Bag' }} />
      <Tabs.Screen name="profile" options={{ title: 'Account' }} />
    </Tabs>
  );
}
