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
import {
  registerUser,
  verifyRegistrationCode,
  resendRegistrationCode,
} from '../services/api';

export default function RegisterScreen({ onAuthSuccess, onNavigateToLogin }) {
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email verification step state
  const [verificationCode, setVerificationCode] = useState('');
  const [demoOtp, setDemoOtp] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);

  const passwordLongEnough = password.length >= 8;
  const passwordsMatch = password.length > 0 && password === passwordConfirmation;

  const handleRequestVerification = async () => {
    setError(null);
    setInfoMessage(null);

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
      if (result.requires_verification) {
        setDemoOtp(result.demo_otp || null);
        setInfoMessage(result.message || `A 6-digit verification code was sent to ${email.trim()}.`);
        setVerificationCode('');
        setStep('verify');
      } else if (result.user) {
        onAuthSuccess(result.user);
      }
    } else {
      setError(result?.message || 'Could not send verification code. Please check your inputs.');
    }
  };

  const handleVerifyCode = async () => {
    setError(null);
    const cleanCode = verificationCode.trim();

    if (cleanCode.length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setLoading(true);
    const result = await verifyRegistrationCode({
      email: email.trim(),
      code: cleanCode,
    });
    setLoading(false);

    if (result && result.success && result.user) {
      onAuthSuccess(result.user);
    } else {
      setError(result?.message || 'Invalid verification code. Please try again.');
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setResending(true);
    const result = await resendRegistrationCode({ email: email.trim() });
    setResending(false);

    if (result && result.success) {
      if (result.demo_otp) {
        setDemoOtp(result.demo_otp);
      }
      setInfoMessage(result.message || 'A new 6-digit verification code has been sent.');
    } else {
      setError(result?.message || 'Could not resend verification code.');
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
            {step === 'verify'
              ? 'MSEUF UNIVERSITY THEATER • EMAIL VERIFICATION'
              : 'MSEUF UNIVERSITY THEATER • STUDENT REGISTRATION'}
          </Text>
        </View>

        <View style={styles.card}>
          {step === 'form' ? (
            <>
              {/* Step 1: Registration Details Form */}
              <View style={styles.headerSection}>
                <View style={styles.badgeRow}>
                  <View style={styles.euMiniCrest}>
                    <Text style={styles.euMiniCrestText}>EU</Text>
                  </View>
                  <Text style={styles.badgeLabel}>STEP 1 OF 2 • STUDENT DETAILS</Text>
                </View>
                <Text style={styles.title}>Create Your Account</Text>
                <Text style={styles.subtitle}>
                  Enter your university details below. We will send a 6-digit verification code to your email before creating your account.
                </Text>
              </View>

              {/* Error Banner */}
              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
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
                onPress={handleRequestVerification}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Send Verification Code ›</Text>
                )}
              </TouchableOpacity>

              {/* Link to Separate Login Screen */}
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Already have an MSEUF Theater account?</Text>
                <TouchableOpacity onPress={onNavigateToLogin}>
                  <Text style={styles.footerLink}>Sign In Here →</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Step 2: 6-Digit Email Verification Code */}
              <View style={styles.headerSection}>
                <View style={styles.badgeRow}>
                  <View style={styles.euMiniCrest}>
                    <Text style={styles.euMiniCrestText}>EU</Text>
                  </View>
                  <Text style={styles.badgeLabel}>STEP 2 OF 2 • VERIFY EMAIL</Text>
                </View>
                <Text style={styles.title}>Verify Your Email</Text>
                <Text style={styles.subtitle}>
                  Enter the 6-digit verification code sent to{' '}
                  <Text style={styles.emailHighlight}>{email.trim()}</Text> to create your account.
                </Text>
              </View>

              {infoMessage && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>{infoMessage}</Text>
                </View>
              )}

              {demoOtp && (
                <View style={styles.demoOtpBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.demoOtpLabel}>LOCAL MAILER PREVIEW</Text>
                    <Text style={styles.demoOtpCode}>Code: {demoOtp}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.autoFillBtn}
                    onPress={() => setVerificationCode(String(demoOtp))}
                  >
                    <Text style={styles.autoFillBtnText}>Auto-Fill</Text>
                  </TouchableOpacity>
                </View>
              )}

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>6-DIGIT VERIFICATION CODE *</Text>
                <TextInput
                  style={styles.otpInput}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="000000"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleVerifyCode}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Verify & Create Account ›</Text>
                )}
              </TouchableOpacity>

              <View style={styles.verifyFooterRow}>
                <TouchableOpacity onPress={handleResendCode} disabled={resending}>
                  <Text style={styles.footerLink}>
                    {resending ? 'Sending new code...' : 'Resend Verification Code'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setError(null);
                    setStep('form');
                  }}
                >
                  <Text style={styles.backToEditLink}>‹ Edit Registration Details</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  emailHighlight: {
    color: COLORS.maroon,
    fontWeight: '800',
  },
  infoBox: {
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  infoText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '700',
  },
  demoOtpBox: {
    backgroundColor: COLORS.vipBg,
    borderWidth: 1,
    borderColor: COLORS.vipBorder,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoOtpLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.vipGoldDark,
    letterSpacing: 0.5,
  },
  demoOtpCode: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.maroon,
    marginTop: 2,
  },
  autoFillBtn: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  autoFillBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
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
  otpInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.maroon,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 22,
    color: COLORS.maroon,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
  verifyFooterRow: {
    alignItems: 'center',
    gap: 10,
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
  backToEditLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});
