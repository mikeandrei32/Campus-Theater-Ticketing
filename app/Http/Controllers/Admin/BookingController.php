<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{
    protected function rejectMobileOrStudentDomainUser(Request $request)
    {
        $user = Auth::user();
        if ($user && ! $user->canManageTheater()) {
            Auth::guard('web')->logout();
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return redirect()
                ->route('login')
                ->with('error', 'Accounts using @student.mseuf.edu.ph can only log in through the mobile app and cannot manage reservations on the website.');
        }

        return null;
    }

    /**
     * =========================================================================
     * ALL STUDENT BOOKINGS / RESERVATIONS
     * =========================================================================
     * Displays all student ticket reservations across all theater shows.
     */
    public function index(Request $request)
    {
        if ($redirect = $this->rejectMobileOrStudentDomainUser($request)) {
            return $redirect;
        }

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
    public function destroy(Request $request, Booking $booking)
    {
        if ($redirect = $this->rejectMobileOrStudentDomainUser($request)) {
            return $redirect;
        }

        $ref = $booking->booking_reference;
        $booking->delete(); // Cascades and deletes TicketSeat entries, freeing up seats

        return back()->with('success', "Reservation #{$ref} was cancelled and the seats are now available again.");
    }
}
