import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { theme } from '../constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found', headerShown: true }} />
      <View style={styles.container}>
        <Text style={styles.title}>Screen Not Found</Text>
        <Text style={styles.sub}>The requested page does not exist.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.buttonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  sub: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
  button: {
    marginTop: 20,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.radius.full,
  },
  buttonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
});
