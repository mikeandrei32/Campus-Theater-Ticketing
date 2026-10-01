import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';

export default function BookingConfirmationScreen({ booking, onBackToShows }) {
  if (!booking) return null;

  const event = booking.event || {};
  const isFree = booking.payment_status === 'free';
  const seats = booking.seats || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Banner Notice */}
      <View style={styles.successBanner}>
        <Text style={styles.successIcon}>✓</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.successTitle}>Reservation Confirmed!</Text>
          <Text style={styles.successSub}>
            Your digital pass is now recorded in the Laravel MVC database.
          </Text>
        </View>
      </View>

      {/* Ticket Card Container */}
      <View style={styles.ticketCard}>
        {/* Ticket Header (Maroon) */}
        <View style={styles.ticketHeader}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>MSEUF DIGITAL PASS</Text>
          </View>
          <Text style={styles.ticketEventTitle}>{event.title || 'Campus Theater Event'}</Text>
          <Text style={styles.ticketVenue}>{event.venue || 'MSEUF Auditorium'}</Text>
          <View style={styles.dateChip}>
            <Text style={styles.dateChipText}>
              {event.formatted_date || 'Upcoming'} • {event.formatted_time || '6:00 PM'}
            </Text>
          </View>
        </View>

        {/* Perforated Cut-Line with Cinema Notches */}
        <View style={styles.notchCutLineContainer}>
          <View style={[styles.cinemaNotch, styles.notchLeft]} />
          <View style={styles.dashedLine} />
          <View style={[styles.cinemaNotch, styles.notchRight]} />
        </View>

        {/* Ticket Body */}
        <View style={styles.ticketBody}>
          {/* Attendee & Reference Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>STUDENT ATTENDEE</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{booking.attendee_name || 'Attendee'}</Text>
              <Text style={styles.infoSub}>{booking.attendee_email || 'student@mseuf.edu.ph'}</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>BOOKING REFERENCE</Text>
              <Text style={styles.referenceCode}>{booking.booking_reference}</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Confirmed</Text>
              </View>
            </View>
          </View>

          {/* Assigned Seats */}
          <View style={styles.seatsSection}>
            <Text style={styles.infoLabel}>ASSIGNED SEATS ({seats.length})</Text>
            <View style={styles.seatsRow}>
              {seats.map((s, idx) => (
                <View key={idx} style={[styles.seatTag, s.tier === 'vip' && styles.vipSeatTag]}>
                  {s.tier === 'vip' && <Text style={styles.vipTagStar}>★ VIP</Text>}
                  <Text style={[styles.seatTagCode, s.tier === 'vip' && styles.vipSeatTagCode]}>
                    Row {s.row} - Seat {s.number}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Payment Summary */}
          <View style={styles.paymentBox}>
            <View>
              <Text style={styles.paymentBoxLabel}>PAYMENT STATUS</Text>
              <Text style={styles.paymentBoxValue}>
                {isFree ? 'FREE ADMISSION' : 'PAID VIA GCASH'}
              </Text>
              {booking.gcash_reference && (
                <Text style={styles.gcashRef}>Ref: {booking.gcash_reference}</Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.paymentBoxLabel}>TOTAL CHARGE</Text>
              <Text style={styles.totalCharge}>
                {isFree ? 'FREE' : `₱${Number(booking.total_amount).toFixed(2)}`}
              </Text>
            </View>
          </View>

          {/* QR Code Pass Box */}
          <View style={styles.qrContainer}>
            <View style={styles.simulatedQrBox}>
              {/* Decorative QR Pattern */}
              <View style={styles.qrCornerTL} />
              <View style={styles.qrCornerTR} />
              <View style={styles.qrCornerBL} />
              <View style={styles.qrCenterDot} />
              <Text style={styles.qrStubText}>MSEUF DIGITAL QR</Text>
            </View>
            <Text style={styles.qrTokenText}>
              Pass Token: {booking.seats?.[0]?.qr_token?.slice(0, 18) || 'MSEUF-TOKEN'}...
            </Text>
            <Text style={styles.qrHint}>Present this digital pass at the auditorium usher gate.</Text>
          </View>
        </View>
      </View>

      {/* Done Action Button */}
      <TouchableOpacity style={styles.doneBtn} onPress={onBackToShows} activeOpacity={0.85}>
        <Text style={styles.doneBtnText}>‹ Return to Campus Shows</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  successBanner: {
    width: '100%',
    backgroundColor: COLORS.successBg,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.success,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  successSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  ticketCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ticketHeader: {
    backgroundColor: COLORS.maroon,
    padding: 20,
    alignItems: 'center',
  },
  badgePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgePillText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  ticketEventTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 22,
  },
  ticketVenue: {
    fontSize: 12,
    color: COLORS.maroonPale,
    marginTop: 4,
    fontWeight: '500',
  },
  dateChip: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 10,
  },
  dateChipText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  notchCutLineContainer: {
    height: 20,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cinemaNotch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    position: 'absolute',
  },
  notchLeft: {
    left: -10,
  },
  notchRight: {
    right: -10,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginHorizontal: 14,
  },
  ticketBody: {
    padding: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  infoSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  referenceCode: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.maroon,
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  seatsSection: {
    marginBottom: 14,
  },
  seatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  seatTag: {
    backgroundColor: COLORS.maroonPale,
    borderWidth: 1,
    borderColor: COLORS.maroonBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  vipSeatTag: {
    backgroundColor: COLORS.vipBg,
    borderColor: COLORS.vipGold,
  },
  vipTagStar: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.vipGoldDark,
  },
  seatTagCode: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  vipSeatTagCode: {
    color: COLORS.vipGoldDark,
  },
  paymentBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  paymentBoxValue: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  gcashRef: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  totalCharge: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.maroon,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  simulatedQrBox: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.maroon,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 8,
  },
  qrCornerTL: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderWidth: 4,
    borderColor: COLORS.maroon,
  },
  qrCornerTR: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderWidth: 4,
    borderColor: COLORS.maroon,
  },
  qrCornerBL: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 22,
    height: 22,
    borderWidth: 4,
    borderColor: COLORS.maroon,
  },
  qrCenterDot: {
    width: 14,
    height: 14,
    backgroundColor: COLORS.vipGold,
    borderRadius: 3,
  },
  qrStubText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.maroon,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  qrTokenText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  qrHint: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  doneBtn: {
    marginTop: 18,
    backgroundColor: COLORS.maroon,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
