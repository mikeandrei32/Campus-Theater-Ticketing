<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Event;
use App\Models\Seat;
use App\Models\TicketSeat;
use Illuminate\Http\Request;

class EventController extends Controller
{
    /**
     * =========================================================================
     * 1. ADMIN DASHBOARD / SHOWS CATALOG
     * =========================================================================
     * Displays all campus theater plays & cinema shows with key statistics.
     * Beginners note: Pure MVC pattern - Controller gets data, passes to View.
     */
    public function index(Request $request)
    {
        // Fetch all events with the count of booked seats
        $query = Event::withCount(['ticketSeats as booked_seats_count'])
            ->withCount('bookings')
            ->orderBy('show_date', 'asc');

        // Optional filter: Free vs Paid shows
        if ($request->filled('filter')) {
            if ($request->filter === 'free') {
                $query->where('pricing_type', 'free');
            } elseif ($request->filter === 'paid') {
                $query->where('pricing_type', 'paid');
            }
        }

        // Optional search: Search by show title or venue
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('venue', 'like', "%{$search}%");
            });
        }

        $events = $query->get();

        // Calculate summary statistics for the admin dashboard metric cards
        $totalSeats = Seat::count() ?: 60;
        $totalEventsCount = Event::count();
        $totalBookingsCount = Booking::count();
        $totalSeatsReservedCount = TicketSeat::count();
        $totalRevenue = Booking::where('payment_status', 'paid')->sum('total_amount');

        return view('admin.events.index', [
            'events' => $events,
            'totalSeats' => $totalSeats,
            'totalEventsCount' => $totalEventsCount,
            'totalBookingsCount' => $totalBookingsCount,
            'totalSeatsReservedCount' => $totalSeatsReservedCount,
            'totalRevenue' => $totalRevenue,
            'currentFilter' => $request->filter ?? 'all',
            'searchQuery' => $request->search ?? '',
        ]);
    }

    /**
     * =========================================================================
     * 2. CREATE SHOW FORM
     * =========================================================================
     * Displays the form to post a new play or cinema movie for students to watch.
     */
    public function create()
    {
        // Preset venues for quick selection
        $presetVenues = [
            'MSEUF University Gymnasium & Cultural Center',
            'Little Theater, AEC Building',
            'University Auditorium',
            'College of Architecture Amphitheater',
            'CCMS Multimedia Hall',
        ];

        // Curated high quality banner posters for campus plays & cinema
        $presetPosters = [
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

        return view('admin.events.create', compact('presetVenues', 'presetPosters'));
    }

    /**
     * =========================================================================
     * 3. STORE NEW SHOW (SAVE TO DATABASE)
     * =========================================================================
     * Validates and saves the new play or cine event to SQLite database.
     * Instantly makes it live for students on the Mobile App!
     */
    public function store(Request $request)
    {
        // 1. Validate incoming form inputs
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'venue' => 'nullable|string|max:255',
            'show_date' => 'required|date',
            'pricing_type' => 'required|in:free,paid',
            'regular_price' => 'nullable|numeric|min:0',
            'vip_price' => 'nullable|numeric|min:0',
            'banner_image' => 'nullable|string|max:1000',
        ], [
            'title.required' => 'Please provide a title for the play or cinema show.',
            'show_date.required' => 'Please select the show date and time.',
            'pricing_type.required' => 'Please choose whether the show is Free or Paid.',
        ]);

        // Venue is dedicated specifically to Little Theater
        $validated['venue'] = 'Little Theater, AEC Building';

        // 2. Set pricing to 0.00 if it is a free event
        if ($validated['pricing_type'] === 'free') {
            $validated['regular_price'] = 0.00;
            $validated['vip_price'] = 0.00;
        } else {
            $validated['regular_price'] = $validated['regular_price'] ?? 100.00;
            $validated['vip_price'] = $validated['vip_price'] ?? 200.00;
        }

        // 3. Fallback banner image if left empty
        if (empty($validated['banner_image'])) {
            $validated['banner_image'] = 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80';
        }

        // 4. Create the Event in database
        $event = Event::create($validated);

        // 5. Redirect to the newly created event details with a friendly flash message
        return redirect()
            ->route('admin.events.show', $event->id)
            ->with('success', "🎉 '{$event->title}' has been successfully posted! Students can now view and book it on the mobile app.");
    }

    /**
     * =========================================================================
     * 4. SHOW EVENT DETAILS, LIVE SEAT MAP & ATTENDEES
     * =========================================================================
     * Allows the Admin to monitor real-time seat occupancy and student bookings.
     */
    public function show(Event $event)
    {
        // Fetch all 60 auditorium seats ordered by row (A-F) and seat number (1-10)
        $allSeats = Seat::orderBy('row_label')->orderBy('seat_number')->get();

        // Fetch all ticket seats booked for this specific event
        $bookedTicketSeats = TicketSeat::with(['booking.user', 'seat'])
            ->where('event_id', $event->id)
            ->get();

        // Map occupied seat IDs and attendee info for the visual seat map
        $occupiedSeatMap = [];
        foreach ($bookedTicketSeats as $ts) {
            $occupiedSeatMap[$ts->seat_id] = [
                'student_name' => $ts->booking?->user?->name ?? 'Student Attendee',
                'booking_ref' => $ts->booking?->booking_reference ?? 'N/A',
                'is_checked_in' => $ts->is_checked_in,
                'qr_token' => $ts->qr_token,
                'payment_status' => $ts->booking?->payment_status ?? 'free',
            ];
        }

        $occupiedSeatIds = array_keys($occupiedSeatMap);
        $groupedSeats = $allSeats->groupBy('row_label');

        // Fetch master bookings for this event (for the reservations table)
        $bookings = Booking::with(['user', 'tickets.seat'])
            ->where('event_id', $event->id)
            ->latest()
            ->get();

        // Stats calculation
        $totalSeats = $allSeats->count() ?: 60;
        $occupiedCount = count($occupiedSeatIds);
        $availableCount = max(0, $totalSeats - $occupiedCount);
        $occupancyRate = $totalSeats > 0 ? round(($occupiedCount / $totalSeats) * 100) : 0;
        $eventRevenue = $bookings->where('payment_status', 'paid')->sum('total_amount');

        return view('admin.events.show', compact(
            'event',
            'groupedSeats',
            'occupiedSeatIds',
            'occupiedSeatMap',
            'bookings',
            'totalSeats',
            'occupiedCount',
            'availableCount',
            'occupancyRate',
            'eventRevenue'
        ));
    }

    /**
     * =========================================================================
     * 5. EDIT SHOW FORM
     * =========================================================================
     * Displays form pre-filled with existing data to modify a play or cine show.
     */
    public function edit(Event $event)
    {
        $presetVenues = [
            'MSEUF University Gymnasium & Cultural Center',
            'Little Theater, AEC Building',
            'University Auditorium',
            'College of Architecture Amphitheater',
            'CCMS Multimedia Hall',
        ];

        $presetPosters = [
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

        return view('admin.events.edit', compact('event', 'presetVenues', 'presetPosters'));
    }

    /**
     * =========================================================================
     * 6. UPDATE SHOW
     * =========================================================================
     * Updates the event in the database.
     */
    public function update(Request $request, Event $event)
    {
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
        }

        $event->update($validated);

        return redirect()
            ->route('admin.events.show', $event->id)
            ->with('success', "✅ Show details for '{$event->title}' were updated successfully!");
    }

    /**
     * =========================================================================
     * 7. DELETE SHOW
     * =========================================================================
     * Removes a show and its associated reservations from the database.
     */
    public function destroy(Event $event)
    {
        $title = $event->title;
        $event->delete();

        return redirect()
            ->route('admin.events.index')
            ->with('success', "🗑️ '{$title}' has been removed from the schedule.");
    }
}
