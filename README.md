# MSEUF Cinema-Style Theater Ticketing System

An interactive, authentic cinema-style theater booking application designed for **Manuel S. Enverga University Foundation (MSEUF)** collegiate stage events, pageants, and drama festivals (e.g., *Hiyas ng Enverga 2026: Coronation Night*, *CCMS Drama Fest*, and *Enverga University Cultural Night*).

🎨 **Theme**: Authentic **MSEUF Maroon & White** (`#800000` & `#FFFFFF`).  
🏗️ **Design Pattern**: Pure Classic Laravel **Model-View-Controller (MVC)** with React Native Mobile Client.

---

## 📌 Project Architecture (Pure MVC Backend + Web & Mobile Frontends)

```text
app/
 ├── Models/                  # [M] Eloquent entities & relationships
 │    ├── User.php
 │    ├── Event.php
 │    ├── Seat.php
 │    ├── Booking.php
 │    └── TicketSeat.php
 │
 ├── Http/Controllers/        # [C] Request handling & application flow
 │    ├── EventController.php              (Web Browse & show events)
 │    ├── SeatBookingController.php        (Web Seat map & reservation flow)
 │    ├── TicketController.php             (Ticket viewing & PDF download)
 │    ├── CheckInController.php            (Marshal scan & entry validation)
 │    └── Api/                             (RESTful JSON Controllers for Mobile)
 │         ├── EventApiController.php      (Mobile event showcase API)
 │         └── SeatBookingApiController.php(Mobile seat picker & booking API)
 │
resources/views/              # [V] Web Presentation (Blade + Tailwind + Alpine)
 │    ├── layouts/app.blade.php
 │    ├── events/index.blade.php
 │    ├── theater/seat-picker.blade.php
 │    ├── bookings/confirmation.blade.php
 │    └── tickets/scanner.blade.php
 │
mobile/                       # [V] Mobile Presentation (React Native / Expo)
      ├── App.js                           (Screen coordinator & navigation)
      ├── app.json                         (Expo mobile configuration)
      └── src/
           ├── constants/theme.js          (MSEUF Maroon #800000 & White theme)
           ├── services/api.js             (Laravel MVC API client)
           ├── components/Header.js        (University collegiate header & crest)
           └── screens/
                ├── EventsCatalogScreen.js (Campus shows catalog & status)
                ├── SeatPickerScreen.js    (Interactive 60-seat cinema grid)
                ├── CheckoutModal.js       (Reservation & attendee drawer)
                └── BookingConfirmationScreen.js (Digital pass & ticket stub)
```

---

## 📌 Project Features & Roadmap

| Milestone | Scope % | Feature Description | Status |
|---|---|---|---|
| **Phase 1 (Midterm)** | **40%** | **Event Catalog & Schedule Showcase (Web & Mobile)** | ✅ **Active** |
| **Phase 1 (Midterm)** | **40%** | **Interactive Cinema Seat-Picker Grid (60 Auditorium Chairs)** | ✅ **Active** |
| **Phase 1 (Midterm)** | **40%** | **Curved Screen Indicator, VIP/Regular Tiers & Legends** | ✅ **Active** |
| **Phase 1 (Midterm)** | **40%** | **Dynamic Real-Time Selection, 4-Seat Limit & Order Dock** | ✅ **Active** |
| **Phase 1 (Midterm)** | **40%** | **React Native Mobile Frontend (Expo) connecting to Laravel MVC** | ✅ **Active** |
| **Phase 2 (Finals)** | *60%* | *Database Checkout & GCash Payment Processing* | ⏳ *Scheduled for Finals* |
| **Phase 2 (Finals)** | *60%* | *Digital QR Ticket Stub Generation & Printout* | ⏳ *Scheduled for Finals* |
| **Phase 2 (Finals)** | *60%* | *Gatekeeper / Usher Scanner & Check-in Verification* | ⏳ *Scheduled for Finals* |

---

## 🎨 Design & UI Architecture (Maroon & White)

- **University Header**: Deep Enverga Maroon (`#800000`) with crisp white typography and collegiate badge.
- **Stage / Screen Indicator**: Curved neon maroon bar with realistic cinema glow.
- **Interactive Grid**:
  - **Available Seats**: Clean white cards with gray/maroon borders.
  - **VIP Front Rows (A & B)**: Gold / Amber badges with maroon accents.
  - **Selected Seats**: Rich Enverga Maroon (`#800000`) with glow and scale animation.
  - **Sold / Occupied Seats**: Disabled light gray with strike-through.
- **Selection Drawer**: Real-time counter, seat badge chips, dynamic cost summing, and 4-seat limit per student.

---

## 🗄️ Database Architecture

- `events`: `title`, `venue`, `show_date`, `pricing_type` (free/paid), `regular_price`, `vip_price`, `banner_image`.
- `seats`: 60 physical auditorium chairs (Rows A to F, seats 1 to 10), categorized into VIP (Rows A & B) and Regular (Rows C to F).
- `bookings`: `user_id`, `event_id`, `booking_reference`, `total_seats`, `total_amount`, `payment_status` ('free'/'paid'), `gcash_reference`.
- `ticket_seats`: `booking_id`, `event_id`, `seat_id`, `qr_token`, `is_checked_in`, `checked_in_at`.

---

## 🚀 Running the Project

### 1. Setup & Seed
```bash
php artisan migrate:fresh --seed
```

### 2. Start Local Development Server
```bash
php artisan serve
```
Open **`http://localhost:8000`** in your browser.

### 3. Run Automated Tests
```bash
php artisan test
```
All automated feature and API tests pass cleanly.

### 4. Run React Native Mobile Frontend (Expo)
```bash
cd mobile
npm start
```
- Press `w` to run directly in your web browser.
- Press `a` for Android Emulator (points automatically to `10.0.2.2:8000/api`).
- Or scan the QR code on a physical phone with the **Expo Go** app!
