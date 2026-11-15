import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';
import {
  fetchAdminEventDetails,
  deleteAdminEvent,
  cancelAdminBooking,
  validateAdminTicket,
} from '../services/api';

export default function AdminEventShowScreen({
  event,
  flashMessage,
  onClearFlash,
  onBack,
  onEditShow,
  onOpenScanner,
  onDeleted,
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeatInfo, setSelectedSeatInfo] = useState(null);
  const [localFlash, setLocalFlash] = useState(null);

  const loadDetails = useCallback(async () => {
    const res = await fetchAdminEventDetails(event.id);
    if (res && res.success) {
      setDetails(res);
    }
    setLoading(false);
    setRefreshing(false);
  }, [event.id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const currentEvent = details?.event || event;
  const stats = details?.stats || {
    total_seats: 60,
    occupied_count: currentEvent?.booked_seats_count || 0,
    available_count: Math.max(0, 60 - (currentEvent?.booked_seats_count || 0)),
    occupancy_rate: currentEvent?.occupancy_percent || 0,
    event_revenue: 0,
  };
  const seatsByRow = details?.seats_by_row || {};
  const bookings = details?.bookings || [];

  const handleDeleteShow = () => {
    const runDelete = async () => {
      const res = await deleteAdminEvent(currentEvent.id);
      if (res && res.success) {
        onDeleted(res.message);
      } else {
        setLocalFlash({
          type: 'error',
          text: res?.message || 'Could not delete show.',
        });
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Are you sure you want to delete this show?')) {
        runDelete();
      }
    } else {
      Alert.alert(
        'Delete Show',
        'Are you sure you want to delete this show?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: runDelete },
        ]
      );
    }
  };

  const handleVerifyBooking = async (bookingRef) => {
    const res = await validateAdminTicket(bookingRef);
    if (res && (res.status === 'success' || res.status === 'warning')) {
      setLocalFlash({
        type: res.status === 'success' ? 'success' : 'error',
        text: res.message,
      });
      loadDetails();
    } else {
      setLocalFlash({
        type: 'error',
        text: res?.message || 'Could not verify booking.',
      });
    }
  };

  const handleCancelBooking = (booking) => {
    const runCancel = async () => {
      const res = await cancelAdminBooking(booking.id);
      if (res && res.success) {
        setLocalFlash({ type: 'success', text: res.message });
        setSelectedSeatInfo(null);
        loadDetails();
      } else {
        setLocalFlash({
          type: 'error',
          text: res?.message || 'Could not cancel reservation.',
        });
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (
        window.confirm(`Cancel reservation #${booking.booking_reference}?`)
      ) {
        runCancel();
      }
    } else {
      Alert.alert(
        'Cancel Reservation',
        `Cancel reservation #${booking.booking_reference}?`,
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
            loadDetails();
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
        {/* Flash Banner */}
        {(flashMessage || localFlash) && (
          <View
            style={[
              styles.flashBox,
              localFlash?.type === 'error'
                ? styles.flashError
                : styles.flashSuccess,
            ]}
          >
            <Text
              style={[
                styles.flashText,
                localFlash?.type === 'error'
                  ? styles.flashErrorText
                  : styles.flashSuccessText,
              ]}
            >
              {localFlash ? localFlash.text : flashMessage}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setLocalFlash(null);
                if (onClearFlash) onClearFlash();
              }}
            >
              <Text style={styles.flashDismiss}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===================================================================== */}
        {/* 1. TOP NAVIGATION & ACTION BAR (Matches admin/events/show.blade.php)   */}
        {/* ===================================================================== */}
        <View style={styles.topHeaderBlock}>
          <View>
            <View style={styles.breadcrumbRow}>
              <TouchableOpacity onPress={onBack}>
                <Text style={styles.breadcrumbLink}>Shows & Plays</Text>
              </TouchableOpacity>
              <Text style={styles.breadcrumbSep}>›</Text>
              <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
                {currentEvent.title}
              </Text>
            </View>
            <Text style={styles.pageTitle}>
              Show Overview & Live Seat Map
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editDetailsBtn}
              onPress={() => onEditShow(currentEvent)}
              activeOpacity={0.8}
            >
              <Text style={styles.editDetailsBtnText}>Edit Show Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gateScannerBtn}
              onPress={onOpenScanner}
              activeOpacity={0.8}
            >
              <Text style={styles.gateScannerBtnText}>Gate Scanner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeleteShow}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===================================================================== */}
        {/* 2. SHOW SUMMARY BANNER & STATS CARDS                                  */}
        {/* ===================================================================== */}
        <View style={styles.summaryCard}>
          <View style={styles.bannerBox}>
            <Image
              source={{
                uri:
                  currentEvent.banner_image ||
                  'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80',
              }}
              style={styles.bannerImg}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerBottomInfo}>
              {currentEvent.pricing_type === 'free' ? (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>FREE ADMISSION</Text>
                </View>
              ) : (
                <View style={styles.paidBadge}>
                  <Text style={styles.paidBadgeText}>
                    ★ VIP ₱{Number(currentEvent.vip_price || 0).toFixed(0)} • REG ₱
                    {Number(currentEvent.regular_price || 0).toFixed(0)}
                  </Text>
                </View>
              )}
              <Text style={styles.bannerVenueText}>{currentEvent.venue}</Text>
            </View>
          </View>

          <View style={styles.summaryBody}>
            <Text style={styles.summaryDateText}>
              {currentEvent.formatted_date
                ? `${currentEvent.formatted_date} • ${
                    currentEvent.formatted_time || ''
                  }`
                : currentEvent.short_date || 'TBA'}
            </Text>
            <Text style={styles.summaryTitle}>{currentEvent.title}</Text>
            <Text style={styles.summaryDesc}>
              Live production hosted at Manuel S. Enverga University Foundation. Interactive auditorium seat picker enabled for students.
            </Text>

            {/* 4 Stats Boxes */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>RESERVED SEATS</Text>
                <Text style={[styles.statValue, { color: COLORS.maroon }]}>
                  {stats.occupied_count}
                </Text>
                <Text style={styles.statSub}>of {stats.total_seats} total</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>OPEN SEATS</Text>
                <Text style={[styles.statValue, { color: COLORS.success }]}>
                  {stats.available_count}
                </Text>
                <Text style={styles.statSub}>Available</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>OCCUPANCY</Text>
                <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>
                  {stats.occupancy_rate}%
                </Text>
                <Text style={styles.statSub}>Capacity</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>SHOW REVENUE</Text>
                <Text style={[styles.statValue, { color: COLORS.vipGold }]}>
                  ₱{Number(stats.event_revenue || 0).toLocaleString()}
                </Text>
                <Text style={styles.statSub}>GCash Sales</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ===================================================================== */}
        {/* 3. INTERACTIVE VISUAL CINEMA SEATING MAP (60 Seats)                    */}
        {/* ===================================================================== */}
        <View style={styles.seatMapCard}>
          <View style={styles.seatMapHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Auditorium Live Seating Layout (60 Seats)
              </Text>
              <Text style={styles.sectionSub}>
                Click any seat to inspect student reservation details and check-in status.
              </Text>
            </View>

            {/* Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={styles.legendBoxAvailable} />
                <Text style={styles.legendText}>Available</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendBoxOccupied} />
                <Text style={styles.legendTextBold}>Occupied</Text>
              </View>
              <View style={styles.vipRowPill}>
                <Text style={styles.vipRowPillText}>VIP (Rows A-B)</Text>
              </View>
            </View>
          </View>

          {/* Stage Bar */}
          <View style={styles.stageContainer}>
            <View style={styles.stageBar} />
            <Text style={styles.stageLabel}>
              AUDITORIUM STAGE / CINEMA SCREEN
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={COLORS.maroon} />
              <Text style={styles.loadingText}>Loading 60-seat layout...</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.seatGridScroll}
            >
              <View style={styles.seatRowsContainer}>
                {['A', 'B', 'C', 'D', 'E', 'F'].map((rowLabel) => {
                  const rowSeats = seatsByRow[rowLabel] || [];
                  const isVipRow = rowLabel === 'A' || rowLabel === 'B';

                  return (
                    <View key={rowLabel} style={styles.seatRow}>
                      {/* Left Row Label */}
                      <View
                        style={[
                          styles.rowBadge,
                          isVipRow ? styles.rowBadgeVip : styles.rowBadgeReg,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rowBadgeText,
                            isVipRow
                              ? styles.rowBadgeTextVip
                              : styles.rowBadgeTextReg,
                          ]}
                        >
                          {rowLabel}
                        </Text>
                      </View>

                      {/* 10 Seats */}
                      <View style={styles.rowSeatsWrap}>
                        {rowSeats.map((seat) => {
                          const isOccupied = Boolean(seat.is_occupied);
                          const occupant = seat.occupant;
                          const isSelected =
                            selectedSeatInfo?.seatCode === seat.seat_code;

                          return (
                            <TouchableOpacity
                              key={seat.id}
                              style={[
                                styles.seatBtn,
                                isOccupied
                                  ? styles.seatBtnOccupied
                                  : isVipRow
                                    ? styles.seatBtnAvailableVip
                                    : styles.seatBtnAvailable,
                                isSelected && styles.seatBtnHighlighted,
                              ]}
                              onPress={() =>
                                setSelectedSeatInfo({
                                  seatCode: seat.seat_code,
                                  tier: seat.tier,
                                  isOccupied,
                                  student: occupant?.student_name || 'None',
                                  bookingRef: occupant?.booking_ref || 'N/A',
                                  checkedIn: Boolean(occupant?.is_checked_in),
                                  token: occupant?.qr_token || '',
                                })
                              }
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[
                                  styles.seatBtnText,
                                  isOccupied
                                    ? styles.seatBtnTextOccupied
                                    : styles.seatBtnTextAvailable,
                                ]}
                              >
                                {seat.seat_number}
                              </Text>
                              {isOccupied && occupant?.is_checked_in && (
                                <View style={styles.checkedInDot} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Right Row Label */}
                      <View
                        style={[
                          styles.rowBadge,
                          isVipRow ? styles.rowBadgeVip : styles.rowBadgeReg,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rowBadgeText,
                            isVipRow
                              ? styles.rowBadgeTextVip
                              : styles.rowBadgeTextReg,
                          ]}
                        >
                          {rowLabel}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Selected Seat Inspector Drawer (Matches show.blade.php) */}
          {selectedSeatInfo && (
            <View style={styles.inspectorDrawer}>
              <View style={styles.inspectorLeft}>
                <View
                  style={[
                    styles.inspectorSeatBox,
                    selectedSeatInfo.isOccupied
                      ? styles.inspectorSeatBoxOccupied
                      : styles.inspectorSeatBoxOpen,
                  ]}
                >
                  <Text
                    style={[
                      styles.inspectorSeatCode,
                      selectedSeatInfo.isOccupied
                        ? { color: COLORS.white }
                        : { color: COLORS.maroon },
                    ]}
                  >
                    {selectedSeatInfo.seatCode}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.inspectorTitleRow}>
                    <Text style={styles.inspectorTitle}>
                      Seat {selectedSeatInfo.seatCode}
                    </Text>
                    <View
                      style={[
                        styles.inspectorTierPill,
                        selectedSeatInfo.tier === 'vip'
                          ? styles.inspectorTierVip
                          : styles.inspectorTierReg,
                      ]}
                    >
                      <Text
                        style={[
                          styles.inspectorTierText,
                          selectedSeatInfo.tier === 'vip'
                            ? { color: '#92400E' }
                            : { color: '#374151' },
                        ]}
                      >
                        {selectedSeatInfo.tier.toUpperCase()} TIER
                      </Text>
                    </View>
                  </View>

                  {selectedSeatInfo.isOccupied ? (
                    <Text style={styles.inspectorSub}>
                      Reserved by:{' '}
                      <Text style={styles.inspectorHighlight}>
                        {selectedSeatInfo.student}
                      </Text>{' '}
                      • Ref: {selectedSeatInfo.bookingRef}
                    </Text>
                  ) : (
                    <Text style={styles.inspectorOpenText}>
                      Seat is open and available for student booking on mobile app
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.inspectorRight}>
                {selectedSeatInfo.isOccupied && (
                  <View
                    style={[
                      styles.checkInStatusPill,
                      selectedSeatInfo.checkedIn
                        ? styles.checkInDonePill
                        : styles.checkInPendingPill,
                    ]}
                  >
                    <Text
                      style={[
                        styles.checkInStatusText,
                        selectedSeatInfo.checkedIn
                          ? { color: '#065F46' }
                          : { color: '#92400E' },
                      ]}
                    >
                      {selectedSeatInfo.checkedIn
                        ? 'Checked In at Gate'
                        : 'Gate Check-In Pending'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => setSelectedSeatInfo(null)}
                  style={styles.inspectorCloseBtn}
                >
                  <Text style={styles.inspectorCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ===================================================================== */}
        {/* 4. STUDENT RESERVATIONS & ATTENDEES TABLE                              */}
        {/* ===================================================================== */}
        <View style={styles.attendeesCard}>
          <Text style={styles.sectionTitle}>
            Student Attendee Reservations ({bookings.length} Orders)
          </Text>
          <Text style={styles.sectionSub}>
            List of students who booked passes for this play on the mobile application.
          </Text>

          {bookings.length === 0 ? (
            <View style={styles.emptyBookingsBox}>
              <Text style={styles.emptyBookingsTitle}>
                No Student Reservations Yet
              </Text>
              <Text style={styles.emptyBookingsSub}>
                Once students book seats on the mobile app, their names and QR tokens will appear here in real time.
              </Text>
            </View>
          ) : (
            <View style={styles.bookingsList}>
              {bookings.map((b) => (
                <View key={b.id} style={styles.bookingRowCard}>
                  <View style={styles.bookingRowTop}>
                    <View>
                      <Text style={styles.bookingRefText}>
                        {b.booking_reference}
                      </Text>
                      <Text style={styles.bookingStudentName}>
                        {b.student_name}
                      </Text>
                      {Boolean(b.student_email) && (
                        <Text style={styles.bookingStudentEmail}>
                          {b.student_email}
                        </Text>
                      )}
                    </View>

                    <View style={styles.bookingRightBadges}>
                      {b.payment_status === 'free' ? (
                        <View style={styles.freePill}>
                          <Text style={styles.freePillText}>FREE PASS</Text>
                        </View>
                      ) : (
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.paidAmountText}>
                            ₱{Number(b.total_amount || 0).toFixed(2)}
                          </Text>
                          {Boolean(b.gcash_reference) && (
                            <Text style={styles.gcashRefText}>
                              GCash: {b.gcash_reference}
                            </Text>
                          )}
                        </View>
                      )}

                      <View
                        style={[
                          styles.gatePill,
                          b.all_checked_in
                            ? styles.gatePillChecked
                            : styles.gatePillPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.gatePillText,
                            b.all_checked_in
                              ? { color: '#065F46' }
                              : { color: '#92400E' },
                          ]}
                        >
                          {b.all_checked_in ? 'Checked In' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Reserved Seats Chips */}
                  <View style={styles.seatsChipRow}>
                    {(b.tickets || []).map((t) => (
                      <View key={t.id} style={styles.seatChip}>
                        <Text style={styles.seatChipText}>
                          Row {t.row_label}-{t.seat_number}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Actions Row */}
                  <View style={styles.bookingActionsRow}>
                    {!b.all_checked_in && (
                      <TouchableOpacity
                        style={styles.verifyInlineBtn}
                        onPress={() => handleVerifyBooking(b.booking_reference)}
                      >
                        <Text style={styles.verifyInlineBtnText}>
                          Verify Admission
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.cancelInlineBtn}
                      onPress={() => handleCancelBooking(b)}
                    >
                      <Text style={styles.cancelInlineBtnText}>Cancel</Text>
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
  },
  topHeaderBlock: {
    gap: 12,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
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
    flex: 1,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  editDetailsBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editDetailsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2937',
  },
  gateScannerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: COLORS.maroonPale,
    borderWidth: 1,
    borderColor: COLORS.maroonBorder,
  },
  gateScannerBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.maroonDark,
  },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B91C1C',
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bannerBox: {
    height: 180,
    backgroundColor: '#111827',
    position: 'relative',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bannerBottomInfo: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    gap: 6,
  },
  freeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  freeBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },
  paidBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.maroon,
    borderWidth: 1,
    borderColor: COLORS.vipGold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  paidBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },
  bannerVenueText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryBody: {
    padding: 18,
  },
  summaryDateText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.maroon,
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  summaryDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  statsGrid: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '900',
    marginTop: 3,
  },
  statSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  seatMapCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  seatMapHeader: {
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  sectionSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBoxAvailable: {
    width: 15,
    height: 15,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.maroon,
    backgroundColor: COLORS.white,
  },
  legendBoxOccupied: {
    width: 15,
    height: 15,
    borderRadius: 4,
    backgroundColor: COLORS.maroon,
  },
  legendText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  legendTextBold: {
    fontSize: 11.5,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  vipRowPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  vipRowPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#92400E',
  },
  stageContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  stageBar: {
    width: '85%',
    height: 10,
    borderRadius: 999,
    backgroundColor: COLORS.maroon,
    opacity: 0.75,
    marginBottom: 5,
  },
  stageLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  loadingBox: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  seatGridScroll: {
    paddingBottom: 8,
  },
  seatRowsContainer: {
    gap: 8,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBadgeVip: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  rowBadgeReg: {
    backgroundColor: '#F3F4F6',
  },
  rowBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  rowBadgeTextVip: {
    color: '#78350F',
  },
  rowBadgeTextReg: {
    color: '#4B5563',
  },
  rowSeatsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  seatBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  seatBtnAvailable: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.maroon,
  },
  seatBtnAvailableVip: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  seatBtnOccupied: {
    backgroundColor: COLORS.maroon,
  },
  seatBtnHighlighted: {
    transform: [{ scale: 1.08 }],
    borderWidth: 2,
    borderColor: '#111827',
  },
  seatBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  seatBtnTextAvailable: {
    color: COLORS.maroonDark,
  },
  seatBtnTextOccupied: {
    color: COLORS.white,
  },
  checkedInDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#34D399',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  inspectorDrawer: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  inspectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inspectorSeatBox: {
    width: 44,
    height: 44,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectorSeatBoxOccupied: {
    backgroundColor: COLORS.maroon,
  },
  inspectorSeatBoxOpen: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.maroon,
  },
  inspectorSeatCode: {
    fontSize: 15,
    fontWeight: '900',
  },
  inspectorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inspectorTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  inspectorTierPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  inspectorTierVip: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  inspectorTierReg: {
    backgroundColor: '#E5E7EB',
  },
  inspectorTierText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  inspectorSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  inspectorHighlight: {
    fontWeight: '800',
    color: COLORS.maroon,
  },
  inspectorOpenText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#047857',
    marginTop: 2,
  },
  inspectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkInStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  checkInDonePill: {
    backgroundColor: '#D1FAE5',
  },
  checkInPendingPill: {
    backgroundColor: '#FEF3C7',
  },
  checkInStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  inspectorCloseBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inspectorCloseText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  attendeesCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyBookingsBox: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyBookingsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptyBookingsSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  bookingsList: {
    marginTop: 14,
    gap: 10,
  },
  bookingRowCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  bookingRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  bookingRefText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: COLORS.maroon,
  },
  bookingStudentName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  bookingStudentEmail: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  bookingRightBadges: {
    alignItems: 'flex-end',
    gap: 5,
  },
  freePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#D1FAE5',
  },
  freePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#065F46',
  },
  paidAmountText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  gcashRefText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  gatePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  gatePillChecked: {
    backgroundColor: '#D1FAE5',
  },
  gatePillPending: {
    backgroundColor: '#FEF3C7',
  },
  gatePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  seatsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
  bookingActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  verifyInlineBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: COLORS.maroon,
  },
  verifyInlineBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
  },
  cancelInlineBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#FEE2E2',
  },
  cancelInlineBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B91C1C',
  },
});
