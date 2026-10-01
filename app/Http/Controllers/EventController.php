<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Seat;
use Illuminate\Http\Request;

class EventController extends Controller
{
    /**
     * Display a listing of upcoming collegiate theater events.
     * Pure MVC: Controller fetches entities and passes them to Blade view.
     */
    public function index()
    {
        $events = Event::withCount(['ticketSeats as booked_seats_count'])
            ->orderBy('show_date')
            ->get();

        $totalSeats = Seat::count();

        return view('events.index', compact('events', 'totalSeats'));
    }

    /**
     * Display or redirect to the specified event's theater seat picker.
     */
    public function show(Event $event)
    {
        return redirect()->route('theater.seats', $event);
    }
}
