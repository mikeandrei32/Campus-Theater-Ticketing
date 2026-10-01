<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    /**
     * Display the booking confirmation & e-tickets receipt.
     */
    public function show(Booking $booking)
    {
        $booking->load(['event', 'user', 'tickets.seat']);

        return view('bookings.confirmation', compact('booking'));
    }

    /**
     * Display all tickets and reservations for the current attendee.
     */
    public function index()
    {
        $user = auth()->user() ?? User::first();
        $bookings = Booking::with(['event', 'tickets.seat'])
            ->where('user_id', $user?->id)
            ->latest()
            ->get();

        return view('bookings.confirmation', [
            'booking' => $bookings->first(),
            'bookings' => $bookings,
            'user' => $user,
        ]);
    }
}
