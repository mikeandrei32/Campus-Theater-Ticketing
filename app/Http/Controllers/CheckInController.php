<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\TicketSeat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckInController extends Controller
{
    /**
     * Display the Digital Ticket Scanner & Gate Verification Portal.
     */
    public function index()
    {
        $recentBookings = Booking::with(['event', 'user', 'tickets.seat'])
            ->latest()
            ->take(8)
            ->get();

        $stats = [
            'total_admitted' => TicketSeat::where('is_checked_in', true)->count(),
            'pending_admission' => TicketSeat::where('is_checked_in', false)->count(),
            'total_tickets' => TicketSeat::count(),
        ];

        return view('tickets.scanner', compact('recentBookings', 'stats'));
    }

    /**
     * Validate an admission pass using either Booking Reference (e.g. MSEUF-XXXXXX)
     * or an individual seat QR Token UUID.
     */
    public function validateTicket(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'nullable|string',
            'reference' => 'nullable|string',
        ]);

        $input = trim((string) ($request->input('token') ?? $request->input('reference') ?? ''));

        if (empty($input)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Please enter a Booking Reference or scan a QR Token.',
            ], 422);
        }

        // 1. Check if input matches a Booking Reference (case-insensitive)
        $booking = Booking::with(['user', 'event', 'tickets.seat'])
            ->whereRaw('UPPER(booking_reference) = ?', [strtoupper($input)])
            ->first();

        if ($booking) {
            return $this->processBookingCheckIn($booking);
        }

        // 2. Check if input matches an individual ticket QR Token UUID
        $ticket = TicketSeat::with(['seat', 'booking.user', 'event'])
            ->where('qr_token', $input)
            ->first();

        if ($ticket) {
            return $this->processTicketCheckIn($ticket);
        }

        // 3. Not found in either bookings or individual ticket tokens
        return response()->json([
            'status' => 'error',
            'message' => 'Invalid booking reference or ticket QR code "'.$input.'". No matching reservation was found.',
        ], 404);
    }

    /**
     * Process gate admission for an entire Booking Reference.
     */
    protected function processBookingCheckIn(Booking $booking): JsonResponse
    {
        $tickets = $booking->tickets;
        $totalSeats = $tickets->count();
        $pendingTickets = $tickets->where('is_checked_in', false);
        $alreadyCheckedIn = $tickets->where('is_checked_in', true);

        $seatLabels = $tickets->map(function ($t) {
            return "Row {$t->seat->row_label} - Seat {$t->seat->seat_number}";
        })->values()->all();

        $seatDetails = $tickets->map(function ($t) {
            return [
                'seat_code' => "Row {$t->seat->row_label} - Seat {$t->seat->seat_number}",
                'row' => $t->seat->row_label,
                'seat_number' => $t->seat->seat_number,
                'tier' => $t->seat->tier,
                'is_vip' => $t->seat->tier === 'vip',
                'is_checked_in' => (bool) $t->is_checked_in,
                'checked_in_at' => $t->checked_in_at ? $t->checked_in_at->format('h:i A') : null,
            ];
        })->values()->all();

        // If all tickets under this booking reference were already checked in
        if ($pendingTickets->isEmpty()) {
            $earliestChecked = $alreadyCheckedIn->sortBy('checked_in_at')->first();
            $timeStr = $earliestChecked?->checked_in_at ? $earliestChecked->checked_in_at->format('h:i A') : 'earlier';

            return response()->json([
                'status' => 'warning',
                'verification_type' => 'booking_reference',
                'message' => "All {$totalSeats} seat(s) for Booking Reference #{$booking->booking_reference} have already been checked in at {$timeStr}.",
                'booking_reference' => $booking->booking_reference,
                'attendee' => $booking->user?->name ?? 'Attendee',
                'attendee_email' => $booking->user?->email,
                'event_title' => $booking->event?->title ?? 'Campus Theater Show',
                'event_venue' => $booking->event?->venue ?? 'MSEUF Auditorium',
                'event_date' => $booking->event?->show_date ? $booking->event->show_date->format('M d, Y • h:i A') : null,
                'seat' => implode(', ', $seatLabels),
                'seats_list' => $seatDetails,
                'total_seats' => $totalSeats,
                'already_admitted' => true,
                'payment_status' => $booking->payment_status,
                'gcash_reference' => $booking->gcash_reference,
                'checked_in_at' => $timeStr,
            ], 409);
        }

        // Admit all pending tickets in this booking
        $now = now();
        TicketSeat::whereIn('id', $pendingTickets->pluck('id'))->update([
            'is_checked_in' => true,
            'checked_in_at' => $now,
        ]);

        $admittedCount = $pendingTickets->count();

        return response()->json([
            'status' => 'success',
            'verification_type' => 'booking_reference',
            'message' => "Admission Granted! {$admittedCount} of {$totalSeats} seat(s) verified for Booking Reference #{$booking->booking_reference}.",
            'booking_reference' => $booking->booking_reference,
            'attendee' => $booking->user?->name ?? 'Attendee',
            'attendee_email' => $booking->user?->email,
            'event_title' => $booking->event?->title ?? 'Campus Theater Show',
            'event_venue' => $booking->event?->venue ?? 'MSEUF Auditorium',
            'event_date' => $booking->event?->show_date ? $booking->event->show_date->format('M d, Y • h:i A') : null,
            'seat' => implode(', ', $seatLabels),
            'seats_list' => $seatDetails,
            'total_seats' => $totalSeats,
            'admitted_count' => $admittedCount,
            'payment_status' => $booking->payment_status,
            'gcash_reference' => $booking->gcash_reference,
            'checked_in_at' => $now->format('h:i A'),
        ], 200);
    }

    /**
     * Process check-in for an individual Ticket QR Token UUID.
     */
    protected function processTicketCheckIn(TicketSeat $ticket): JsonResponse
    {
        $seatLabel = "Row {$ticket->seat->row_label} - Seat {$ticket->seat->seat_number}";

        $seatDetail = [
            'seat_code' => $seatLabel,
            'row' => $ticket->seat->row_label,
            'seat_number' => $ticket->seat->seat_number,
            'tier' => $ticket->seat->tier,
            'is_vip' => $ticket->seat->tier === 'vip',
            'is_checked_in' => true,
        ];

        if ($ticket->is_checked_in) {
            $timeStr = $ticket->checked_in_at ? $ticket->checked_in_at->format('h:i A') : 'earlier';

            return response()->json([
                'status' => 'warning',
                'verification_type' => 'qr_token',
                'message' => "Already checked in at {$timeStr} ({$seatLabel}).",
                'booking_reference' => $ticket->booking?->booking_reference,
                'attendee' => $ticket->booking?->user?->name ?? 'Attendee',
                'attendee_email' => $ticket->booking?->user?->email,
                'event_title' => $ticket->event?->title ?? 'Campus Theater Show',
                'event_venue' => $ticket->event?->venue ?? 'MSEUF Auditorium',
                'event_date' => $ticket->event?->show_date ? $ticket->event->show_date->format('M d, Y • h:i A') : null,
                'seat' => $seatLabel,
                'seats_list' => [$seatDetail],
                'total_seats' => 1,
                'already_admitted' => true,
                'payment_status' => $ticket->booking?->payment_status,
                'checked_in_at' => $timeStr,
            ], 409);
        }

        $now = now();
        $ticket->update([
            'is_checked_in' => true,
            'checked_in_at' => $now,
        ]);

        return response()->json([
            'status' => 'success',
            'verification_type' => 'qr_token',
            'message' => "Admission Granted! {$seatLabel} verified successfully.",
            'booking_reference' => $ticket->booking?->booking_reference,
            'attendee' => $ticket->booking?->user?->name ?? 'Attendee',
            'attendee_email' => $ticket->booking?->user?->email,
            'event_title' => $ticket->event?->title ?? 'Campus Theater Show',
            'event_venue' => $ticket->event?->venue ?? 'MSEUF Auditorium',
            'event_date' => $ticket->event?->show_date ? $ticket->event->show_date->format('M d, Y • h:i A') : null,
            'seat' => $seatLabel,
            'seats_list' => [$seatDetail],
            'total_seats' => 1,
            'admitted_count' => 1,
            'payment_status' => $ticket->booking?->payment_status,
            'gcash_reference' => $ticket->booking?->gcash_reference,
            'checked_in_at' => $now->format('h:i A'),
        ], 200);
    }
}
