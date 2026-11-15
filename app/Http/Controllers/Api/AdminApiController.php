<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Event;
use App\Models\Seat;
use App\Models\TicketSeat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminApiController extends Controller
{
    /**
     * Ensure only authorized admin accounts can mutate theater data via API.
     */
    protected function authorizeAdmin(Request $request): ?JsonResponse
    {
        $user = AuthApiController::resolveUser($request);
        if (! $user || ($user->role !== 'admin' && ! $user->canManageTheater())) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin privileges required.',
            ], 403);
        }

        return null;
    }

    /**
     * Preset posters matching the Website Admin Portal.
     */
    public static function presetPosters(): array
    {
        return [
            [
                'title' => 'Theater Stage & Spotlights',
                'url' => 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'title' => 'Auditorium Crowd & Gala',
                'url' => 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'title' => 'Drama & Performing Arts',
                'url' => 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'title' => 'Orchestra & Musical Concert',
                'url' => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'title' => 'Cinema Projection & Film',
                'url' => 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'title' => 'Cultural Dance & Pageant',
                'url' => 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
            ],
        ];
    }

    /**
     * 1. Admin Dashboard & Shows Catalog (matches resources/views/admin/events/index.blade.php)
     */
    public function dashboard(Request $request): JsonResponse
    {
        $query = Event::withCount(['ticketSeats as booked_seats_count'])
            ->withCount('bookings')
            ->orderBy('show_date', 'asc');

        if ($request->filled('filter') && in_array($request->filter, ['free', 'paid'], true)) {
            $query->where('pricing_type', $request->filter);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('venue', 'like', "%{$search}%");
            });
        }

        $totalSeats = Seat::count() ?: 60;
        $events = $query->get()->map(function (Event $event) use ($totalSeats) {
            return $this->formatEvent($event, $totalSeats);
        });

        return response()->json([
            'success' => true,
            'stats' => [
                'total_events' => Event::count(),
                'total_bookings' => Booking::count(),
                'total_seats_reserved' => TicketSeat::count(),
                'total_revenue' => (float) Booking::where('payment_status', 'paid')->sum('total_amount'),
                'total_seats' => $totalSeats,
            ],
            'events' => $events,
            'preset_posters' => self::presetPosters(),
        ]);
    }

    /**
     * 2. Store New Show (matches Admin\EventController@store)
     */
    public function storeEvent(Request $request): JsonResponse
    {
        if ($denied = $this->authorizeAdmin($request)) {
            return $denied;
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'venue' => 'nullable|string|max:255',
            'show_date' => 'required|date',
            'pricing_type' => 'required|in:free,paid',
            'regular_price' => 'nullable|numeric|min:0',
            'vip_price' => 'nullable|numeric|min:0',
            'banner_image' => 'nullable|string|max:1000',
        ]);

        $validated['venue'] = 'Little Theater, AEC Building';

        if ($validated['pricing_type'] === 'free') {
            $validated['regular_price'] = 0.00;
            $validated['vip_price'] = 0.00;
        } else {
            $validated['regular_price'] = $validated['regular_price'] ?? 150.00;
            $validated['vip_price'] = $validated['vip_price'] ?? 250.00;
        }

        if (empty($validated['banner_image'])) {
            $validated['banner_image'] = 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80';
        }

        $event = Event::create($validated);
        $totalSeats = Seat::count() ?: 60;

        return response()->json([
            'success' => true,
            'message' => "'{$event->title}' has been successfully posted! Students can now view and book it on the mobile app.",
            'event' => $this->formatEvent($event, $totalSeats),
        ], 201);
    }

    /**
     * 3. Show Event Overview, Live 60-Seat Map & Attendees (matches Admin\EventController@show)
     */
    public function showEvent(Request $request, Event $event): JsonResponse
    {
        $allSeats = Seat::orderBy('row_label')->orderBy('seat_number')->get();
        $bookedTicketSeats = TicketSeat::with(['booking.user', 'seat'])
            ->where('event_id', $event->id)
            ->get();

        $occupiedSeatMap = [];
        foreach ($bookedTicketSeats as $ts) {
            $occupiedSeatMap[$ts->seat_id] = [
                'student_name' => $ts->booking?->user?->name ?? 'Student Attendee',
                'student_email' => $ts->booking?->user?->email ?? '',
                'booking_ref' => $ts->booking?->booking_reference ?? 'N/A',
                'is_checked_in' => (bool) $ts->is_checked_in,
                'qr_token' => $ts->qr_token,
                'payment_status' => $ts->booking?->payment_status ?? 'free',
            ];
        }

        $occupiedSeatIds = array_keys($occupiedSeatMap);

        $seatsByRow = $allSeats->groupBy('row_label')->map(function ($rowSeats) use ($occupiedSeatMap) {
            return $rowSeats->map(function ($seat) use ($occupiedSeatMap) {
                $occupant = $occupiedSeatMap[$seat->id] ?? null;

                return [
                    'id' => $seat->id,
                    'row_label' => $seat->row_label,
                    'seat_number' => $seat->seat_number,
                    'seat_code' => "{$seat->row_label}{$seat->seat_number}",
                    'tier' => $seat->tier,
                    'is_vip' => $seat->tier === 'vip',
                    'is_occupied' => $occupant !== null,
                    'occupant' => $occupant,
                ];
            })->values();
        });

        $bookings = Booking::with(['user', 'tickets.seat'])
            ->where('event_id', $event->id)
            ->latest()
            ->get();

        $totalSeats = $allSeats->count() ?: 60;
        $occupiedCount = count($occupiedSeatIds);
        $availableCount = max(0, $totalSeats - $occupiedCount);
        $occupancyRate = $totalSeats > 0 ? (int) round(($occupiedCount / $totalSeats) * 100) : 0;
        $eventRevenue = (float) $bookings->where('payment_status', 'paid')->sum('total_amount');

        return response()->json([
            'success' => true,
            'event' => $this->formatEvent($event, $totalSeats, $occupiedCount),
            'stats' => [
                'total_seats' => $totalSeats,
                'occupied_count' => $occupiedCount,
                'available_count' => $availableCount,
                'occupancy_rate' => $occupancyRate,
                'event_revenue' => $eventRevenue,
            ],
            'seats_by_row' => $seatsByRow,
            'occupied_seat_ids' => $occupiedSeatIds,
            'bookings' => $bookings->map(fn (Booking $b) => $this->formatBooking($b)),
        ]);
    }

    /**
     * 4. Update Show Details (matches Admin\EventController@update)
     */
    public function updateEvent(Request $request, Event $event): JsonResponse
    {
        if ($denied = $this->authorizeAdmin($request)) {
            return $denied;
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'venue' => 'nullable|string|max:255',
            'show_date' => 'required|date',
            'pricing_type' => 'required|in:free,paid',
            'regular_price' => 'nullable|numeric|min:0',
            'vip_price' => 'nullable|numeric|min:0',
            'banner_image' => 'nullable|string|max:1000',
        ]);

        $validated['venue'] = 'Little Theater, AEC Building';

        if ($validated['pricing_type'] === 'free') {
            $validated['regular_price'] = 0.00;
            $validated['vip_price'] = 0.00;
        } else {
            $validated['regular_price'] = $validated['regular_price'] ?? 150.00;
            $validated['vip_price'] = $validated['vip_price'] ?? 250.00;
        }

        $event->update($validated);
        $totalSeats = Seat::count() ?: 60;

        return response()->json([
            'success' => true,
            'message' => "Show details for '{$event->title}' have been updated.",
            'event' => $this->formatEvent($event->fresh(), $totalSeats),
        ]);
    }

    /**
     * 5. Delete Show (matches Admin\EventController@destroy)
     */
    public function destroyEvent(Request $request, Event $event): JsonResponse
    {
        if ($denied = $this->authorizeAdmin($request)) {
            return $denied;
        }

        $title = $event->title;
        $event->delete();

        return response()->json([
            'success' => true,
            'message' => "Show '{$title}' and its reservations have been removed.",
        ]);
    }

    /**
     * 6. Student Reservations Master List (matches Admin\BookingController@index)
     */
    public function bookings(Request $request): JsonResponse
    {
        $query = Booking::with(['event', 'user', 'tickets.seat'])
            ->latest();

        if ($request->filled('event_id')) {
            $query->where('event_id', $request->event_id);
        }

        if ($request->filled('payment_status') && in_array($request->payment_status, ['free', 'paid'], true)) {
            $query->where('payment_status', $request->payment_status);
        }

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

        $bookings = $query->get()->map(fn (Booking $b) => $this->formatBooking($b));
        $events = Event::orderBy('title')->get(['id', 'title']);

        return response()->json([
            'success' => true,
            'stats' => [
                'total_bookings' => Booking::count(),
                'total_seats_reserved' => (int) Booking::sum('total_seats'),
                'total_revenue' => (float) Booking::where('payment_status', 'paid')->sum('total_amount'),
            ],
            'events' => $events,
            'bookings' => $bookings,
        ]);
    }

    /**
     * 7. Cancel Student Reservation (matches Admin\BookingController@destroy)
     */
    public function destroyBooking(Request $request, Booking $booking): JsonResponse
    {
        if ($denied = $this->authorizeAdmin($request)) {
            return $denied;
        }

        $ref = $booking->booking_reference;
        $booking->delete();

        return response()->json([
            'success' => true,
            'message' => "Reservation #{$ref} was cancelled and the seats are now available again.",
        ]);
    }

    /**
     * 8. Gate Marshal Scanner Stats & Recent Bookings (matches CheckInController@index)
     */
    public function scanner(): JsonResponse
    {
        $recentBookings = Booking::with(['event', 'user', 'tickets.seat'])
            ->latest()
            ->take(8)
            ->get()
            ->map(fn (Booking $b) => $this->formatBooking($b));

        return response()->json([
            'success' => true,
            'stats' => [
                'total_admitted' => TicketSeat::where('is_checked_in', true)->count(),
                'pending_admission' => TicketSeat::where('is_checked_in', false)->count(),
                'total_tickets' => TicketSeat::count(),
            ],
            'recent_bookings' => $recentBookings,
        ]);
    }

    protected function formatEvent(Event $event, int $totalSeats = 60, ?int $bookedOverride = null): array
    {
        $booked = $bookedOverride ?? ($event->booked_seats_count ?? $event->ticketSeats()->count());
        $available = max(0, $totalSeats - (int) $booked);
        $percent = $totalSeats > 0 ? min(100, (int) round(($booked / $totalSeats) * 100)) : 0;

        return [
            'id' => $event->id,
            'title' => $event->title,
            'venue' => $event->venue,
            'show_date' => $event->show_date?->toIso8601String(),
            'show_date_input' => $event->show_date?->format('Y-m-d\TH:i'),
            'formatted_date' => $event->show_date?->format('l, F d, Y'),
            'short_date' => $event->show_date?->format('M d, Y • h:i A'),
            'formatted_time' => $event->show_date?->format('h:i A'),
            'pricing_type' => $event->pricing_type,
            'regular_price' => (float) $event->regular_price,
            'vip_price' => (float) $event->vip_price,
            'banner_image' => $event->banner_image,
            'booked_seats_count' => (int) $booked,
            'total_seats' => $totalSeats,
            'available_seats_count' => $available,
            'occupancy_percent' => $percent,
        ];
    }

    protected function formatBooking(Booking $b): array
    {
        $allCheckedIn = $b->tickets->isNotEmpty() && $b->tickets->every(fn ($t) => (bool) $t->is_checked_in);

        return [
            'id' => $b->id,
            'event_id' => $b->event_id,
            'booking_reference' => $b->booking_reference,
            'student_name' => $b->user?->name ?? 'Attendee',
            'student_email' => $b->user?->email ?? '',
            'event_title' => $b->event?->title ?? 'N/A',
            'event_date' => $b->event?->show_date ? $b->event->show_date->format('M d, Y') : '',
            'total_seats' => (int) $b->total_seats,
            'total_amount' => (float) $b->total_amount,
            'payment_status' => $b->payment_status,
            'gcash_reference' => $b->gcash_reference,
            'status' => $b->status,
            'all_checked_in' => $allCheckedIn,
            'created_at' => $b->created_at ? $b->created_at->format('M d, Y h:i A') : 'N/A',
            'tickets' => $b->tickets->map(function ($t) {
                return [
                    'id' => $t->id,
                    'seat_id' => $t->seat_id,
                    'row_label' => $t->seat?->row_label,
                    'seat_number' => $t->seat?->seat_number,
                    'seat_label' => "Row {$t->seat?->row_label}-{$t->seat?->seat_number}",
                    'seat_code' => "{$t->seat?->row_label}{$t->seat?->seat_number}",
                    'tier' => $t->seat?->tier,
                    'is_vip' => $t->seat?->tier === 'vip',
                    'is_checked_in' => (bool) $t->is_checked_in,
                    'qr_token' => $t->qr_token,
                ];
            })->values(),
        ];
    }
}
