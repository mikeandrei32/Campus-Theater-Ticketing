<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Event;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    /**
     * =========================================================================
     * ALL STUDENT BOOKINGS / RESERVATIONS
     * =========================================================================
     * Displays all student ticket reservations across all theater shows.
     */
    public function index(Request $request)
    {
        $query = Booking::with(['event', 'user', 'tickets.seat'])
            ->latest();

        // Optional filter by specific event
        if ($request->filled('event_id')) {
            $query->where('event_id', $request->event_id);
        }

        // Optional filter by payment status (free vs paid)
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // Optional search by student name or booking reference
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('booking_reference', 'like', "%{$search}%")
                    ->orWhere('gcash_reference', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $bookings = $query->paginate(15)->withQueryString();
        $events = Event::orderBy('title')->get();

        // Summary figures
        $totalRevenue = Booking::where('payment_status', 'paid')->sum('total_amount');
        $totalBookingsCount = Booking::count();
        $totalSeatsReserved = Booking::sum('total_seats');

        return view('admin.bookings.index', compact(
            'bookings',
            'events',
            'totalRevenue',
            'totalBookingsCount',
            'totalSeatsReserved'
        ));
    }

    /**
     * =========================================================================
     * CANCEL / DELETE RESERVATION
     * =========================================================================
     * Allows Admin to cancel a student reservation (frees up the seats).
     */
    public function destroy(Booking $booking)
    {
        $ref = $booking->booking_reference;
        $booking->delete(); // Cascades and deletes TicketSeat entries, freeing up seats

        return back()->with('success', "Reservation #{$ref} was cancelled and the seats are now available again.");
    }
}
