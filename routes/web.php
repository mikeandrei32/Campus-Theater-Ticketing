<?php

use App\Http\Controllers\CheckInController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\SeatBookingController;
use App\Http\Controllers\TicketController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| MSEUF Cinema-Style Theater Ticketing - Web Routes (Classic Pure MVC)
|--------------------------------------------------------------------------
| Milestone: Midterm Checkpoint (40% Active Scope)
| - Phase 1 (Midterm 40%): Event Showcase & Interactive Cinema Seat-Picker
| - Phase 2 (Finals 60%): Database Checkout, GCash, E-Tickets & QR Scanner
*/

// ==========================================
// 1. PUBLIC BROWSING & SHOWCASE (40% Scope)
// ==========================================
Route::get('/', [EventController::class, 'index'])->name('events.index');
Route::get('/events/{event}', [EventController::class, 'show'])->name('events.show');

// ==========================================
// 2. INTERACTIVE CINEMA SEAT PICKER (40% Scope)
// ==========================================
Route::get('/events/{event}/seats', [SeatBookingController::class, 'create'])->name('theater.seats');
Route::get('/events/{event}/picker', [SeatBookingController::class, 'create'])->name('theater.picker'); // Compatibility alias

// ==========================================
// 3. BOOKING RESERVATION & STUB CONFIRMATION
// ==========================================
Route::post('/events/{event}/book', [SeatBookingController::class, 'store'])->name('theater.book');
Route::get('/bookings/{booking}', [TicketController::class, 'show'])->name('bookings.confirmation');
Route::get('/my-tickets', [TicketController::class, 'index'])->name('tickets.my-tickets');
Route::get('/my-passes', [TicketController::class, 'index'])->name('bookings.my'); // Compatibility alias

// ==========================================
// 4. GATE MARSHAL SCANNER & VALIDATION
// ==========================================
Route::prefix('marshal')->group(function () {
    Route::get('/scanner', [CheckInController::class, 'index'])->name('marshal.scanner');
    Route::post('/validate-ticket', [CheckInController::class, 'validateTicket'])->name('marshal.validate');
});
Route::get('/gate-scanner', [CheckInController::class, 'index'])->name('theater.scanner'); // Compatibility alias
