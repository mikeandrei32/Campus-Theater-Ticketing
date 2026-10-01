<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Event;
use App\Models\Seat;
use App\Models\TicketSeat;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SeatBookingController extends Controller
{
    /**
     * Show the interactive cinema seat picker for the event (Midterm 40% Scope).
     */
    public function create(Event $event)
    {
        $allSeats = Seat::orderBy('row_label')->orderBy('seat_number')->get();

        // Find which seats are already taken for THIS event
        $occupiedSeatIds = TicketSeat::where('event_id', $event->id)
            ->pluck('seat_id')
            ->toArray();

        $groupedSeats = $allSeats->groupBy('row_label');

        return view('theater.seat-picker', compact('event', 'groupedSeats', 'occupiedSeatIds'));
    }

    /**
     * Alias for create to support backward compatibility.
     */
    public function index(Event $event)
    {
        return $this->create($event);
    }

    /**
     * Process Seat Reservation & Database Transaction.
     */
    public function store(Request $request, Event $event)
    {
        $rules = [
            'seat_ids' => 'required|array|min:1|max:4',
            'seat_ids.*' => 'exists:seats,id',
            'student_name' => 'nullable|string|max:100',
        ];

        if ($event->pricing_type === 'paid') {
            $rules['gcash_reference'] = 'required|string|min:6|max:30';
        }

        $request->validate($rules);

        return DB::transaction(function () use ($request, $event) {
            $selectedSeats = Seat::whereIn('id', $request->seat_ids)->lockForUpdate()->get();

            // Collision check
            $alreadyBooked = TicketSeat::where('event_id', $event->id)
                ->whereIn('seat_id', $selectedSeats->pluck('id'))
                ->exists();

            if ($alreadyBooked) {
                return back()->with('error', 'One of your selected seats was just taken. Please pick another.');
            }

            // Price computation
            $total = 0.00;
            if ($event->pricing_type === 'paid') {
                foreach ($selectedSeats as $seat) {
                    $total += ($seat->tier === 'vip') ? $event->vip_price : $event->regular_price;
                }
            }

            // Identify student user (auth user or default seeded student)
            $userId = auth()->id();
            if (!$userId) {
                if ($request->filled('student_name')) {
                    $student = User::firstOrCreate(
                        ['email' => Str::slug($request->student_name) . '@student.mseuf.edu.ph'],
                        ['name' => $request->student_name, 'password' => bcrypt('student123')]
                    );
                    $userId = $student->id;
                } else {
                    $defaultUser = User::first() ?? User::create([
                        'name' => 'MSEUF Student Attendee',
                        'email' => 'attendee@mseuf.edu.ph',
                        'password' => bcrypt('password'),
                    ]);
                    $userId = $defaultUser->id;
                }
            }

            // Create Master Booking
            $booking = Booking::create([
                'user_id' => $userId,
                'event_id' => $event->id,
                'booking_reference' => 'MSEUF-' . strtoupper(Str::random(6)),
                'total_seats' => $selectedSeats->count(),
                'total_amount' => $total,
                'payment_status' => $event->pricing_type === 'free' ? 'free' : 'paid',
                'gcash_reference' => $request->gcash_reference ?? null,
                'status' => 'confirmed',
            ]);

            // Issue individual seat tickets
            foreach ($selectedSeats as $seat) {
                TicketSeat::create([
                    'booking_id' => $booking->id,
                    'event_id' => $event->id,
                    'seat_id' => $seat->id,
                    'qr_token' => Str::uuid()->toString(),
                    'is_checked_in' => false,
                ]);
            }

            return redirect()->route('bookings.confirmation', $booking->id)
                ->with('success', 'Seats successfully reserved!');
        });
    }

    /**
     * Backward-compatibility alias for store.
     */
    public function book(Request $request, Event $event)
    {
        return $this->store($request, $event);
    }
}
