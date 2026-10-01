<?php

use App\Http\Controllers\Api\EventApiController;
use App\Http\Controllers\Api\SeatBookingApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Mobile RESTful API Routes (MSEUF Cinema Theater - Midterm 40% Scope)
|--------------------------------------------------------------------------
| Architecture: Classic MVC
| Model: App\Models\Event, App\Models\Seat, App\Models\Booking, App\Models\TicketSeat
| View: Mobile JSON API Representation
| Controller: App\Http\Controllers\Api\EventApiController, App\Http\Controllers\Api\SeatBookingApiController
*/

Route::prefix('v1')->group(function () {
    // 1. Event Showcase & Schedules
    Route::get('/events', [EventApiController::class, 'index'])->name('api.v1.events.index');
    Route::get('/events/{event}', [EventApiController::class, 'show'])->name('api.v1.events.show');

    // 2. Interactive Cinema Seat Picker & Layout
    Route::get('/events/{event}/seats', [SeatBookingApiController::class, 'seats'])->name('api.v1.events.seats');

    // 3. Seat Reservation Submission & Confirmation Pass
    Route::post('/events/{event}/book', [SeatBookingApiController::class, 'book'])->name('api.v1.events.book');
    Route::get('/bookings/{booking}', [SeatBookingApiController::class, 'show'])->name('api.v1.bookings.show');
});

// Top-level /api/ alias routes for convenience
Route::get('/events', [EventApiController::class, 'index'])->name('api.events.index');
Route::get('/events/{event}', [EventApiController::class, 'show'])->name('api.events.show');
Route::get('/events/{event}/seats', [SeatBookingApiController::class, 'seats'])->name('api.events.seats');
Route::post('/events/{event}/book', [SeatBookingApiController::class, 'book'])->name('api.events.book');
Route::get('/bookings/{booking}', [SeatBookingApiController::class, 'show'])->name('api.bookings.show');
