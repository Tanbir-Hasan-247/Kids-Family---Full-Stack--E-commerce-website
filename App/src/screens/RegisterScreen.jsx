import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../constants/config';
import { theme } from '../constants/theme';
import Header from '../components/common/Header';
import CustomButton from '../components/common/CustomButton';
import AppBottomNav from '../components/layout/AppBottomNav';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const router = useRouter();
  const { register, loginWithGoogle } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Email/Password registration
  const handleRegister = async () => {
    if (!fullName.trim() || !phone.trim() || !password) {
      Alert.alert('Required Fields', 'Please fill in Name, Phone, and Password.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'The passwords entered do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const names = fullName.trim().split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';

    const payload = {
      first_name: firstName,
      last_name: lastName,
      phone: phone.trim(),
      password,
      password2: confirmPassword,
    };
    if (email.trim()) {
      payload.email = email.trim();
    }

    const result = await register(payload);
    setLoading(false);

    if (result.success) {
      Alert.alert('Registration Successful', 'Welcome to Kids & Family! Enjoy shopping.', [
        {
          text: 'Get Started',
          onPress: () => router.replace('/(tabs)/home'),
        },
      ]);
    } else {
      Alert.alert('Registration Failed', result.message || 'Please check your inputs and try again.');
    }
  };

  // Google OAuth registration & login
  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      const appBaseUrl = Linking.createURL('/');
      const redirectUrl = Linking.createURL('/register');
      const authUrl = `${API_BASE_URL}/auth/google/login/?frontend_url=${encodeURIComponent(appBaseUrl)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url);
        const access = parsed.queryParams?.access;
        const refresh = parsed.queryParams?.refresh;

        if (access && refresh) {
          const loginRes = await loginWithGoogle({ access, refresh });
          if (loginRes.success) {
            Alert.alert('Success', 'Google Account connected successfully!');
            router.replace('/(tabs)/home');
            return;
          } else {
            Alert.alert('Notice', loginRes.message || 'Could not verify Google tokens.');
          }
        }
      }
    } catch (err) {
      Alert.alert('Google Sign-In', err?.message || 'Unable to connect to Google service.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Create Account" showBack={router.canGoBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Banner */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Ionicons name="sparkles" size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Kids & Family for premium family shopping</Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <View style={styles.field}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Tanbir Hasan"
                  placeholderTextColor={theme.colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="tanbir@gmail.com"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={18} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="017XXXXXXXX"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password (min 6 chars)"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            <CustomButton
              title="Register"
              variant="primary"
              loading={loading}
              onPress={handleRegister}
              style={styles.registerBtn}
            />

            {/* Social Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign up with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-Up Button */}
            <TouchableOpacity
              style={styles.googleFullBtn}
              onPress={handleGoogleRegister}
              disabled={googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color="#ea4335" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#ea4335" />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Switch to Login */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}> Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Persistent Bottom Navigation - ALWAYS VISIBLE */}
      <AppBottomNav currentRoute="/(tabs)/profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 90,
    gap: theme.spacing.md,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
  },
  registerBtn: {
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  googleFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 14,
    ...theme.shadows.sm,
  },
  googleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.primary,
  },
});
