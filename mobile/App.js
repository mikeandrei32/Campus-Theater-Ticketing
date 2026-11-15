import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './src/constants/theme';
import Header from './src/components/Header';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import EventsCatalogScreen from './src/screens/EventsCatalogScreen';
import SeatPickerScreen from './src/screens/SeatPickerScreen';
import CheckoutModal from './src/screens/CheckoutModal';
import BookingConfirmationScreen from './src/screens/BookingConfirmationScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminEventFormScreen from './src/screens/AdminEventFormScreen';
import AdminEventShowScreen from './src/screens/AdminEventShowScreen';
import AdminBookingsScreen from './src/screens/AdminBookingsScreen';
import AdminScannerScreen from './src/screens/AdminScannerScreen';
import MyPassesScreen from './src/screens/MyPassesScreen';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  fetchCurrentUser,
  logoutUser,
} from './src/services/api';

export default function App() {
  // Navigation State: Sign In ('login') is the first screen shown when opening the project
  const [currentScreen, setCurrentScreen] = useState('login');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [user, setUser] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null);

  // Settings Modal State (for configuring Laravel backend URL)
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [backendUrl, setBackendUrlState] = useState(getApiBaseUrl());

  const isUserAdmin = (u) =>
    Boolean(u && (u.role === 'admin' || u.is_admin || u.can_manage_theater));

  useEffect(() => {
    fetchCurrentUser().then((res) => {
      if (res && res.user) {
        setUser(res.user);
        setCurrentScreen(
          isUserAdmin(res.user) ? 'admin_dashboard' : 'catalog'
        );
      }
    });
  }, []);

  const homeScreenForUser = (u = user) =>
    isUserAdmin(u) ? 'admin_dashboard' : 'catalog';

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
    setCurrentScreen(homeScreenForUser());
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    if (selectedEvent) {
      setCurrentScreen('seats');
    } else {
      setCurrentScreen(homeScreenForUser(authenticatedUser));
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setSelectedEvent(null);
    setEditingEvent(null);
    setCheckoutData(null);
    setConfirmedBooking(null);
    setFlashMessage(null);
    setCurrentScreen('login');
  };

  const handleSaveApiUrl = () => {
    setApiBaseUrl(backendUrl);
    setSettingsVisible(false);
  };

  const handleHeaderNavigate = (targetScreen) => {
    setFlashMessage(null);
    if (targetScreen === 'admin_create_event') {
      setEditingEvent(null);
    }
    setCurrentScreen(targetScreen);
  };

  // Header Title & Subtitle based on screen
  let headerTitle = null;
  let headerSubtitle = null;
  let showBack = false;
  let onBackAction = () => setCurrentScreen(homeScreenForUser());

  if (currentScreen === 'login') {
    headerTitle = 'Sign In to Portal';
    headerSubtitle = 'MSEUF University Theater & Cinema Ticketing';
    showBack = false;
  } else if (currentScreen === 'register') {
    headerTitle = 'Create Student Account';
    headerSubtitle = 'Register for MSEUF Theater & Cinema Ticketing';
    showBack = true;
    onBackAction = () => setCurrentScreen('login');
  } else if (currentScreen === 'seats') {
    headerTitle = selectedEvent?.title || 'Interactive Seat Picker';
    headerSubtitle = 'Pick up to 4 cinema chairs';
    showBack = true;
    onBackAction = () => setCurrentScreen(homeScreenForUser());
  } else if (currentScreen === 'confirmation') {
    headerTitle = 'University Ticket Stub';
    headerSubtitle = 'Digital Reservation Pass';
    showBack = false;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.maroonDark} />

      {/* MSEUF Header (Includes Website-Matched Admin Navigation Bar) */}
      <Header
        title={headerTitle}
        subtitle={headerSubtitle}
        showBack={showBack}
        onBack={onBackAction}
        onSettingsPress={() => setSettingsVisible(true)}
        user={user}
        activeNav={currentScreen}
        onNavigate={handleHeaderNavigate}
        onAuthPress={
          currentScreen === 'login'
            ? () => setCurrentScreen('register')
            : () => setCurrentScreen('login')
        }
        authActionLabel={currentScreen === 'login' ? 'Sign Up' : 'Sign In'}
        onLogoutPress={handleLogout}
      />

      {/* Screen Router */}
      <View style={styles.content}>
        {currentScreen === 'login' && (
          <LoginScreen
            onAuthSuccess={handleAuthSuccess}
            onNavigateToRegister={() => setCurrentScreen('register')}
          />
        )}

        {currentScreen === 'register' && (
          <RegisterScreen
            onAuthSuccess={handleAuthSuccess}
            onNavigateToLogin={() => setCurrentScreen('login')}
          />
        )}

        {/* Student Shows Catalog */}
        {currentScreen === 'catalog' && (
          <EventsCatalogScreen onSelectEvent={handleSelectEvent} />
        )}

        {/* Admin Dashboard / Shows & Plays Publisher (Matches admin/events/index.blade.php) */}
        {currentScreen === 'admin_dashboard' && (
          <AdminDashboardScreen
            flashMessage={flashMessage}
            onClearFlash={() => setFlashMessage(null)}
            onCreateShow={() => {
              setEditingEvent(null);
              setCurrentScreen('admin_create_event');
            }}
            onOpenScanner={() => setCurrentScreen('admin_scanner')}
            onEditShow={(ev) => {
              setEditingEvent(ev);
              setCurrentScreen('admin_edit_event');
            }}
            onManageShow={(ev) => {
              setSelectedEvent(ev);
              setCurrentScreen('admin_event_show');
            }}
            onBookShow={(ev) => {
              setSelectedEvent(ev);
              setCurrentScreen('seats');
            }}
          />
        )}

        {/* Admin Post New Show / Edit Show (Matches admin/events/create & edit.blade.php) */}
        {(currentScreen === 'admin_create_event' ||
          currentScreen === 'admin_edit_event') && (
          <AdminEventFormScreen
            eventToEdit={
              currentScreen === 'admin_edit_event' ? editingEvent : null
            }
            onCancel={() => {
              if (currentScreen === 'admin_edit_event' && editingEvent) {
                setSelectedEvent(editingEvent);
                setCurrentScreen('admin_event_show');
              } else {
                setCurrentScreen('admin_dashboard');
              }
            }}
            onSaved={(savedEvent, message) => {
              setSelectedEvent(savedEvent);
              setFlashMessage(message);
              setCurrentScreen('admin_event_show');
            }}
          />
        )}

        {/* Admin Show Overview, Live 60-Seat Map & Attendees (Matches admin/events/show.blade.php) */}
        {currentScreen === 'admin_event_show' && selectedEvent && (
          <AdminEventShowScreen
            event={selectedEvent}
            flashMessage={flashMessage}
            onClearFlash={() => setFlashMessage(null)}
            onBack={() => {
              setFlashMessage(null);
              setCurrentScreen('admin_dashboard');
            }}
            onEditShow={(ev) => {
              setEditingEvent(ev);
              setCurrentScreen('admin_edit_event');
            }}
            onOpenScanner={() => setCurrentScreen('admin_scanner')}
            onDeleted={(message) => {
              setFlashMessage(message);
              setSelectedEvent(null);
              setCurrentScreen('admin_dashboard');
            }}
          />
        )}

        {/* Admin Student Reservations Master List (Matches admin/bookings/index.blade.php) */}
        {currentScreen === 'admin_bookings' && (
          <AdminBookingsScreen
            onBackToCatalog={() => setCurrentScreen('admin_dashboard')}
            onSelectEventById={(eventId) => {
              setSelectedEvent({ id: eventId, title: 'Campus Show' });
              setCurrentScreen('admin_event_show');
            }}
          />
        )}

        {/* Admin Gate Marshal Ticket & Booking Scanner (Matches tickets/scanner.blade.php) */}
        {currentScreen === 'admin_scanner' && (
          <AdminScannerScreen
            onBackToCatalog={() => setCurrentScreen('admin_dashboard')}
          />
        )}

        {/* Personal Passes (My Passes) */}
        {currentScreen === 'my_passes' && (
          <MyPassesScreen
            onBrowseShows={() => setCurrentScreen(homeScreenForUser())}
            onSelectBookingPass={(bookingPass) => {
              setConfirmedBooking(bookingPass);
              setCurrentScreen('confirmation');
            }}
          />
        )}

        {/* Interactive Seat Picker */}
        {currentScreen === 'seats' && selectedEvent && (
          <SeatPickerScreen
            event={selectedEvent}
            onProceedToCheckout={handleProceedToCheckout}
          />
        )}

        {/* Booking Confirmation Ticket Stub */}
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
        user={user}
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
            <Text style={styles.settingsTitle}>Laravel Backend Connection</Text>
            <Text style={styles.settingsSubtitle}>
              Physical phones use the Expo host automatically. Laravel must be reachable on your Wi-Fi network.
            </Text>

            <Text style={styles.settingsLabel}>API Base URL:</Text>
            <TextInput
              style={styles.settingsInput}
              value={backendUrl}
              onChangeText={setBackendUrlState}
              placeholder="http://192.168.1.100:8000/api"
              autoCapitalize="none"
            />

            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => setBackendUrlState('http://localhost:8000/api')}
              >
                <Text style={styles.presetChipText}>Web / iOS (localhost)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => setBackendUrlState('http://10.0.2.2:8000/api')}
              >
                <Text style={styles.presetChipText}>
                  Android Emulator (10.0.2.2)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsBtnRow}>
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
                <Text style={styles.settingsSaveText}>Save & Reconnect</Text>
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
    justifyContent: 'center',
    padding: 20,
  },
  settingsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 20,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.maroon,
    marginBottom: 4,
  },
  settingsSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  settingsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  settingsInput: {
    borderWidth: 1.5,
    borderColor: COLORS.borderDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    backgroundColor: COLORS.maroonPale,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.maroonBorder,
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.maroon,
  },
  settingsBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  settingsCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  settingsCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  settingsSaveBtn: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  settingsSaveText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
});
