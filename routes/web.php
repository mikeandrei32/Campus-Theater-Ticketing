<?php

use App\Http\Controllers\Admin\BookingController as AdminBookingController;
use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\CheckInController;
use App\Http\Controllers\SeatBookingController;
use App\Http\Controllers\TicketController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| MSEUF Cinema-Style Theater Ticketing - Web Routes (Admin Portal & Pure MVC)
|--------------------------------------------------------------------------
| Opening the project ('/') shows the Sign In page first for unauthenticated
| visitors, and opens the Shows & Plays Dashboard once authenticated.
| Login ('/login') and Register ('/register') are on separate pages.
*/

// =========================================================================
// 0. AUTHENTICATION ROUTES (Separate Login & Register Pages)
// =========================================================================
Route::middleware('guest')->group(function () {
    // Sign In Page (Dedicated Page)
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.submit');

    // Register / Create Account Page (Dedicated Separate Page + Pre-Account Email Verification)
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register'])->name('register.submit');
    Route::get('/signup', [AuthController::class, 'showRegister'])->name('signup');
    Route::post('/signup', [AuthController::class, 'register'])->name('signup.submit');
    Route::get('/register/verify', [AuthController::class, 'showVerifyRegistration'])->name('register.verify');
    Route::post('/register/verify', [AuthController::class, 'verifyRegistration'])->name('register.verify.submit');
    Route::post('/register/resend', [AuthController::class, 'resendVerificationCode'])->name('register.resend');

    // Forgot & Reset Password Pages
    Route::get('/forgot-password', [AuthController::class, 'showForgotPassword'])->name('password.request');
    Route::post('/forgot-password', [AuthController::class, 'sendResetLink'])->name('password.email');
    Route::get('/reset-password/{token}', [AuthController::class, 'showResetPassword'])->name('password.reset');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.update');
});

Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

// =========================================================================
// 1. ROOT & ADMIN PORTAL ROUTES (Sign In shown first when opening '/')
// =========================================================================
Route::middleware('auth')->group(function () {
    // Opening the project redirects unauthenticated users to /login first,
    // and displays the main Shows & Plays dashboard once signed in.
    Route::get('/', [AdminEventController::class, 'index'])->name('admin.events.index');
    Route::get('/admin', [AdminEventController::class, 'index'])->name('admin.dashboard');

    // Admin Resource Routes for Shows & Bookings
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::resource('events', AdminEventController::class);
        Route::resource('bookings', AdminBookingController::class)->only(['index', 'destroy']);
        Route::get('/scanner', [CheckInController::class, 'index'])->name('scanner');
    });

    // Student Personal Passes
    Route::get('/my-tickets', [TicketController::class, 'index'])->name('tickets.my-tickets');
    Route::get('/my-passes', [TicketController::class, 'index'])->name('bookings.my');
});

// =========================================================================
// 2. COMPATIBILITY & DIRECT SEAT RESERVATION ROUTES
// =========================================================================
Route::get('/shows', [AdminEventController::class, 'index'])->name('events.index');
Route::get('/events/{event}/seats', [SeatBookingController::class, 'create'])->name('theater.seats');
Route::get('/events/{event}/picker', [SeatBookingController::class, 'create'])->name('theater.picker');
Route::post('/events/{event}/book', [SeatBookingController::class, 'store'])->name('theater.book');
Route::get('/bookings/{booking}', [TicketController::class, 'show'])->name('bookings.confirmation');

// Gate Marshal QR Scanner Routes
Route::prefix('marshal')->group(function () {
    Route::get('/scanner', [CheckInController::class, 'index'])->name('marshal.scanner');
    Route::post('/validate-ticket', [CheckInController::class, 'validateTicket'])->name('marshal.validate');
});
Route::get('/gate-scanner', [CheckInController::class, 'index'])->name('theater.scanner');
