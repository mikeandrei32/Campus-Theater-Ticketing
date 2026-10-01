import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { fetchEventSeats } from '../services/api';

export default function SeatPickerScreen({ event, onProceedToCheckout }) {
  const [loading, setLoading] = useState(true);
  const [seatsByRow, setSeatsByRow] = useState({});
  const [occupiedSeatIds, setOccupiedSeatIds] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [maxSelection, setMaxSelection] = useState(4);

  useEffect(() => {
    loadSeats();
  }, [event.id]);

  const loadSeats = async () => {
    setLoading(true);
    const data = await fetchEventSeats(event.id);
    if (data && data.seats_by_row) {
      setSeatsByRow(data.seats_by_row);
      setOccupiedSeatIds(data.occupied_seat_ids || []);
      if (data.max_selection_limit) {
        setMaxSelection(data.max_selection_limit);
      }
    }
    setLoading(false);
  };

  const handleSeatPress = (seat) => {
    if (seat.is_occupied || occupiedSeatIds.includes(seat.id)) {
      Alert.alert('Seat Unavailable', `Seat ${seat.seat_code} has already been reserved.`);
      return;
    }

    const isAlreadySelected = selectedSeatIds.includes(seat.id);

    if (isAlreadySelected) {
      // Deselect
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
    } else {
      // Check 4-seat limit per student
      if (selectedSeatIds.length >= maxSelection) {
        Alert.alert(
          'Maximum Limit Reached',
          `You may select a maximum of ${maxSelection} seats per reservation.`
        );
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  // Find seat object from flat lookup
  const getSelectedSeatObjects = () => {
    const list = [];
    Object.values(seatsByRow).forEach((rowSeats) => {
      rowSeats.forEach((seat) => {
        if (selectedSeatIds.includes(seat.id)) {
          list.push(seat);
        }
      });
    });
    return list;
  };

  const selectedSeatsList = getSelectedSeatObjects();

  // Dynamic price calculation
  const calculateTotal = () => {
    if (event.pricing_type === 'free') return 0;
    let sum = 0;
    selectedSeatsList.forEach((s) => {
      sum += s.is_vip ? Number(event.vip_price) : Number(event.regular_price);
    });
    return sum;
  };

  const totalCost = calculateTotal();

  return (
    <View style={styles.container}>
      {/* Event Header Strip */}
      <View style={styles.eventStrip}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
          <Text style={styles.eventSub}>{event.venue} • {event.formatted_time || '6:00 PM'}</Text>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceTagText}>
            {event.pricing_type === 'free' ? 'FREE' : `₱${event.regular_price} - ₱${event.vip_price}`}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.maroon} />
          <Text style={styles.loadingText}>Fetching theater auditorium grid...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* Curved Cinema Screen Indicator */}
          <View style={styles.screenContainer}>
            <View style={styles.screenArc}>
              <View style={styles.screenGlow} />
            </View>
            <Text style={styles.screenLabel}>STAGE / SCREEN</Text>
          </View>

          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.seatAvailable]} />
              <Text style={styles.legendText}>Regular</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.seatVip]} />
              <Text style={styles.legendText}>VIP (A-B)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.seatSelected]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.seatOccupied]} />
              <Text style={styles.legendText}>Sold</Text>
            </View>
          </View>

          {/* Seat Grid (60 chairs) */}
          <View style={styles.gridContainer}>
            {Object.keys(seatsByRow).map((rowLabel) => {
              const rowSeats = seatsByRow[rowLabel] || [];
              const isVipRow = rowLabel === 'A' || rowLabel === 'B';

              return (
                <View key={rowLabel} style={styles.rowWrapper}>
                  {/* Left Row Indicator */}
                  <View style={[styles.rowLabelBadge, isVipRow && styles.vipRowBadge]}>
                    <Text style={[styles.rowLabelText, isVipRow && styles.vipRowText]}>
                      {rowLabel}
                    </Text>
                  </View>

                  {/* Seats 1 to 5 (Left Wing) */}
                  <View style={styles.seatWing}>
                    {rowSeats.slice(0, 5).map((seat) => renderSeat(seat))}
                  </View>

                  {/* Center Cinema Aisle */}
                  <View style={styles.aisle}>
                    <Text style={styles.aisleText}>|</Text>
                  </View>

                  {/* Seats 6 to 10 (Right Wing) */}
                  <View style={styles.seatWing}>
                    {rowSeats.slice(5, 10).map((seat) => renderSeat(seat))}
                  </View>

                  {/* Right Row Indicator */}
                  <View style={[styles.rowLabelBadge, isVipRow && styles.vipRowBadge]}>
                    <Text style={[styles.rowLabelText, isVipRow && styles.vipRowText]}>
                      {rowLabel}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* VIP Notice */}
          <View style={styles.vipNotice}>
            <Text style={styles.vipNoticeTitle}>★ VIP Front Rows (A & B)</Text>
            <Text style={styles.vipNoticeText}>
              Premium proximity to the stage. {event.pricing_type === 'paid' ? `₱${event.vip_price} per seat.` : 'Free reservation.'}
            </Text>
          </View>

          {/* Spacer for bottom dock */}
          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {/* Floating Bottom Dock */}
      <View style={styles.bottomDock}>
        <View style={styles.dockLeft}>
          <View style={styles.dockCountRow}>
            <Text style={styles.dockCountText}>
              {selectedSeatIds.length} of {maxSelection} seats
            </Text>
            {selectedSeatIds.length === maxSelection && (
              <Text style={styles.dockMaxBadge}>MAX</Text>
            )}
          </View>

          {/* Chips of chosen seats */}
          <View style={styles.chipsRow}>
            {selectedSeatsList.length === 0 ? (
              <Text style={styles.noSeatsText}>Tap chairs above to pick</Text>
            ) : (
              selectedSeatsList.map((s) => (
                <View key={s.id} style={[styles.seatChip, s.is_vip && styles.vipSeatChip]}>
                  <Text style={[styles.seatChipText, s.is_vip && styles.vipSeatChipText]}>
                    {s.seat_code}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Total Cost */}
          <Text style={styles.dockTotalText}>
            Total:{' '}
            <Text style={styles.dockTotalAmount}>
              {event.pricing_type === 'free' ? 'FREE' : `₱${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutBtn, selectedSeatIds.length === 0 && styles.checkoutBtnDisabled]}
          onPress={() => onProceedToCheckout({ event, selectedSeats: selectedSeatsList, totalCost })}
          disabled={selectedSeatIds.length === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutBtnText}>
            {selectedSeatIds.length === 0 ? 'Select Seats' : 'Reserve ›'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  function renderSeat(seat) {
    const isOccupied = seat.is_occupied || occupiedSeatIds.includes(seat.id);
    const isSelected = selectedSeatIds.includes(seat.id);
    const isVip = seat.is_vip;

    let seatStyle = styles.seatAvailable;
    let textStyle = styles.seatTextAvailable;

    if (isOccupied) {
      seatStyle = styles.seatOccupied;
      textStyle = styles.seatTextOccupied;
    } else if (isSelected) {
      seatStyle = styles.seatSelected;
      textStyle = styles.seatTextSelected;
    } else if (isVip) {
      seatStyle = styles.seatVip;
      textStyle = styles.seatTextVip;
    }

    return (
      <TouchableOpacity
        key={seat.id}
        style={[styles.seatBox, seatStyle]}
        onPress={() => handleSeatPress(seat)}
        disabled={isOccupied}
        activeOpacity={0.7}
      >
        <Text style={[styles.seatNumberText, textStyle]}>
          {isOccupied ? '✕' : seat.seat_number}
        </Text>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  eventStrip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  eventSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  priceTag: {
    backgroundColor: COLORS.maroonPale,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.maroonBorder,
  },
  priceTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  screenContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  screenArc: {
    width: '85%',
    height: 10,
    borderTopWidth: 4,
    borderTopColor: COLORS.maroon,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    overflow: 'hidden',
  },
  screenGlow: {
    height: 10,
    backgroundColor: 'rgba(128, 0, 0, 0.1)',
  },
  screenLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.maroon,
    letterSpacing: 2,
    marginTop: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginVertical: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  gridContainer: {
    width: '100%',
    marginTop: 8,
    gap: 6,
  },
  rowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  rowLabelBadge: {
    width: 20,
    alignItems: 'center',
  },
  vipRowBadge: {
    backgroundColor: COLORS.vipBg,
    borderRadius: 4,
  },
  rowLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  vipRowText: {
    color: COLORS.vipGoldDark,
  },
  seatWing: {
    flexDirection: 'row',
    gap: 4,
  },
  aisle: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aisleText: {
    fontSize: 10,
    color: COLORS.borderDark,
  },
  seatBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  seatAvailable: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.maroonBorder,
  },
  seatTextAvailable: {
    color: COLORS.maroon,
    fontSize: 10,
    fontWeight: '700',
  },
  seatVip: {
    backgroundColor: COLORS.vipBg,
    borderColor: COLORS.vipGold,
  },
  seatTextVip: {
    color: COLORS.vipGoldDark,
    fontSize: 10,
    fontWeight: '800',
  },
  seatSelected: {
    backgroundColor: COLORS.maroon,
    borderColor: COLORS.maroonDark,
    transform: [{ scale: 1.08 }],
    shadowColor: COLORS.maroon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  seatTextSelected: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
  seatOccupied: {
    backgroundColor: COLORS.seatOccupied,
    borderColor: COLORS.seatOccupiedBorder,
  },
  seatTextOccupied: {
    color: COLORS.seatOccupiedText,
    fontSize: 9,
    fontWeight: '600',
  },
  vipNotice: {
    width: '100%',
    marginTop: 18,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.vipBg,
    borderWidth: 1,
    borderColor: COLORS.vipBorder,
  },
  vipNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.vipGoldDark,
  },
  vipNoticeText: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 2,
  },
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 2,
    borderTopColor: COLORS.maroon,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  dockLeft: {
    flex: 1,
    marginRight: 12,
  },
  dockCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dockCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  dockMaxBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.white,
    backgroundColor: COLORS.error,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 4,
  },
  noSeatsText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  seatChip: {
    backgroundColor: COLORS.maroonPale,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.maroonBorder,
  },
  seatChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  vipSeatChip: {
    backgroundColor: COLORS.vipBg,
    borderColor: COLORS.vipGold,
  },
  vipSeatChipText: {
    color: COLORS.vipGoldDark,
  },
  dockTotalText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  dockTotalAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.maroon,
  },
  checkoutBtn: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnDisabled: {
    backgroundColor: COLORS.borderDark,
  },
  checkoutBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
