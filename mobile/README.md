# MSEUF Cinema Theater Pass - React Native Mobile Frontend

Authentic mobile client for the **MSEUF Cinema-Style Theater Ticketing System**, scoped strictly to the **40% Midterm Checkpoint**.

## 🎨 Theme & University Branding
- **Primary Color**: MSEUF Enverga Maroon (`#800000`) & White (`#FFFFFF`)
- **VIP Tier Accent**: Gold / Amber (`#D97706` / `#F59E0B`)
- **Framework**: React Native with Expo SDK 57.0.0 (runs on Android, iOS, and Web)

---

## 🏗️ Architecture: Classic MVC (Separation of Concerns)
- **Model**: Eloquent Models (`Event`, `Seat`, `Booking`, `TicketSeat`) in Laravel backend
- **View**: React Native Mobile Screens & Components (Cross-Platform UI)
- **Controller**: Laravel MVC Controllers (`EventApiController`, `SeatBookingApiController`)

---

## 📌 Midterm (40% Scope) Features Included
1. **Campus Shows Showcase (`EventsCatalogScreen.js`)**:
   - Live listing of collegiate events (Hiyas ng Enverga, CCMS Drama Fest, Cultural Night).
   - Real-time seat availability indicator.
   - Filtering by Free Admission vs Paid VIP Galas.
2. **Interactive Cinema Seat-Picker (`SeatPickerScreen.js`)**:
   - Curved Cinema Screen / Stage indicator with neon glow.
   - 60 Auditorium Chairs (Rows A to F, Seats 1 to 10 with center aisle).
   - Color-coded VIP (Rows A & B) vs Regular (Rows C to F).
   - Dynamic real-time selection with 4-seat maximum reservation limit per student.
3. **Floating Bottom Dock & Reservation Drawer (`CheckoutModal.js`)**:
   - Instant calculation of total fees.
   - Student Attendee validation and GCash reference input.
   - Database collision prevention (prevents two students from claiming the same chair).
4. **Digital Pass Confirmation (`BookingConfirmationScreen.js`)**:
   - Authentic perforated ticket stub design with cinema notches.
   - Booking reference code (e.g., `MSEUF-8X29Q`).
   - Assigned seat chips with VIP indicators and simulated QR token.

---

## 🚀 How to Run Mobile Frontend

### 1. Make Sure Laravel MVC Server is Running
In the root directory (`Midterm-Project`):
```bash
php artisan serve
```
*(Server will listen at `http://127.0.0.1:8000`)*

### 2. Start the React Native Mobile App
In this `mobile` directory:
```bash
npm start
```

### 3. Open on Your Device
- **Physical Phone (Android/iPhone)**: Scan the QR code using the **Expo Go** app from the Google Play Store or Apple App Store. Ensure your phone is connected to the same Wi-Fi network as your computer, and tap the ⚙ icon in the app header to point to your computer's local IP (e.g. `http://192.168.1.XX:8000/api`).
- **Android Emulator**: Press `a` in the terminal (automatically routes to `http://10.0.2.2:8000/api`).
- **iOS Simulator**: Press `i` in the terminal.
- **Web Browser**: Press `w` in the terminal to preview in Chrome/Edge.
