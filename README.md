# MSEUF Cinema-Style Theater Ticketing System

An interactive, authentic cinema-style theater booking application designed for **Manuel S. Enverga University Foundation (MSEUF)** collegiate stage events, pageants, and drama festivals (e.g., *Hiyas ng Enverga 2026: Coronation Night*, *CCMS Drama Fest*, and *Enverga University Cultural Night*).

🎨 **Theme**: Authentic **MSEUF Maroon & White** (`#800000` & `#FFFFFF`) with VIP Gold (`#D97706`).  
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
 │    ├── Auth/
 │    │    └── AuthController.php           (Web Login, Signup, Logout & Password Recovery)
 │    ├── Admin/
 │    │    ├── EventController.php          (Admin Show Publisher & Live Seat Map)
 │    │    └── BookingController.php        (Student Reservations Master List)
 │    ├── EventController.php               (Web Browse & show events)
 │    ├── SeatBookingController.php         (Web Seat map & reservation flow)
 │    ├── TicketController.php              (Ticket viewing & Digital QR Pass)
 │    ├── CheckInController.php             (Marshal scan & entry validation)
 │    └── Api/                              (RESTful JSON Controllers for Mobile)
 │         ├── AuthApiController.php        (Mobile Login, Signup & Token Auth API)
 │         ├── EventApiController.php       (Mobile event showcase API)
 │         └── SeatBookingApiController.php (Mobile seat picker & booking API)
 │
resources/views/              # [V] Web Presentation (Blade + Tailwind + Alpine)
 │    ├── layouts/admin.blade.php
 │    ├── auth/
 │    │    ├── login.blade.php
 │    │    ├── register.blade.php
 │    │    ├── forgot-password.blade.php
 │    │    └── reset-password.blade.php
 │    ├── admin/
 │    │    ├── events/ (index, create, edit, show)
 │    │    └── bookings/index.blade.php
 │    ├── events/index.blade.php
 │    ├── theater/seat-picker.blade.php
 │    ├── bookings/confirmation.blade.php
 │    └── tickets/scanner.blade.php
 │
mobile/                       # [V] Mobile Presentation (React Native / Expo)
      ├── App.js                           (Screen coordinator, auth state & navigation)
      ├── app.json                         (Expo mobile configuration)
      └── src/
           ├── constants/theme.js          (MSEUF Maroon #800000 & White theme)
           ├── services/api.js             (Laravel MVC API client with Bearer Auth)
           ├── components/Header.js        (University collegiate header, crest & user menu)
           └── screens/
                ├── AuthScreen.js          (Mobile Login & Student Signup screen)
                ├── EventsCatalogScreen.js (Campus shows catalog & status)
                ├── SeatPickerScreen.js    (Interactive 60-seat cinema grid)
                ├── CheckoutModal.js       (Reservation & attendee drawer)
                └── BookingConfirmationScreen.js (Digital pass & ticket stub)
```

---

## 📌 Project Features

| Feature Area | Description | Status |
|---|---|---|
| **Authentication (Web & Mobile)** | **Login, Signup, Show/Hide Password, Remember Me, Rate Limiting, Password Recovery & Logout** | ✅ **Active** |
| **Event Catalog & Publisher** | **Event Catalog, Search/Filter & Admin Show Publisher (Web & Mobile)** | ✅ **Active** |
| **Interactive Seat Picker** | **Interactive Cinema Seat-Picker Grid (60 Auditorium Chairs, Rows A-F)** | ✅ **Active** |
| **Tiered Pricing & Dock** | **Curved Screen Indicator, VIP/Regular Tiers, 4-Seat Limit & Dynamic Order Dock** | ✅ **Active** |
| **Checkout & GCash Reference** | **Database Transaction Checkout, Seat Collision Lock & GCash Payment Reference** | ✅ **Active** |
| **Digital QR Ticket Stub** | **Scannable QR Ticket Stub Generation & Printout** | ✅ **Active** |
| **Gate Marshal Scanner** | **Gatekeeper / Usher QR & Reference Scanner with Double-Entry Protection** | ✅ **Active** |

---

## 🔐 Demo Credentials

After running `php artisan migrate:fresh --seed` (or `php artisan db:seed`), the following accounts are available:

- **Student Account**:
  - **Email**: `student@mseuf.edu.ph`
  - **Password**: `password`
- **Admin Account**:
  - **Email**: `admin@mseuf.edu.ph`
  - **Password**: `password`

---

## 🗄️ Database Architecture

- `users`: `name`, `email` (unique), `role` (`student` / `admin`), `student_number`, `password` (bcrypt hashed), `api_token`, `remember_token`.
- `events`: `title`, `venue`, `show_date`, `pricing_type` (free/paid), `regular_price`, `vip_price`, `banner_image`.
- `seats`: 60 physical auditorium chairs (Rows A to F, seats 1 to 10), categorized into VIP (Rows A & B) and Regular (Rows C to F).
- `bookings`: `user_id`, `event_id`, `booking_reference`, `total_seats`, `total_amount`, `payment_status` ('free'/'paid'), `gcash_reference`.
- `ticket_seats`: `booking_id`, `event_id`, `seat_id`, `qr_token`, `is_checked_in`, `checked_in_at`.

---

## 🚀 Running the Project

### 1. Setup & Seed
```bash
php artisan migrate --force
php artisan db:seed
```
*(Or `php artisan migrate:fresh --seed` for a clean reset).*

### 2. Start Local Development Server
```bash
php artisan serve --host=0.0.0.0 --port=8000
```
Open **`http://localhost:8000`** on your computer (`http://localhost:8000/login` to sign in or `http://localhost:8000/register` to create an account).

### 3. Run Automated Tests
```bash
php artisan test
```
All automated unit, feature, authentication, and mobile API tests pass cleanly.

### 4. Run React Native Mobile Frontend (Expo)
```bash
cd mobile
npm start
```
- Press `w` to run directly in your web browser.
- Press `a` for Android Emulator, or scan the QR code on a physical phone with the **Expo Go** app.
