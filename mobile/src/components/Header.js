import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { COLORS } from '../constants/theme';

export default function Header({
  title,
  subtitle,
  showBack,
  onBack,
  onSettingsPress,
  user,
  onAuthPress,
  authActionLabel = 'Sign In',
  onLogoutPress,
}) {
  return (
    <View style={styles.header}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.maroonDark} />
      
      {/* Top Brand Bar */}
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
              <Text style={styles.backBtnText}>‹</Text>
            </TouchableOpacity>
          )}
          <View style={styles.crestCircle}>
            <Text style={styles.crestText}>EU</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>MANUEL S. ENVERGA UNIVERSITY</Text>
            <Text style={styles.brandSubtitle}>UNIVERSITY THEATER & ARTS</Text>
          </View>
        </View>

        <View style={styles.rightActions}>
          {user ? (
            <TouchableOpacity
              onPress={onLogoutPress}
              style={styles.userPill}
              activeOpacity={0.8}
            >
              <Text style={styles.userPillName} numberOfLines={1}>
                {user.name.split(' ')[0]}
              </Text>
              <Text style={styles.userPillLogout}>Sign Out</Text>
            </TouchableOpacity>
          ) : (
            onAuthPress && (
              <TouchableOpacity
                onPress={onAuthPress}
                style={styles.signInBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.signInBtnText}>{authActionLabel}</Text>
              </TouchableOpacity>
            )
          )}

          {onSettingsPress && (
            <TouchableOpacity onPress={onSettingsPress} style={styles.settingsBtn} activeOpacity={0.7}>
              <Text style={styles.settingsBtnText}>API</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Screen Title (if different from brand) */}
      {title && (
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>{title}</Text>
          {subtitle && <Text style={styles.pageSubtitle}>{subtitle}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.maroon,
    paddingTop: 44,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.vipGold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtn: {
    marginRight: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: -2,
  },
  crestCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: COLORS.vipGold,
  },
  crestText: {
    color: COLORS.maroon,
    fontWeight: '900',
    fontSize: 13,
  },
  brandTitle: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    color: COLORS.vipGold,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signInBtn: {
    backgroundColor: COLORS.vipGold,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  signInBtnText: {
    color: '#3D0000',
    fontSize: 11,
    fontWeight: '900',
  },
  userPill: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'flex-end',
    maxWidth: 110,
  },
  userPillName: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  userPillLogout: {
    color: COLORS.vipGold,
    fontSize: 8,
    fontWeight: '800',
  },
  settingsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  settingsBtnText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  titleRow: {
    marginTop: 12,
  },
  pageTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    color: COLORS.maroonPale,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
});
