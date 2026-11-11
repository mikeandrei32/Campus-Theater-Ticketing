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
import { registerUser } from '../services/api';

export default function RegisterScreen({ onAuthSuccess, onNavigateToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const passwordLongEnough = password.length >= 8;
  const passwordsMatch = password.length > 0 && password === passwordConfirmation;

  const handleRegister = async () => {
    setError(null);

    if (name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid university email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Password confirmation does not match.');
      return;
    }

    setLoading(true);
    const result = await registerUser({
      name: name.trim(),
      email: email.trim(),
      studentNumber: studentNumber.trim(),
      password,
      passwordConfirmation,
    });
    setLoading(false);

    if (result && result.success) {
      onAuthSuccess(result.user);
    } else {
      setError(result?.message || 'Could not create account. Please check your inputs.');
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
            🎭 MSEUF UNIVERSITY THEATER • STUDENT REGISTRATION
          </Text>
        </View>

        <View style={styles.card}>
          {/* University Badge & Page Heading */}
          <View style={styles.headerSection}>
            <View style={styles.badgeRow}>
              <View style={styles.euMiniCrest}>
                <Text style={styles.euMiniCrestText}>EU</Text>
              </View>
              <Text style={styles.badgeLabel}>NEW STUDENT / ATTENDEE</Text>
            </View>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>
              Register with your university details to book auditorium chairs and receive digital QR ticket passes.
            </Text>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>FULL NAME *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Juan Dela Cruz"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>UNIVERSITY EMAIL ADDRESS *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="juan@mseuf.edu.ph"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Student ID Number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>STUDENT ID NUMBER (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              value={studentNumber}
              onChangeText={setStudentNumber}
              placeholder="e.g. A23-00142"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PASSWORD *</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 8 characters"
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

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>CONFIRM PASSWORD *</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                placeholder="Re-enter your password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.eyeBtnText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            {/* Live Password Requirements */}
            <View style={styles.hintsRow}>
              <Text style={[styles.hintItem, passwordLongEnough && styles.hintValid]}>
                {passwordLongEnough ? '✓' : '○'} 8+ characters
              </Text>
              <Text
                style={[
                  styles.hintItem,
                  passwordsMatch
                    ? styles.hintValid
                    : passwordConfirmation.length > 0
                      ? styles.hintInvalid
                      : null,
                ]}
              >
                {passwordsMatch ? '✓' : passwordConfirmation.length > 0 ? '✕' : '○'}{' '}
                {passwordConfirmation.length > 0 && !passwordsMatch
                  ? 'Passwords do not match'
                  : 'Passwords match'}
              </Text>
            </View>
          </View>

          {/* Submit CTA */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Create Account ›</Text>
            )}
          </TouchableOpacity>

          {/* Link to Separate Login Screen */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an MSEUF Theater account?</Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.footerLink}>Sign In Here →</Text>
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
  hintsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 6,
  },
  hintItem: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  hintValid: {
    color: COLORS.success,
  },
  hintInvalid: {
    color: COLORS.error,
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
