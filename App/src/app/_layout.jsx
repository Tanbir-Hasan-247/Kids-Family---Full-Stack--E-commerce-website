import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../context/AuthContext';
import { ShopSettingsProvider } from '../context/ShopSettingsContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';

// Keep splash screen visible until app is mounted
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after initialization
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <ShopSettingsProvider>
        <CartProvider>
          <WishlistProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="welcome" options={{ headerShown: false }} />
              <Stack.Screen name="products/index" options={{ headerShown: false }} />
              <Stack.Screen name="products/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="wishlist" options={{ headerShown: false }} />
              <Stack.Screen name="ai" options={{ headerShown: false }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
              <Stack.Screen name="checkout" options={{ headerShown: false }} />
              <Stack.Screen name="order-success/[orderNumber]" options={{ headerShown: false }} />
              <Stack.Screen name="orders/index" options={{ headerShown: false }} />
              <Stack.Screen name="orders/[orderNumber]" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="register" options={{ headerShown: false, presentation: 'modal' }} />
            </Stack>
          </WishlistProvider>
        </CartProvider>
      </ShopSettingsProvider>
    </AuthProvider>
  );
}
