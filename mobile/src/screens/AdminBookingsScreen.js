import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { fetchAdminBookings, cancelAdminBooking } from '../services/api';

export default function AdminBookingsScreen({
  onBackToCatalog,
  onSelectEventById,
}) {
  const [stats, setStats] = useState({
    total_bookings: 0,
    total_seats_reserved: 0,
    total_revenue: 0,
  });
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(''); // '', 'paid', 'free'
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [flash, setFlash] = useState(null);

  const loadBookings = useCallback(
    async (
      evId = selectedEventId,
      payStat = paymentStatus,
      srch = appliedSearch
    ) => {
      const res = await fetchAdminBookings({
        eventId: evId,
        paymentStatus: payStat,
        search: srch,
      });
      if (res && res.success) {
        if (res.stats) setStats(res.stats);
        if (Array.isArray(res.events)) setEvents(res.events);
        if (Array.isArray(res.bookings)) setBookings(res.bookings);
      }
      setLoading(false);
      setRefreshing(false);
    },
    [selectedEventId, paymentStatus, appliedSearch]
  );

  useEffect(() => {
    loadBookings(selectedEventId, paymentStatus, appliedSearch);
  }, [selectedEventId, paymentStatus, appliedSearch, loadBookings]);

  const handleFilterSubmit = () => {
    setLoading(true);
    setAppliedSearch(searchInput.trim());
  };

  const handleResetFilters = () => {
    setSelectedEventId('');
    setPaymentStatus('');
    setSearchInput('');
    setAppliedSearch('');
  };

  const handleCancelBooking = (booking) => {
    const runCancel = async () => {
      const res = await cancelAdminBooking(booking.id);
      if (res && res.success) {
        setFlash({ type: 'success', text: res.message });
        loadBookings(selectedEventId, paymentStatus, appliedSearch);
      } else {
        setFlash({
          type: 'error',
          text: res?.message || 'Could not cancel reservation.',
        });
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (
        window.confirm(
          `Cancel reservation #${booking.booking_reference}? This will release the seats.`
        )
      ) {
        runCancel();
      }
    } else {
      Alert.alert(
        'Cancel Reservation',
        `Cancel reservation #${booking.booking_reference}? This will release the seats.`,
        [
          { text: 'No', style: 'cancel' },
          { text: 'Cancel Reservation', style: 'destructive', onPress: runCancel },
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
            loadBookings(selectedEventId, paymentStatus, appliedSearch);
          }}
          colors={[COLORS.maroon]}
        />
      }
    >
      {/* Campus Tagline Banner */}
      <View style={styles.taglineBanner}>
        <Text style={styles.taglineBannerText}>
          MSEUF CAMPUS THEATER ADMIN & PLAY PUBLISHER • POST SHOWS FOR STUDENT MOBILE APP
        </Text>
      </View>

      <View style={styles.mainPadding}>
        {/* Flash Notification */}
        {flash && (
          <View
            style={[
              styles.flashBox,
              flash.type === 'error' ? styles.flashError : styles.flashSuccess,
            ]}
          >
            <Text
              style={[
                styles.flashText,
                flash.type === 'error'
                  ? styles.flashErrorText
                  : styles.flashSuccessText,
              ]}
            >
              {flash.text}
            </Text>
            <TouchableOpacity onPress={() => setFlash(null)}>
              <Text style={styles.flashDismiss}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Top Header & Summary (Matches admin/bookings/index.blade.php) */}
        <View style={styles.headerBlock}>
          <View style={styles.breadcrumbRow}>
            <TouchableOpacity onPress={onBackToCatalog}>
              <Text style={styles.breadcrumbLink}>Shows & Plays</Text>
            </TouchableOpacity>
            <Text style={styles.breadcrumbSep}>›</Text>
            <Text style={styles.breadcrumbCurrent}>Student Reservations</Text>
          </View>
          <Text style={styles.pageTitle}>
            Student Reservations & Pass Master List
          </Text>
          <Text style={styles.pageSub}>
            View, search, and manage all ticket reservations submitted from the mobile app.
          </Text>
        </View>

        {/* Quick Metrics (3 Cards matching admin/bookings/index.blade.php) */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>TOTAL BOOKINGS</Text>
            <Text style={[styles.metricValue, { color: COLORS.textPrimary }]}>
              {stats.total_bookings}
            </Text>
            <Text style={styles.metricSub}>Mobile app reservations</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>SEATS RESERVED</Text>
            <Text style={[styles.metricValue, { color: COLORS.maroon }]}>
              {stats.total_seats_reserved}
            </Text>
            <Text style={styles.metricSub}>Total tickets issued</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>TOTAL REVENUE</Text>
            <Text style={[styles.metricValue, { color: COLORS.success }]}>
              ₱{Number(stats.total_revenue || 0).toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
            <Text style={styles.metricSub}>GCash payments collected</Text>
          </View>
        </View>

        {/* Filter & Search Controls */}
        <View style={styles.filterCard}>
          {/* Filter by Event */}
          <View>
            <Text style={styles.filterGroupLabel}>FILTER BY SHOW / PLAY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              <TouchableOpacity
                style={[
                  styles.chip,
                  selectedEventId === '' && styles.chipActive,
                ]}
                onPress={() => setSelectedEventId('')}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedEventId === '' && styles.chipTextActive,
                  ]}
                >
                  All Plays & Shows
                </Text>
              </TouchableOpacity>
              {events.map((ev) => (
                <TouchableOpacity
                  key={ev.id}
                  style={[
                    styles.chip,
                    String(selectedEventId) === String(ev.id) &&
                      styles.chipActive,
                  ]}
                  onPress={() => setSelectedEventId(String(ev.id))}
                >
                  <Text
                    style={[
                      styles.chipText,
                      String(selectedEventId) === String(ev.id) &&
                        styles.chipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {ev.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Filter by Payment Status */}
          <View>
            <Text style={styles.filterGroupLabel}>PAYMENT TYPE</Text>
            <View style={styles.chipsRowWrap}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  paymentStatus === '' && styles.chipActive,
                ]}
                onPress={() => setPaymentStatus('')}
              >
                <Text
                  style={[
                    styles.chipText,
                    paymentStatus === '' && styles.chipTextActive,
                  ]}
                >
                  All Payment Types
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chip,
                  paymentStatus === 'paid' && styles.chipActive,
                ]}
                onPress={() => setPaymentStatus('paid')}
              >
                <Text
                  style={[
                    styles.chipText,
                    paymentStatus === 'paid' && styles.chipTextActive,
                  ]}
                >
                  Paid Tickets Only
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chip,
                  paymentStatus === 'free' && styles.chipActive,
                ]}
                onPress={() => setPaymentStatus('free')}
              >
                <Text
                  style={[
                    styles.chipText,
                    paymentStatus === 'free' && styles.chipTextActive,
                  ]}
                >
                  Free Passes Only
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search by Name / Reference */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Student name, ref, or GCash..."
              placeholderTextColor={COLORS.textMuted}
              onSubmitEditing={handleFilterSubmit}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={handleFilterSubmit}
            >
              <Text style={styles.filterBtnText}>Filter</Text>
            </TouchableOpacity>
            {Boolean(selectedEventId || paymentStatus || appliedSearch) && (
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={handleResetFilters}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Bookings Master Card */}
        <View style={styles.tableCard}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.maroon} />
              <Text style={styles.loadingText}>
                Loading student reservations...
              </Text>
            </View>
          ) : bookings.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Reservations Found</Text>
              <Text style={styles.emptySub}>
                No student reservations match your search criteria.
              </Text>
            </View>
          ) : (
            <View style={styles.bookingsList}>
              {bookings.map((booking) => (
                <View key={booking.id} style={styles.bookingItem}>
                  <View style={styles.bookingTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bookingRef}>
                        {booking.booking_reference}
                      </Text>
                      <Text style={styles.studentName}>
                        {booking.student_name}
                      </Text>
                      {Boolean(booking.student_email) && (
                        <Text style={styles.studentEmail}>
                          {booking.student_email}
                        </Text>
                      )}
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      {booking.payment_status === 'free' ? (
                        <View style={styles.freeBadge}>
                          <Text style={styles.freeBadgeText}>FREE</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.paidAmount}>
                            ₱{Number(booking.total_amount || 0).toFixed(2)}
                          </Text>
                          {Boolean(booking.gcash_reference) && (
                            <Text style={styles.gcashRef}>
                              Ref: {booking.gcash_reference}
                            </Text>
                          )}
                        </>
                      )}
                      <Text style={styles.bookedDate}>
                        {booking.created_at}
                      </Text>
                    </View>
                  </View>

                  {/* Show Title */}
                  <TouchableOpacity
                    style={styles.showLinkRow}
                    onPress={() =>
                      onSelectEventById &&
                      booking.event_id &&
                      onSelectEventById(booking.event_id)
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.showLinkLabel}>Show:</Text>
                    <Text style={styles.showLinkTitle} numberOfLines={1}>
                      {booking.event_title}
                    </Text>
                    {Boolean(booking.event_date) && (
                      <Text style={styles.showLinkDate}>
                        ({booking.event_date})
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Seats Reserved & Cancel Button */}
                  <View style={styles.bottomRow}>
                    <View style={styles.seatsWrap}>
                      {(booking.tickets || []).map((t) => (
                        <View key={t.id} style={styles.seatChip}>
                          <Text style={styles.seatChipText}>
                            Row {t.row_label}-{t.seat_number}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancelBooking(booking)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
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
    paddingBottom: 36,
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
    gap: 16,
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
  },
  headerBlock: {
    gap: 4,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breadcrumbLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  breadcrumbSep: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  breadcrumbCurrent: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  pageSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  metricSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  filterCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  filterGroupLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chipsRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: COLORS.maroon,
    borderColor: COLORS.maroon,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#374151',
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    color: COLORS.textPrimary,
  },
  filterBtn: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: COLORS.maroon,
  },
  filterBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  resetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  tableCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingBox: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyBox: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  bookingsList: {
    gap: 12,
  },
  bookingItem: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  bookingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  bookingRef: {
    fontSize: 12.5,
    fontWeight: '900',
    color: COLORS.maroon,
  },
  studentName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  studentEmail: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  freeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#D1FAE5',
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#065F46',
  },
  paidAmount: {
    fontSize: 13.5,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  gcashRef: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  bookedDate: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  showLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  showLinkLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  showLinkTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  showLinkDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  seatsWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  seatChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.maroonPale,
    borderWidth: 1,
    borderColor: COLORS.maroonBorder,
  },
  seatChipText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.maroonDark,
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#FEE2E2',
  },
  cancelBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#DC2626',
  },
});
