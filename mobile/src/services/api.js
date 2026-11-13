import { Platform } from 'react-native';
import Constants from 'expo-constants';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const DEFAULT_HOST =
  Platform.OS === 'web'
    ? 'localhost:8000'
    : expoHost
      ? `${expoHost}:8000`
      : Platform.OS === 'android'
        ? '10.0.2.2:8000'
        : 'localhost:8000';
let API_BASE_URL = `http://${DEFAULT_HOST}/api`;
let AUTH_TOKEN = null;

// Persist token on web if localStorage is available
try {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    AUTH_TOKEN = window.localStorage.getItem('mseuf_auth_token') || null;
  }
} catch (e) {
  // ignore storage errors
}

export const getApiBaseUrl = () => API_BASE_URL;

export const setApiBaseUrl = (url) => {
  API_BASE_URL = url.trim().replace(/\/+$/, '');
  if (!API_BASE_URL.endsWith('/api')) {
    API_BASE_URL += '/api';
  }
};

export const getAuthToken = () => AUTH_TOKEN;

export const setAuthToken = (token) => {
  AUTH_TOKEN = token || null;
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      if (AUTH_TOKEN) {
        window.localStorage.setItem('mseuf_auth_token', AUTH_TOKEN);
      } else {
        window.localStorage.removeItem('mseuf_auth_token');
      }
    }
  } catch (e) {
    // ignore storage errors
  }
};

function getAuthHeaders(extra = {}) {
  const headers = {
    Accept: 'application/json',
    ...extra,
  };
  if (AUTH_TOKEN) {
    headers.Authorization = `Bearer ${AUTH_TOKEN}`;
  }
  return headers;
}

/**
 * Authenticate user with email & password.
 */
export async function loginUser({ email, password }) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      const errMsg =
        json.message ||
        (json.errors ? Object.values(json.errors).flat().join(', ') : 'Invalid credentials.');
      return { success: false, message: errMsg };
    }
    if (json.token) {
      setAuthToken(json.token);
    }
    return json;
  } catch (err) {
    return {
      success: false,
      message: `Could not connect to Laravel backend (${API_BASE_URL}).`,
    };
  }
}

/**
 * Step 1 of Registration: Validate details & send 6-digit verification code to email.
 */
export async function registerUser({
  name,
  email,
  studentNumber,
  password,
  passwordConfirmation,
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name,
        email,
        student_number: studentNumber || null,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      const errMsg =
        json.message ||
        (json.errors ? Object.values(json.errors).flat().join(', ') : 'Registration failed.');
      return { success: false, message: errMsg };
    }
    if (json.token) {
      setAuthToken(json.token);
    }
    return json;
  } catch (err) {
    return {
      success: false,
      message: `Could not connect to Laravel backend (${API_BASE_URL}).`,
    };
  }
}

/**
 * Step 2 of Registration: Verify 6-digit email OTP code and create the student account.
 */
export async function verifyRegistrationCode({ email, code }) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-registration`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email, code }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      const errMsg =
        json.message ||
        (json.errors ? Object.values(json.errors).flat().join(', ') : 'Verification failed.');
      return { success: false, message: errMsg };
    }
    if (json.token) {
      setAuthToken(json.token);
    }
    return json;
  } catch (err) {
    return {
      success: false,
      message: `Could not connect to Laravel backend (${API_BASE_URL}).`,
    };
  }
}

/**
 * Resend 6-digit verification code to pending registration email.
 */
export async function resendRegistrationCode({ email }) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      const errMsg =
        json.message ||
        (json.errors ? Object.values(json.errors).flat().join(', ') : 'Could not resend code.');
      return { success: false, message: errMsg };
    }
    return json;
  } catch (err) {
    return {
      success: false,
      message: `Could not connect to Laravel backend (${API_BASE_URL}).`,
    };
  }
}

/**
 * Fetch current authenticated user profile & bookings.
 */
export async function fetchCurrentUser() {
  if (!AUTH_TOKEN) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401) setAuthToken(null);
      return null;
    }
    const json = await res.json();
    return json.user ? json : null;
  } catch (err) {
    return null;
  }
}

/**
 * Sign out current user.
 */
export async function logoutUser() {
  try {
    if (AUTH_TOKEN) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      });
    }
  } catch (err) {
    // ignore network errors on logout
  } finally {
    setAuthToken(null);
  }
}

/**
 * Fetch all upcoming campus theater events.
 */
export async function fetchEvents() {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const json = await res.json();
    return json.data || json;
  } catch (err) {
    console.warn('API Error fetchEvents, using fallback data:', err.message);
    return getFallbackEvents();
  }
}

/**
 * Fetch seat layout & occupancy for an event.
 */
export async function fetchEventSeats(eventId) {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}/seats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API Error fetchEventSeats, using fallback grid:', err.message);
    return getFallbackSeats(eventId);
  }
}

/**
 * Submit seat reservation to Laravel MVC backend.
 */
export async function bookSeats(eventId, { seatIds, studentName, gcashReference }) {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}/book`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        seat_ids: seatIds,
        student_name: studentName,
        gcash_reference: gcashReference,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      const errMsg = json.message || (json.errors ? Object.values(json.errors).flat().join(', ') : 'Booking failed');
      return { success: false, message: errMsg };
    }

    return json;
  } catch (err) {
    console.warn('API Error bookSeats:', err.message);
    return {
      success: false,
      message: `Could not connect to Laravel backend (${API_BASE_URL}). Make sure 'php artisan serve' is running.`,
    };
  }
}

/**
 * Fetch single booking confirmation pass.
 */
export async function fetchBooking(bookingId) {
  try {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const json = await res.json();
    return json.booking || json;
  } catch (err) {
    console.warn('API Error fetchBooking:', err.message);
    return null;
  }
}

// ----------------------------------------------------
// Fallback Mock Data (Ensures UI never breaks offline)
// ----------------------------------------------------
function getFallbackEvents() {
  return [
    {
      id: 1,
      title: 'Hiyas ng Enverga 2026: Coronation Night',
      venue: 'Little Theater, AEC Building',
      formatted_date: 'Saturday, October 24, 2026',
      formatted_time: '06:00 PM',
      pricing_type: 'paid',
      regular_price: 150.0,
      vip_price: 300.0,
      banner_image: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80',
      booked_seats_count: 12,
      total_seats: 60,
      available_seats_count: 48,
    },
    {
      id: 2,
      title: 'CCMS Drama Fest: Silicon Dreams',
      venue: 'Little Theater, AEC Building',
      formatted_date: 'Friday, November 13, 2026',
      formatted_time: '03:30 PM',
      pricing_type: 'free',
      regular_price: 0.0,
      vip_price: 0.0,
      banner_image: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=1200&q=80',
      booked_seats_count: 18,
      total_seats: 60,
      available_seats_count: 42,
    },
    {
      id: 3,
      title: 'Enverga Cultural Guild: Kundiman sa Takipsilim',
      venue: 'Little Theater, AEC Building',
      formatted_date: 'Wednesday, December 02, 2026',
      formatted_time: '05:00 PM',
      pricing_type: 'paid',
      regular_price: 120.0,
      vip_price: 250.0,
      banner_image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
      booked_seats_count: 8,
      total_seats: 60,
      available_seats_count: 52,
    },
  ];
}

function getFallbackSeats(eventId) {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seatsByRow = {};
  const occupiedIds = [3, 4, 15, 16, 27, 28, 41, 42];
  let idCounter = 1;

  rows.forEach((row) => {
    seatsByRow[row] = [];
    const isVip = row === 'A' || row === 'B';
    for (let num = 1; num <= 10; num++) {
      const seatId = idCounter++;
      seatsByRow[row].push({
        id: seatId,
        row_label: row,
        seat_number: num,
        seat_code: `${row}${num}`,
        tier: isVip ? 'vip' : 'regular',
        is_vip: isVip,
        is_occupied: occupiedIds.includes(seatId),
      });
    }
  });

  return {
    success: true,
    event: {
      id: eventId,
      title: 'Hiyas ng Enverga 2026',
      venue: 'Little Theater, AEC Building',
      pricing_type: 'paid',
      regular_price: 150.0,
      vip_price: 300.0,
    },
    seats_by_row: seatsByRow,
    occupied_seat_ids: occupiedIds,
    total_seats: 60,
    occupied_seats_count: occupiedIds.length,
    max_selection_limit: 4,
  };
}
