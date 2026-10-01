<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Seat;
use Illuminate\Http\JsonResponse;

class EventApiController extends Controller
{
    /**
     * Display a listing of campus theater events for mobile frontend.
     */
    public function index(): JsonResponse
    {
        $events = Event::withCount(['ticketSeats as booked_seats_count'])
            ->orderBy('show_date')
            ->get();

        $totalSeats = Seat::count() ?: 60;

        $payload = $events->map(function ($event) use ($totalSeats) {
            return [
                'id' => $event->id,
                'title' => $event->title,
                'venue' => $event->venue,
                'show_date' => $event->show_date?->toIso8601String(),
                'formatted_date' => $event->show_date?->format('l, F d, Y'),
                'formatted_time' => $event->show_date?->format('h:i A'),
                'pricing_type' => $event->pricing_type,
                'regular_price' => (float) $event->regular_price,
                'vip_price' => (float) $event->vip_price,
                'banner_image' => $event->banner_image,
                'booked_seats_count' => (int) $event->booked_seats_count,
                'total_seats' => $totalSeats,
                'available_seats_count' => max(0, $totalSeats - (int) $event->booked_seats_count),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $payload,
        ]);
    }

    /**
     * Display single event details for mobile frontend.
     */
    public function show(Event $event): JsonResponse
    {
        $totalSeats = Seat::count() ?: 60;
        $bookedCount = $event->ticketSeats()->count();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $event->id,
                'title' => $event->title,
                'venue' => $event->venue,
                'show_date' => $event->show_date?->toIso8601String(),
                'formatted_date' => $event->show_date?->format('l, F d, Y'),
                'formatted_time' => $event->show_date?->format('h:i A'),
                'pricing_type' => $event->pricing_type,
                'regular_price' => (float) $event->regular_price,
                'vip_price' => (float) $event->vip_price,
                'banner_image' => $event->banner_image,
                'booked_seats_count' => $bookedCount,
                'total_seats' => $totalSeats,
                'available_seats_count' => max(0, $totalSeats - $bookedCount),
            ],
        ]);
    }
}
