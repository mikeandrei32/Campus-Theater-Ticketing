<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Event;
use App\Models\Seat;
use App\Models\TicketSeat;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SeatBookingApiController extends Controller
{
    /**
     * Get cinema layout, seat grid, and occupancy state for mobile seat picker.
     */
    public function seats(Event $event): JsonResponse
    {
        $allSeats = Seat::orderBy('row_label')->orderBy('seat_number')->get();

        $occupiedSeatIds = TicketSeat::where('event_id', $event->id)
            ->pluck('seat_id')
            ->toArray();

        $rows = ['A', 'B', 'C', 'D', 'E', 'F'];
        $groupedSeats = [];

        foreach ($rows as $row) {
            $groupedSeats[$row] = $allSeats->where('row_label', $row)->values()->map(function ($seat) use ($occupiedSeatIds) {
                return [
                    'id' => $seat->id,
                    'row_label' => $seat->row_label,
                    'seat_number' => $seat->seat_number,
                    'seat_code' => $seat->row_label . $seat->seat_number,
                    'tier' => $seat->tier,
                    'is_vip' => $seat->tier === 'vip',
                    'is_occupied' => in_array($seat->id, $occupiedSeatIds),
                ];
            });
        }

        return response()->json([
            'success' => true,
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'venue' => $event->venue,
                'show_date' => $event->show_date?->toIso8601String(),
                'formatted_date' => $event->show_date?->format('l, F d, Y'),
                'formatted_time' => $event->show_date?->format('h:i A'),
                'pricing_type' => $event->pricing_type,
                'regular_price' => (float) $event->regular_price,
                'vip_price' => (float) $event->vip_price,
            ],
            'seats_by_row' => $groupedSeats,
            'occupied_seat_ids' => $occupiedSeatIds,
            'total_seats' => $allSeats->count(),
            'occupied_seats_count' => count($occupiedSeatIds),
            'max_selection_limit' => 4,
        ]);
    }

    /**
     * Reserve seats via mobile app (Midterm 40% Scope).
     */
    public function book(Request $request, Event $event): JsonResponse
    {
        $rules = [
            'seat_ids' => 'required|array|min:1|max:4',
            'seat_ids.*' => 'exists:seats,id',
            'student_name' => 'nullable|string|max:100',
        ];

        if ($event->pricing_type === 'paid') {
            $rules['gcash_reference'] = 'required|string|min:6|max:30';
        }

        $validated = $request->validate($rules);

        return DB::transaction(function () use ($request, $event, $validated) {
            $selectedSeats = Seat::whereIn('id', $validated['seat_ids'])->lockForUpdate()->get();

            // Collision Check
            $alreadyBooked = TicketSeat::where('event_id', $event->id)
                ->whereIn('seat_id', $selectedSeats->pluck('id'))
                ->exists();

            if ($alreadyBooked) {
                return response()->json([
                    'success' => false,
                    'message' => 'One or more of your selected seats was just taken. Please pick another seat.',
                ], 409);
            }

            // Price Calculation
            $totalAmount = 0.00;
            if ($event->pricing_type === 'paid') {
                foreach ($selectedSeats as $seat) {
                    $totalAmount += ($seat->tier === 'vip') ? (float)$event->vip_price : (float)$event->regular_price;
                }
            }

            // Student user identification
            $studentName = $request->input('student_name', 'MSEUF Mobile Attendee');
            $user = User::firstOrCreate(
                ['email' => Str::slug($studentName) . '@student.mseuf.edu.ph'],
                ['name' => $studentName, 'password' => bcrypt('student123')]
            );

            // Create Master Booking
            $booking = Booking::create([
                'user_id' => $user->id,
                'event_id' => $event->id,
                'booking_reference' => 'MSEUF-' . strtoupper(Str::random(6)),
                'total_seats' => $selectedSeats->count(),
                'total_amount' => $totalAmount,
                'payment_status' => $event->pricing_type === 'free' ? 'free' : 'paid',
                'gcash_reference' => $request->input('gcash_reference'),
                'status' => 'confirmed',
            ]);

            // Issue Seat Tickets
            $tickets = [];
            foreach ($selectedSeats as $seat) {
                $tickets[] = TicketSeat::create([
                    'booking_id' => $booking->id,
                    'event_id' => $event->id,
                    'seat_id' => $seat->id,
                    'qr_token' => Str::uuid()->toString(),
                    'is_checked_in' => false,
                ]);
            }

            $booking->load(['event', 'user', 'tickets.seat']);

            return response()->json([
                'success' => true,
                'message' => 'Seats successfully reserved!',
                'booking' => [
                    'id' => $booking->id,
                    'booking_reference' => $booking->booking_reference,
                    'attendee_name' => $booking->user->name,
                    'attendee_email' => $booking->user->email,
                    'total_seats' => $booking->total_seats,
                    'total_amount' => (float)$booking->total_amount,
                    'payment_status' => $booking->payment_status,
                    'gcash_reference' => $booking->gcash_reference,
                    'status' => $booking->status,
                    'event' => [
                        'id' => $booking->event->id,
                        'title' => $booking->event->title,
                        'venue' => $booking->event->venue,
                        'formatted_date' => $booking->event->show_date?->format('l, F d, Y'),
                        'formatted_time' => $booking->event->show_date?->format('h:i A'),
                    ],
                    'seats' => $booking->tickets->map(function ($ticket) {
                        return [
                            'seat_id' => $ticket->seat->id,
                            'row' => $ticket->seat->row_label,
                            'number' => $ticket->seat->seat_number,
                            'seat_code' => $ticket->seat->row_label . $ticket->seat->seat_number,
                            'tier' => $ticket->seat->tier,
                            'qr_token' => $ticket->qr_token,
                        ];
                    }),
                ],
            ], 201);
        });
    }

    /**
     * Show booking details for confirmation pass.
     */
    public function show(Booking $booking): JsonResponse
    {
        $booking->load(['event', 'user', 'tickets.seat']);

        return response()->json([
            'success' => true,
            'booking' => [
                'id' => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'attendee_name' => $booking->user->name,
                'attendee_email' => $booking->user->email,
                'total_seats' => $booking->total_seats,
                'total_amount' => (float)$booking->total_amount,
                'payment_status' => $booking->payment_status,
                'gcash_reference' => $booking->gcash_reference,
                'status' => $booking->status,
                'created_at' => $booking->created_at?->format('M d, Y h:i A'),
                'event' => [
                    'id' => $booking->event->id,
                    'title' => $booking->event->title,
                    'venue' => $booking->event->venue,
                    'formatted_date' => $booking->event->show_date?->format('l, F d, Y'),
                    'formatted_time' => $booking->event->show_date?->format('h:i A'),
                ],
                'seats' => $booking->tickets->map(function ($ticket) {
                    return [
                        'seat_id' => $ticket->seat->id,
                        'row' => $ticket->seat->row_label,
                        'number' => $ticket->seat->seat_number,
                        'seat_code' => $ticket->seat->row_label . $ticket->seat->seat_number,
                        'tier' => $ticket->seat->tier,
                        'qr_token' => $ticket->qr_token,
                    ];
                }),
            ],
        ]);
    }
}
