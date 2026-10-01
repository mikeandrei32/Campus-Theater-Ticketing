import { Platform } from 'react-native';

// By default:
// - Android Emulator uses 10.0.2.2 to access host machine's localhost:8000
// - Web and iOS Simulator use localhost:8000
// - On a physical phone, replace with your PC's Wi-Fi IPv4 address (e.g. 192.168.1.XX:8000)
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2:8000' : 'localhost:8000';
let API_BASE_URL = `http://${DEFAULT_HOST}/api`;

export const getApiBaseUrl = () => API_BASE_URL;

export const setApiBaseUrl = (url) => {
  API_BASE_URL = url.trim().replace(/\/+$/, '');
  if (!API_BASE_URL.endsWith('/api')) {
    API_BASE_URL += '/api';
  }
};

/**
 * Fetch all upcoming campus theater events.
 */
export async function fetchEvents() {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, {
      headers: { Accept: 'application/json' },
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
      headers: { Accept: 'application/json' },
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
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
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
      headers: { Accept: 'application/json' },
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
      venue: 'MSEUF University Gymnasium & Cultural Center',
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
      venue: 'University Auditorium',
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
      venue: 'MSEUF Gymnasium',
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
