import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { bookSeats } from '../services/api';

export default function CheckoutModal({ visible, data, onClose, onBookingSuccess }) {
  if (!data) return null;

  const { event, selectedSeats, totalCost } = data;
  const isPaid = event.pricing_type === 'paid';

  const [studentName, setStudentName] = useState('MSEUF Student');
  const [gcashRef, setGcashRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!studentName.trim()) {
      setErrorMessage('Please enter student attendee name.');
      return;
    }

    if (isPaid && (!gcashRef.trim() || gcashRef.trim().length < 6)) {
      setErrorMessage('Please provide a valid GCash reference number (min 6 chars).');
      return;
    }

    setSubmitting(true);
    const seatIds = selectedSeats.map((s) => s.id);

    const result = await bookSeats(event.id, {
      seatIds,
      studentName: studentName.trim(),
      gcashReference: isPaid ? gcashRef.trim() : null,
    });

    setSubmitting(false);

    if (result && result.success) {
      onClose();
      onBookingSuccess(result.booking);
    } else {
      setErrorMessage(result?.message || 'Could not complete reservation.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Confirm Reservation</Text>
              <Text style={styles.modalSubtitle}>MSEUF Cinema Ticketing</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Event Info */}
            <View style={styles.eventSummaryBox}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventVenue}>📍 {event.venue}</Text>
              <Text style={styles.eventDate}>📅 {event.formatted_date || 'Upcoming'}</Text>
            </View>

            {/* Selected Seats Chips */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Selected Chairs ({selectedSeats.length}):</Text>
              <View style={styles.chipsRow}>
                {selectedSeats.map((s) => (
                  <View key={s.id} style={[styles.seatChip, s.is_vip && styles.vipChip]}>
                    <Text style={[styles.seatChipText, s.is_vip && styles.vipChipText]}>
                      {s.is_vip ? '★ ' : ''}{s.seat_code}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Attendee Name Input */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>Student Attendee Name *</Text>
              <TextInput
                style={styles.input}
                value={studentName}
                onChangeText={setStudentName}
                placeholder="e.g. Juan dela Cruz"
                placeholderTextColor={COLORS.textMuted}
              />
              <Text style={styles.inputHint}>
                Pass will be issued under this university student identity.
              </Text>
            </View>

            {/* GCash Reference (if paid) */}
            {isPaid && (
              <View style={styles.section}>
                <View style={styles.gcashHeader}>
                  <Text style={styles.inputLabel}>GCash Reference Number *</Text>
                  <Text style={styles.gcashTag}>GCash Express</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={gcashRef}
                  onChangeText={setGcashRef}
                  placeholder="e.g. MP-84729302"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="characters"
                />
                <Text style={styles.inputHint}>
                  Send ₱{totalCost.toFixed(2)} to MSEUF Treasury GCash: 0917-123-4567
                </Text>
              </View>
            )}

            {/* Total Summary */}
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Grand Total Amount:</Text>
              <Text style={styles.totalAmount}>
                {isPaid ? `₱${totalCost.toFixed(2)}` : 'FREE'}
              </Text>
            </View>

            {/* Error Message */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm & Book Seats</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  eventSummaryBox: {
    backgroundColor: COLORS.maroonPale,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.maroonBorder,
    marginBottom: 14,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  eventVenue: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  eventDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  seatChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.maroonBorder,
  },
  seatChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  vipChip: {
    backgroundColor: COLORS.vipBg,
    borderColor: COLORS.vipGold,
  },
  vipChipText: {
    color: COLORS.vipGoldDark,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  gcashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gcashTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#007DFE',
    backgroundColor: '#E6F2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
  inputHint: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 6,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.maroon,
  },
  errorBox: {
    backgroundColor: COLORS.errorBg,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 11,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: COLORS.maroon,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
