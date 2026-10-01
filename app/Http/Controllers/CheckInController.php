<?php

namespace App\Http\Controllers;

use App\Models\TicketSeat;
use Illuminate\Http\Request;

class CheckInController extends Controller
{
    public function index()
    {
        return view('tickets.scanner');
    }

    public function validateTicket(Request $request)
    {
        $request->validate(['token' => 'required|string']);

        $ticket = TicketSeat::with(['seat', 'booking.user', 'event'])
            ->where('qr_token', $request->token)
            ->first();

        if (!$ticket) {
            return response()->json(['status' => 'error', 'message' => 'Invalid ticket code.'], 404);
        }

        if ($ticket->is_checked_in) {
            return response()->json([
                'status' => 'warning',
                'message' => 'Already checked in at ' . ($ticket->checked_in_at ? $ticket->checked_in_at->format('h:i A') : 'earlier'),
            ], 409);
        }

        $ticket->update([
            'is_checked_in' => true,
            'checked_in_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'attendee' => $ticket->booking?->user?->name ?? 'Attendee',
            'seat' => "Row {$ticket->seat->row_label} - Seat {$ticket->seat->seat_number}",
        ]);
    }
}
