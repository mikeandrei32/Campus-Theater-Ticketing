import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/theme';

export default function Header({
  title,
  subtitle,
  showBack,
  onBack,
  onSettingsPress,
  user,
  activeNav,
  onNavigate,
  onAuthPress,
  authActionLabel = 'Sign In',
  onLogoutPress,
}) {
  const isAdmin = Boolean(
    user && (user.role === 'admin' || user.is_admin || user.can_manage_theater)
  );

  return (
    <View style={styles.header}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.maroonDark} />

      {/* Top Brand Bar (Matches resources/views/layouts/admin.blade.php) */}
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
              <Text style={styles.backBtnText}>‹</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.crestCircle}
            activeOpacity={0.85}
            onPress={() => {
              if (user && onNavigate) {
                onNavigate(isAdmin ? 'admin_dashboard' : 'catalog');
              }
            }}
          >
            <Text style={styles.crestText}>EU</Text>
          </TouchableOpacity>
          <View style={styles.brandTextWrap}>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle} numberOfLines={1}>
                MANUEL S. ENVERGA UNIVERSITY
              </Text>
              {isAdmin && (
                <View style={styles.adminPortalBadge}>
                  <Text style={styles.adminPortalBadgeText}>ADMIN PORTAL</Text>
                </View>
              )}
            </View>
            <Text style={styles.brandSubtitle} numberOfLines={1}>
              {isAdmin
                ? 'UNIVERSITY THEATER & ARTS • SHOW POSTING & SEATS'
                : 'UNIVERSITY THEATER & ARTS'}
            </Text>
          </View>
        </View>

        <View style={styles.rightActions}>
          {user ? (
            <View style={styles.userPill}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfoCol}>
                <Text style={styles.userPillName} numberOfLines={1}>
                  {user.name.split(' ')[0]}
                </Text>
                <Text style={styles.userPillRole}>
                  {(user.role || 'student').toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onLogoutPress}
                style={styles.signOutBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.signOutBtnText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
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
            <TouchableOpacity
              onPress={onSettingsPress}
              style={styles.settingsBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsBtnText}>API</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Website-Matched Navigation Bar (When Authenticated) */}
      {user && onNavigate && (
        <View style={styles.navBarWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navBarScroll}
          >
            {/* 1. Shows & Plays */}
            <TouchableOpacity
              style={[
                styles.navItem,
                (activeNav === 'admin_dashboard' || activeNav === 'catalog') &&
                  styles.navItemActive,
              ]}
              onPress={() => onNavigate(isAdmin ? 'admin_dashboard' : 'catalog')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.navItemText,
                  (activeNav === 'admin_dashboard' || activeNav === 'catalog') &&
                    styles.navItemTextActive,
                ]}
              >
                Shows & Plays
              </Text>
            </TouchableOpacity>

            {/* 2. Admin-Only Navigation Items (Matches Website Admin Header) */}
            {isAdmin && (
              <>
                <TouchableOpacity
                  style={[
                    styles.postShowNavBtn,
                    activeNav === 'admin_create_event' && styles.postShowNavBtnActive,
                  ]}
                  onPress={() => onNavigate('admin_create_event')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.postShowNavBtnText}>+ Post Show</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.navItem,
                    activeNav === 'admin_bookings' && styles.navItemActive,
                  ]}
                  onPress={() => onNavigate('admin_bookings')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.navItemText,
                      activeNav === 'admin_bookings' && styles.navItemTextActive,
                    ]}
                  >
                    Reservations
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.navItem,
                    activeNav === 'admin_scanner' && styles.navItemActive,
                  ]}
                  onPress={() => onNavigate('admin_scanner')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.navItemText,
                      activeNav === 'admin_scanner' && styles.navItemTextActive,
                    ]}
                  >
                    Gate Scanner
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.navDivider} />

            {/* 3. My Passes */}
            <TouchableOpacity
              style={[
                styles.navItem,
                activeNav === 'my_passes' && styles.navItemActive,
              ]}
              onPress={() => onNavigate('my_passes')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.navItemText,
                  activeNav === 'my_passes' && styles.navItemTextActive,
                ]}
              >
                My Passes
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

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
    paddingTop: 42,
    paddingBottom: 12,
    paddingHorizontal: 14,
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
  brandTextWrap: {
    flex: 1,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtn: {
    marginRight: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: -2,
  },
  crestCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    borderWidth: 2,
    borderColor: COLORS.vipGold,
  },
  crestText: {
    color: COLORS.maroon,
    fontWeight: '900',
    fontSize: 13,
  },
  brandTitle: {
    color: COLORS.white,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  adminPortalBadge: {
    backgroundColor: COLORS.vipGold,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 999,
  },
  adminPortalBadgeText: {
    color: '#3D0000',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    color: COLORS.vipGold,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingLeft: 6,
    paddingRight: 5,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
  },
  userAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.vipGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#3D0000',
    fontSize: 10,
    fontWeight: '900',
  },
  userInfoCol: {
    maxWidth: 68,
  },
  userPillName: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  userPillRole: {
    color: COLORS.vipGold,
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  signOutBtn: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  signOutBtnText: {
    color: COLORS.white,
    fontSize: 9.5,
    fontWeight: '800',
  },
  settingsBtn: {
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  settingsBtnText: {
    color: COLORS.white,
    fontSize: 9.5,
    fontWeight: '800',
  },
  navBarWrapper: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  navBarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navItem: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  navItemText: {
    color: '#F5DCDC',
    fontSize: 11,
    fontWeight: '700',
  },
  navItemTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  postShowNavBtn: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.vipGold,
  },
  postShowNavBtnActive: {
    backgroundColor: '#F59E0B',
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  postShowNavBtnText: {
    color: '#3D0000',
    fontSize: 11,
    fontWeight: '900',
  },
  navDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 2,
  },
  titleRow: {
    marginTop: 10,
  },
  pageTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
  },
  pageSubtitle: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
