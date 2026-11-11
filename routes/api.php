<?php

use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\EventApiController;
use App\Http\Controllers\Api\SeatBookingApiController;
use App\Http\Controllers\CheckInController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Mobile RESTful API Routes (MSEUF Cinema Theater)
|--------------------------------------------------------------------------
| Architecture: Classic MVC
| Model: App\Models\User, App\Models\Event, App\Models\Seat, App\Models\Booking, App\Models\TicketSeat
| View: Mobile JSON API Representation
| Controller: AuthApiController, EventApiController, SeatBookingApiController
*/

Route::prefix('v1')->group(function () {
    // 0. Authentication & Account Endpoints
    Route::post('/auth/register', [AuthApiController::class, 'register'])->name('api.v1.auth.register');
    Route::post('/auth/login', [AuthApiController::class, 'login'])->name('api.v1.auth.login');
    Route::get('/auth/me', [AuthApiController::class, 'me'])->name('api.v1.auth.me');
    Route::post('/auth/logout', [AuthApiController::class, 'logout'])->name('api.v1.auth.logout');
    Route::get('/my-bookings', [AuthApiController::class, 'me'])->name('api.v1.bookings.mine');

    // 1. Event Showcase & Schedules
    Route::get('/events', [EventApiController::class, 'index'])->name('api.v1.events.index');
    Route::get('/events/{event}', [EventApiController::class, 'show'])->name('api.v1.events.show');

    // 2. Interactive Cinema Seat Picker & Layout
    Route::get('/events/{event}/seats', [SeatBookingApiController::class, 'seats'])->name('api.v1.events.seats');

    // 3. Seat Reservation Submission & Confirmation Pass
    Route::post('/events/{event}/book', [SeatBookingApiController::class, 'book'])->name('api.v1.events.book');
    Route::get('/bookings/{booking}', [SeatBookingApiController::class, 'show'])->name('api.v1.bookings.show');

    // 4. Ticket & Booking Reference Gate Scanner Validation
    Route::post('/validate-ticket', [CheckInController::class, 'validateTicket'])->name('api.v1.validate');
});

// Top-level /api/ alias routes for convenience
Route::post('/auth/register', [AuthApiController::class, 'register'])->name('api.auth.register');
Route::post('/auth/login', [AuthApiController::class, 'login'])->name('api.auth.login');
Route::get('/auth/me', [AuthApiController::class, 'me'])->name('api.auth.me');
Route::post('/auth/logout', [AuthApiController::class, 'logout'])->name('api.auth.logout');
Route::get('/my-bookings', [AuthApiController::class, 'me'])->name('api.bookings.mine');

Route::get('/events', [EventApiController::class, 'index'])->name('api.events.index');
Route::get('/events/{event}', [EventApiController::class, 'show'])->name('api.events.show');
Route::get('/events/{event}/seats', [SeatBookingApiController::class, 'seats'])->name('api.events.seats');
Route::post('/events/{event}/book', [SeatBookingApiController::class, 'book'])->name('api.events.book');
Route::get('/bookings/{booking}', [SeatBookingApiController::class, 'show'])->name('api.bookings.show');
Route::post('/validate-ticket', [CheckInController::class, 'validateTicket'])->name('api.validate');
