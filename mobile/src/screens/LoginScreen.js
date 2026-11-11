import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { loginUser } from '../services/api';

export default function LoginScreen({ onAuthSuccess, onNavigateToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleLogin = async () => {
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid university email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    const result = await loginUser({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (result && result.success) {
      onAuthSuccess(result.user);
    } else {
      setError(result?.message || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Campus Tagline Banner */}
        <View style={styles.taglineBanner}>
          <Text style={styles.taglineBannerText}>
            🎭 MSEUF UNIVERSITY THEATER • SIGN IN PORTAL
          </Text>
        </View>

        <View style={styles.card}>
          {/* University Badge & Page Heading */}
          <View style={styles.headerSection}>
            <View style={styles.badgeRow}>
              <View style={styles.euMiniCrest}>
                <Text style={styles.euMiniCrestText}>EU</Text>
              </View>
              <Text style={styles.badgeLabel}>ACCOUNT AUTHENTICATION</Text>
            </View>
            <Text style={styles.title}>Sign In to Your Account</Text>
            <Text style={styles.subtitle}>
              Enter your MSEUF email and password to browse campus shows and reserve auditorium seats.
            </Text>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>UNIVERSITY EMAIL ADDRESS *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="student@mseuf.edu.ph"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password with Show/Hide toggle */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PASSWORD *</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit CTA */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Sign In to Portal ›</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Credentials */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>⚡ QUICK DEMO ACCOUNTS</Text>
            <View style={styles.demoRow}>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => fillDemo('student@mseuf.edu.ph', 'password')}
              >
                <Text style={styles.demoChipLabel}>🎓 Student Demo</Text>
                <Text style={styles.demoChipSub}>student@mseuf.edu.ph</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => fillDemo('admin@mseuf.edu.ph', 'password')}
              >
                <Text style={styles.demoChipLabel}>🔑 Admin Demo</Text>
                <Text style={styles.demoChipSub}>admin@mseuf.edu.ph</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Link to Separate Register Screen */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an MSEUF Theater account?</Text>
            <TouchableOpacity onPress={onNavigateToRegister}>
              <Text style={styles.footerLink}>Create Student Account →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  taglineBanner: {
    backgroundColor: COLORS.maroonPale,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.maroonBorder,
    alignItems: 'center',
  },
  taglineBannerText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.maroon,
    letterSpacing: 0.5,
  },
  card: {
    margin: 16,
    maxWidth: 460,
    width: '92%',
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerSection: {
    marginBottom: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  euMiniCrest: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.maroon,
    borderWidth: 1.5,
    borderColor: COLORS.vipGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  euMiniCrestText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.maroon,
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  errorBox: {
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 11,
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eyeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  submitBtn: {
    marginTop: 6,
    backgroundColor: COLORS.maroon,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.maroonDark,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  demoSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoChip: {
    flex: 1,
    backgroundColor: COLORS.maroonPale,
    borderWidth: 1,
    borderColor: COLORS.maroonBorder,
    borderRadius: 10,
    padding: 8,
  },
  demoChipLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  demoChipSub: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  footerRow: {
    alignItems: 'center',
    gap: 4,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.maroon,
    marginTop: 2,
  },
});
