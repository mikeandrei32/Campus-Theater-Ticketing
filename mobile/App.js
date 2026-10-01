import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './src/constants/theme';
import Header from './src/components/Header';
import EventsCatalogScreen from './src/screens/EventsCatalogScreen';
import SeatPickerScreen from './src/screens/SeatPickerScreen';
import CheckoutModal from './src/screens/CheckoutModal';
import BookingConfirmationScreen from './src/screens/BookingConfirmationScreen';
import { getApiBaseUrl, setApiBaseUrl } from './src/services/api';

export default function App() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState('catalog'); // 'catalog', 'seats', 'confirmation'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Settings Modal State (for configuring Laravel backend URL)
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [backendUrl, setBackendUrlState] = useState(getApiBaseUrl());

  // Handlers
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setCurrentScreen('seats');
  };

  const handleProceedToCheckout = (orderData) => {
    setCheckoutData(orderData);
  };

  const handleBookingSuccess = (booking) => {
    setCheckoutData(null);
    setConfirmedBooking(booking);
    setCurrentScreen('confirmation');
  };

  const handleBackToShows = () => {
    setConfirmedBooking(null);
    setSelectedEvent(null);
    setCheckoutData(null);
    setCurrentScreen('catalog');
  };

  const handleSaveApiUrl = () => {
    setApiBaseUrl(backendUrl);
    setSettingsVisible(false);
  };

  // Header Title & Subtitle based on screen
  let headerTitle = null;
  let headerSubtitle = null;
  let showBack = false;

  if (currentScreen === 'seats') {
    headerTitle = selectedEvent?.title || 'Interactive Seat Picker';
    headerSubtitle = 'Pick up to 4 cinema chairs';
    showBack = true;
  } else if (currentScreen === 'confirmation') {
    headerTitle = 'University Ticket Stub';
    headerSubtitle = 'Digital Reservation Pass';
    showBack = false;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.maroonDark} />

      {/* MSEUF Header */}
      <Header
        title={headerTitle}
        subtitle={headerSubtitle}
        showBack={showBack}
        onBack={() => setCurrentScreen('catalog')}
        onSettingsPress={() => setSettingsVisible(true)}
      />

      {/* Screen Router */}
      <View style={styles.content}>
        {currentScreen === 'catalog' && (
          <EventsCatalogScreen onSelectEvent={handleSelectEvent} />
        )}

        {currentScreen === 'seats' && selectedEvent && (
          <SeatPickerScreen
            event={selectedEvent}
            onProceedToCheckout={handleProceedToCheckout}
          />
        )}

        {currentScreen === 'confirmation' && confirmedBooking && (
          <BookingConfirmationScreen
            booking={confirmedBooking}
            onBackToShows={handleBackToShows}
          />
        )}
      </View>

      {/* Checkout / Reservation Drawer Modal */}
      <CheckoutModal
        visible={!!checkoutData}
        data={checkoutData}
        onClose={() => setCheckoutData(null)}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Laravel Backend API Config Modal */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.settingsModalOverlay}>
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>⚙ Laravel Backend Connection</Text>
            <Text style={styles.settingsSubtitle}>
              Connect React Native mobile frontend to your Laravel MVC server.
            </Text>

            <Text style={styles.settingsLabel}>API Base URL:</Text>
            <TextInput
              style={styles.settingsInput}
              value={backendUrl}
              onChangeText={setBackendUrlState}
              placeholder="http://localhost:8000/api"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Presets */}
            <Text style={styles.presetLabel}>Quick Presets:</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => setBackendUrlState('http://localhost:8000/api')}
              >
                <Text style={styles.presetBtnText}>Web / iOS (localhost)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => setBackendUrlState('http://10.0.2.2:8000/api')}
              >
                <Text style={styles.presetBtnText}>Android Emulator (10.0.2.2)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsActions}>
              <TouchableOpacity
                style={styles.settingsCancelBtn}
                onPress={() => setSettingsVisible(false)}
              >
                <Text style={styles.settingsCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsSaveBtn}
                onPress={handleSaveApiUrl}
              >
                <Text style={styles.settingsSaveText}>Save & Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.maroonDark,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  settingsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  settingsCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  settingsSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 14,
  },
  settingsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  settingsInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 12,
    marginBottom: 6,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  presetBtn: {
    backgroundColor: COLORS.maroonPale,
    borderWidth: 1,
    borderColor: COLORS.maroonBorder,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  presetBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.maroon,
  },
  settingsActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  settingsCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  settingsCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  settingsSaveBtn: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  settingsSaveText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
});
