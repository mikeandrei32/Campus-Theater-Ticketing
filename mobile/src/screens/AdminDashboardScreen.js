import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { fetchAdminDashboard, deleteAdminEvent } from '../services/api';

export default function AdminDashboardScreen({
  flashMessage,
  onClearFlash,
  onCreateShow,
  onOpenScanner,
  onEditShow,
  onManageShow,
  onBookShow,
}) {
  const [stats, setStats] = useState({
    total_events: 0,
    total_bookings: 0,
    total_seats_reserved: 0,
    total_revenue: 0,
    total_seats: 60,
  });
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'paid', 'free'
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionAlert, setActionAlert] = useState(null);

  const loadDashboard = useCallback(
    async (overrideFilter = filter, overrideSearch = appliedSearch) => {
      const res = await fetchAdminDashboard({
        filter: overrideFilter,
        search: overrideSearch,
      });
      if (res && res.success) {
        if (res.stats) setStats(res.stats);
        if (Array.isArray(res.events)) setEvents(res.events);
      }
      setLoading(false);
      setRefreshing(false);
    },
    [filter, appliedSearch]
  );

  useEffect(() => {
    loadDashboard(filter, appliedSearch);
  }, [filter, appliedSearch, loadDashboard]);

  const handleSearchSubmit = () => {
    setLoading(true);
    setAppliedSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
  };

  const confirmDeleteEvent = (event) => {
    const runDelete = async () => {
      const res = await deleteAdminEvent(event.id);
      if (res && res.success) {
        setActionAlert({ type: 'success', text: res.message });
        loadDashboard(filter, appliedSearch);
      } else {
        setActionAlert({
          type: 'error',
          text: res?.message || 'Could not delete show.',
        });
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (
        window.confirm(
          `Are you sure you want to delete '${event.title}'? This will also cancel all reservations for this show.`
        )
      ) {
        runDelete();
      }
    } else {
      Alert.alert(
        'Delete Show',
        `Are you sure you want to delete '${event.title}'? This will also cancel all reservations for this show.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: runDelete },
        ]
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadDashboard(filter, appliedSearch);
          }}
          colors={[COLORS.maroon]}
        />
      }
    >
      {/* 1. Campus Tagline Banner (Identical to Website layouts/admin.blade.php) */}
      <View style={styles.taglineBanner}>
        <Text style={styles.taglineBannerText}>
          MSEUF CAMPUS THEATER ADMIN & PLAY PUBLISHER • POST SHOWS FOR STUDENT MOBILE APP
        </Text>
      </View>

      <View style={styles.mainPadding}>
        {/* Flash Notifications */}
        {(flashMessage || actionAlert) && (
          <View
            style={[
              styles.flashBox,
              (actionAlert?.type === 'error'
                ? styles.flashError
                : styles.flashSuccess),
            ]}
          >
            <Text
              style={[
                styles.flashText,
                actionAlert?.type === 'error'
                  ? styles.flashErrorText
                  : styles.flashSuccessText,
              ]}
            >
              {actionAlert ? actionAlert.text : flashMessage}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setActionAlert(null);
                if (onClearFlash) onClearFlash();
              }}
            >
              <Text style={styles.flashDismiss}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===================================================================== */}
        {/* 1. HERO & KPI STATS OVERVIEW (Matches admin/events/index.blade.php)    */}
        {/* ===================================================================== */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroTextCol}>
              <View style={styles.adminDashboardPill}>
                <View style={styles.pulseDot} />
                <Text style={styles.adminDashboardPillText}>
                  MSEUF ADMIN DASHBOARD
                </Text>
              </View>

              <Text style={styles.heroTitle}>
                Campus Theater & Cinema Publisher
              </Text>
              <Text style={styles.heroSubtitle}>
                Post and manage campus plays, cinema screenings, and drama events. Students can browse these shows and reserve seats directly in the mobile app.
              </Text>
            </View>

            <View style={styles.heroActionsRow}>
              <TouchableOpacity
                style={styles.postNewHeroBtn}
                onPress={onCreateShow}
                activeOpacity={0.85}
              >
                <Text style={styles.postNewHeroBtnText}>
                  + Post New Play / Cine
                </Text>
              </TouchableOpacity>

              {onOpenScanner && (
                <TouchableOpacity
                  style={styles.scannerHeroBtn}
                  onPress={onOpenScanner}
                  activeOpacity={0.85}
                >
                  <Text style={styles.scannerHeroBtnText}>
                    Gate Marshal Scanner ›
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 4 Metric KPI Cards (2x2 Grid matching website) */}
          <View style={styles.kpiGrid}>
            {/* 1. Total Shows */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL SHOWS</Text>
              <Text style={styles.kpiValueWhite}>{stats.total_events}</Text>
              <Text style={styles.kpiCaption}>Plays & Cinema Movies</Text>
            </View>

            {/* 2. Total Reservations */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>RESERVATIONS</Text>
              <Text style={styles.kpiValueWhite}>{stats.total_bookings}</Text>
              <Text style={styles.kpiCaption}>Student booking orders</Text>
            </View>

            {/* 3. Seats Occupied */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>SEATS OCCUPIED</Text>
              <Text style={styles.kpiValueGold}>
                {stats.total_seats_reserved}
              </Text>
              <Text style={styles.kpiCaption}>Across all showtimes</Text>
            </View>

            {/* 4. Total GCash Revenue */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
              <Text style={styles.kpiValueEmerald}>
                ₱{Number(stats.total_revenue || 0).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text style={styles.kpiCaption}>Paid Ticket Sales</Text>
            </View>
          </View>
        </View>

        {/* ===================================================================== */}
        {/* 2. SEARCH & FILTER TABS (Matches admin/events/index.blade.php)         */}
        {/* ===================================================================== */}
        <View style={styles.filterSearchCard}>
          {/* Filter Tabs */}
          <View style={styles.filterTabsRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filter === 'all' && styles.filterChipActive,
              ]}
              onPress={() => setFilter('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === 'all' && styles.filterChipTextActive,
                ]}
              >
                All Shows ({events.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                filter === 'paid' && styles.filterChipActive,
              ]}
              onPress={() => setFilter('paid')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === 'paid' && styles.filterChipTextActive,
                ]}
              >
                ★ VIP & Paid Shows
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                filter === 'free' && styles.filterChipActive,
              ]}
              onPress={() => setFilter('free')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === 'free' && styles.filterChipTextActive,
                ]}
              >
                Free Admission
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarRow}>
            <TextInput
              style={styles.searchInput}
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Search title or venue..."
              placeholderTextColor={COLORS.textMuted}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={handleSearchSubmit}
              activeOpacity={0.85}
            >
              <Text style={styles.searchBtnText}>Search</Text>
            </TouchableOpacity>
            {Boolean(appliedSearch || searchInput) && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearSearch}
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ===================================================================== */}
        {/* 3. SHOWS CARDS GRID (Matches admin/events/index.blade.php)             */}
        {/* ===================================================================== */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.maroon} />
            <Text style={styles.loadingText}>
              Loading shows & KPI metrics...
            </Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Shows or Plays Found</Text>
            <Text style={styles.emptySubtitle}>
              {appliedSearch || filter !== 'all'
                ? 'No campus plays match your search or filter. Try clearing the search.'
                : 'No campus theater shows have been posted yet. Click the button below to publish your first show!'}
            </Text>
            <TouchableOpacity
              style={styles.emptyPostBtn}
              onPress={onCreateShow}
            >
              <Text style={styles.emptyPostBtnText}>+ POST YOUR FIRST SHOW</Text>
            </TouchableOpacity>
          </View>
        ) : (
          events.map((event) => {
            const isFree = event.pricing_type === 'free';
            const totalSeats = event.total_seats || stats.total_seats || 60;
            const booked = event.booked_seats_count || 0;
            const available = Math.max(0, totalSeats - booked);
            const percent = Math.min(
              100,
              Math.round((booked / totalSeats) * 100)
            );

            return (
              <View key={event.id} style={styles.showCard}>
                {/* Banner Image Container with Badges */}
                <View style={styles.bannerContainer}>
                  <Image
                    source={{
                      uri:
                        event.banner_image ||
                        'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80',
                    }}
                    style={styles.bannerImage}
                    resizeMode="cover"
                  />
                  <View style={styles.bannerOverlay} />

                  {/* Top Left: Date Badge */}
                  <View style={styles.dateBadge}>
                    <View style={styles.dateBadgeDot} />
                    <Text style={styles.dateBadgeText}>
                      {event.short_date ||
                        `${event.formatted_date || 'TBA'} • ${
                          event.formatted_time || ''
                        }`}
                    </Text>
                  </View>

                  {/* Top Right: Capacity Badge */}
                  <View style={styles.capacityBadge}>
                    <Text
                      style={[
                        styles.capacityBadgeNum,
                        available < 15
                          ? { color: COLORS.maroon }
                          : { color: COLORS.success },
                      ]}
                    >
                      {available}
                    </Text>
                    <Text style={styles.capacityBadgeTotal}>
                      {' '}
                      / {totalSeats} open
                    </Text>
                  </View>

                  {/* Bottom Left: Pricing Badge */}
                  <View style={styles.pricingBadgeWrap}>
                    {isFree ? (
                      <View style={styles.freeBadge}>
                        <Text style={styles.freeBadgeText}>FREE ADMISSION</Text>
                      </View>
                    ) : (
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidBadgeVipText}>
                          ★ VIP ₱{Number(event.vip_price || 0).toFixed(0)}
                        </Text>
                        <Text style={styles.paidBadgeDot}> • </Text>
                        <Text style={styles.paidBadgeRegText}>
                          REG ₱{Number(event.regular_price || 0).toFixed(0)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Card Body */}
                <View style={styles.cardBody}>
                  <Text style={styles.eventTitle}>{event.title}</Text>

                  <View style={styles.venueRow}>
                    <Text style={styles.venueLabel}>Venue:</Text>
                    <Text style={styles.venueText}>{event.venue}</Text>
                  </View>

                  {/* Auditorium Seat Occupancy Progress Bar */}
                  <View style={styles.occupancySection}>
                    <View style={styles.occupancyHeader}>
                      <Text style={styles.occupancyLabel}>
                        Auditorium Seat Occupancy
                      </Text>
                      <Text style={styles.occupancyStats}>
                        {booked} booked ({percent}%)
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[styles.progressFill, { width: `${percent}%` }]}
                      />
                    </View>
                  </View>
                </View>

                {/* Admin Actions Footer (Matches website card footer) */}
                <View style={styles.cardFooter}>
                  {/* Left: Edit & Delete */}
                  <View style={styles.footerLeftActions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => onEditShow(event)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => confirmDeleteEvent(event)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Right: Book & Manage & Seats */}
                  <View style={styles.footerRightActions}>
                    <TouchableOpacity
                      style={styles.bookBtn}
                      onPress={() => onBookShow(event)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.bookBtnText}>Book</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.manageSeatsBtn}
                      onPress={() => onManageShow(event)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.manageSeatsBtnText}>
                        MANAGE & SEATS ›
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* University Footer (Matches layouts/admin.blade.php) */}
        <View style={styles.footer}>
          <View style={styles.footerBrandRow}>
            <View style={styles.footerEuCircle}>
              <Text style={styles.footerEuText}>EU</Text>
            </View>
            <Text style={styles.footerBrandTitle}>
              Manuel S. Enverga University Foundation
            </Text>
          </View>
          <Text style={styles.footerSub}>
            College of Computing & Multimedia Studies • Admin Theater Ticketing Portal
          </Text>
          <Text style={styles.footerCopy}>
            © {new Date().getFullYear()} MSEUF Cinema-Style Theater Management System
          </Text>
        </View>
      </View>
    </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.maroonBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  taglineBannerText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.maroon,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  mainPadding: {
    padding: 16,
    gap: 18,
  },
  flashBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
  },
  flashSuccess: {
    backgroundColor: '#D1FAE5',
    borderColor: '#34D399',
  },
  flashError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
  },
  flashText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    marginRight: 8,
  },
  flashSuccessText: {
    color: '#064E3B',
  },
  flashErrorText: {
    color: '#7F1D1D',
  },
  flashDismiss: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textSecondary,
    paddingHorizontal: 4,
  },
  heroCard: {
    backgroundColor: COLORS.maroonDark,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.maroon,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  heroHeaderRow: {
    gap: 14,
  },
  heroTextCol: {
    gap: 6,
  },
  adminDashboardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.vipGold,
  },
  adminDashboardPillText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#F5DCDC',
    lineHeight: 18,
  },
  heroActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  postNewHeroBtn: {
    backgroundColor: COLORS.vipGold,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  postNewHeroBtnText: {
    color: '#3D0000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  scannerHeroBtn: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  scannerHeroBtnText: {
    color: COLORS.white,
    fontSize: 12.5,
    fontWeight: '800',
  },
  kpiGrid: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: 'rgba(0,0,0,0.24)',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  kpiLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#E5C4C4',
    letterSpacing: 0.6,
  },
  kpiValueWhite: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 4,
  },
  kpiValueGold: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FBBF24',
    marginTop: 4,
  },
  kpiValueEmerald: {
    fontSize: 20,
    fontWeight: '900',
    color: '#6EE7B7',
    marginTop: 4,
  },
  kpiCaption: {
    fontSize: 9.5,
    color: '#E5C4C4',
    marginTop: 2,
  },
  filterSearchCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  filterTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: COLORS.maroon,
    borderColor: COLORS.maroon,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#374151',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
    fontSize: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  searchBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: COLORS.maroon,
    borderRadius: 12,
  },
  searchBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 300,
  },
  emptyPostBtn: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.maroon,
    borderRadius: 12,
  },
  emptyPostBtnText: {
    color: COLORS.white,
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  showCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  bannerContainer: {
    height: 185,
    width: '100%',
    backgroundColor: '#111827',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dateBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 0, 0, 0.94)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#A30000',
    gap: 6,
  },
  dateBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.vipGold,
  },
  dateBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  capacityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  capacityBadgeNum: {
    fontSize: 11,
    fontWeight: '900',
  },
  capacityBadgeTotal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  pricingBadgeWrap: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  freeBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  freeBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.maroon,
    borderWidth: 1,
    borderColor: COLORS.vipGold,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  paidBadgeVipText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '900',
  },
  paidBadgeDot: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '900',
  },
  paidBadgeRegText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },
  cardBody: {
    padding: 18,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  venueLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  venueText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    flex: 1,
  },
  occupancySection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  occupancyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  occupancyLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  occupancyStats: {
    fontSize: 11.5,
    fontWeight: '900',
    color: COLORS.maroon,
  },
  progressTrack: {
    height: 9,
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.maroon,
    borderRadius: 999,
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  footerLeftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  editBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1F2937',
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  deleteBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#B91C1C',
  },
  footerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookBtn: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: COLORS.maroonPale,
    borderWidth: 1,
    borderColor: COLORS.maroonBorder,
  },
  bookBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.maroonDark,
  },
  manageSeatsBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: COLORS.maroon,
  },
  manageSeatsBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.4,
  },
  footer: {
    marginTop: 16,
    paddingTop: 22,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  footerEuCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.maroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerEuText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
  },
  footerBrandTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.maroonDark,
  },
  footerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footerCopy: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 3,
  },
});
