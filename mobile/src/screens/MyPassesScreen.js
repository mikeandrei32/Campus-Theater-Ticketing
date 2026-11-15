import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { fetchCurrentUser } from '../services/api';

export default function MyPassesScreen({
  onBrowseShows,
  onSelectBookingPass,
}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPasses = useCallback(async () => {
    const res = await fetchCurrentUser();
    if (res && Array.isArray(res.bookings)) {
      setBookings(res.bookings);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadPasses();
  }, [loadPasses]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadPasses();
          }}
          colors={[COLORS.maroon]}
        />
      }
    >
      <View style={styles.taglineBanner}>
        <Text style={styles.taglineBannerText}>
          MSEUF UNIVERSITY THEATER • PERSONAL DIGITAL PASSES
        </Text>
      </View>

      <View style={styles.mainPadding}>
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>My Theater Passes</Text>
          <Text style={styles.pageSub}>
            View your reserved auditorium seats and present your Booking Reference or QR code at the gate.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.maroon} />
            <Text style={styles.loadingText}>Loading your passes...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Theater Passes Yet</Text>
            <Text style={styles.emptySub}>
              You haven't reserved any seats yet. Browse upcoming campus plays and cinema screenings to book your pass.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={onBrowseShows}
              activeOpacity={0.85}
            >
              <Text style={styles.browseBtnText}>Browse Shows & Plays ›</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {bookings.map((b) => (
              <View key={b.id} style={styles.passCard}>
                <View style={styles.passTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.passRef}>{b.booking_reference}</Text>
                    <Text style={styles.passTitle}>
                      {b.event?.title || 'Campus Theater Show'}
                    </Text>
                    <Text style={styles.passMeta}>
                      {b.event?.venue || 'Little Theater, AEC Building'} •{' '}
                      {b.event?.formatted_date || ''}{' '}
                      {b.event?.formatted_time || ''}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.paymentBadge,
                      b.payment_status === 'free'
                        ? { backgroundColor: '#D1FAE5' }
                        : { backgroundColor: COLORS.maroonPale },
                    ]}
                  >
                    <Text
                      style={[
                        styles.paymentBadgeText,
                        b.payment_status === 'free'
                          ? { color: '#065F46' }
                          : { color: COLORS.maroonDark },
                      ]}
                    >
                      {b.payment_status === 'free'
                        ? 'FREE PASS'
                        : `PAID ₱${Number(b.total_amount || 0).toFixed(0)}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.seatsRow}>
                  {(b.seats || []).map((s, idx) => (
                    <View key={idx} style={styles.seatChip}>
                      <Text style={styles.seatChipText}>
                        Row {s.row} - Seat {s.number}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.passFooter}>
                  <Text style={styles.bookedAtText}>
                    Booked: {b.created_at || 'Recently'}
                  </Text>
                  <TouchableOpacity
                    style={styles.viewStubBtn}
                    onPress={() => onSelectBookingPass(b)}
                  >
                    <Text style={styles.viewStubBtnText}>
                      Open QR Ticket Stub ›
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
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
  },
  mainPadding: {
    padding: 16,
    gap: 16,
  },
  headerBlock: {
    gap: 4,
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
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 300,
  },
  browseBtn: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.maroon,
    borderRadius: 12,
  },
  browseBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },
  listWrap: {
    gap: 12,
  },
  passCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  passTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  passRef: {
    fontSize: 12.5,
    fontWeight: '900',
    color: COLORS.maroon,
  },
  passTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  passMeta: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  paymentBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  seatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  seatChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.maroonPale,
    borderWidth: 1,
    borderColor: COLORS.maroonBorder,
  },
  seatChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.maroonDark,
  },
  passFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bookedAtText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  viewStubBtn: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: COLORS.maroon,
    borderRadius: 10,
  },
  viewStubBtnText: {
    color: COLORS.white,
    fontSize: 11.5,
    fontWeight: '800',
  },
});
