import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { fetchEvents } from '../services/api';

export default function EventsCatalogScreen({ onSelectEvent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'free', 'paid'

  const loadData = async () => {
    const data = await fetchEvents();
    if (Array.isArray(data)) {
      setEvents(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredEvents = events.filter((ev) => {
    if (filter === 'free') return ev.pricing_type === 'free';
    if (filter === 'paid') return ev.pricing_type === 'paid';
    return true;
  });

  const renderEventCard = ({ item }) => {
    const isFree = item.pricing_type === 'free';
    const totalSeats = item.total_seats || 60;
    const booked = item.booked_seats_count || 0;
    const available = Math.max(0, totalSeats - booked);

    return (
      <View style={styles.card}>
        {/* Banner Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.banner_image || 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800' }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.badgeOverlay}>
            <View style={[styles.pricingBadge, isFree ? styles.freeBadge : styles.paidBadge]}>
              <Text style={[styles.pricingBadgeText, isFree ? styles.freeBadgeText : styles.paidBadgeText]}>
                {isFree ? 'FREE ADMISSION' : `VIP ₱${item.vip_price} • REG ₱${item.regular_price}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.eventTitle}>{item.title}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText} numberOfLines={1}>{item.venue}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text style={styles.metaText}>{item.formatted_date || 'Upcoming'}</Text>
            <Text style={styles.timeTag}>⏰ {item.formatted_time || 'TBA'}</Text>
          </View>

          {/* Seat Availability Progress Bar */}
          <View style={styles.seatCapacityBox}>
            <View style={styles.capacityLabelRow}>
              <Text style={styles.capacityLabel}>Auditorium Capacity</Text>
              <Text style={styles.capacityCount}>
                <Text style={styles.capacityHighlight}>{available}</Text> of {totalSeats} seats open
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.round((available / totalSeats) * 100))}%` },
                ]}
              />
            </View>
          </View>

          {/* CTA Action */}
          <TouchableOpacity
            style={styles.selectSeatsBtn}
            onPress={() => onSelectEvent(item)}
            activeOpacity={0.85}
          >
            <Text style={styles.selectSeatsText}>Select Cinema Seats ›</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Campus Banner */}
      <View style={styles.taglineBanner}>
        <Text style={styles.taglineBannerText}>
          🎭 MSEUF CAMPUS THEATER & FESTIVALS
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All Shows ({events.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'paid' && styles.filterChipActive]}
          onPress={() => setFilter('paid')}
        >
          <Text style={[styles.filterText, filter === 'paid' && styles.filterTextActive]}>
            ★ VIP & Paid
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'free' && styles.filterChipActive]}
          onPress={() => setFilter('free')}
        >
          <Text style={[styles.filterText, filter === 'free' && styles.filterTextActive]}>
            Free Entry
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.maroon} />
          <Text style={styles.loadingText}>Loading campus shows from Laravel MVC...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderEventCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.maroon]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No shows scheduled yet</Text>
              <Text style={styles.emptySubtitle}>Check back soon for new collegiate drama events.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.maroon,
    borderColor: COLORS.maroon,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 14,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    backgroundColor: '#333',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  pricingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadge: {
    backgroundColor: COLORS.success,
  },
  paidBadge: {
    backgroundColor: COLORS.maroon,
    borderWidth: 1,
    borderColor: COLORS.vipGold,
  },
  pricingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  cardContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  timeTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.maroon,
    backgroundColor: COLORS.maroonPale,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  seatCapacityBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  capacityLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  capacityLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  capacityCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  capacityHighlight: {
    color: COLORS.maroon,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.maroon,
    borderRadius: 3,
  },
  selectSeatsBtn: {
    marginTop: 14,
    backgroundColor: COLORS.maroon,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.maroonDark,
  },
  selectSeatsText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
