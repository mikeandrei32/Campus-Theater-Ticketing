@extends('layouts.admin')

@section('content')
<div class="space-y-6">

    <!-- Top Header & Summary -->
    <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
            <div class="flex items-center gap-2 text-xs text-gray-500 font-bold mb-1">
                <a href="{{ route('admin.events.index') }}" class="hover:text-maroon-700">Shows & Plays</a>
                <span>›</span>
                <span class="text-maroon-700 font-extrabold">Student Reservations</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2.5">
                <span>Student Reservations & Pass Master List</span>
            </h1>
            <p class="text-xs text-gray-500 mt-1">
                View, search, and manage all ticket reservations submitted from the mobile app.
            </p>
        </div>

        <div class="flex items-center gap-2">
            <button onclick="window.print()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition border border-gray-200 flex items-center gap-1.5 shadow-sm">
                <span>Print Attendee Sheet</span>
            </button>
        </div>
    </div>

    <!-- Quick Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div class="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Bookings</div>
            <div class="text-2xl font-black text-gray-900 mt-1">{{ $totalBookingsCount }}</div>
            <div class="text-[11px] text-gray-400 mt-0.5">Mobile app reservations</div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div class="text-xs font-bold text-gray-500 uppercase tracking-wider">Seats Reserved</div>
            <div class="text-2xl font-black text-maroon-700 mt-1">{{ $totalSeatsReserved }}</div>
            <div class="text-[11px] text-gray-400 mt-0.5">Total tickets issued</div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div class="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</div>
            <div class="text-2xl font-black text-emerald-600 mt-1">₱{{ number_format($totalRevenue, 2) }}</div>
            <div class="text-[11px] text-gray-400 mt-0.5">GCash payments collected</div>
        </div>
    </div>

    <!-- Filter & Search Controls -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
        <form method="GET" action="{{ route('admin.bookings.index') }}" class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <!-- Filter by Event -->
            <div class="sm:col-span-4">
                <select name="event_id" class="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-maroon-700 focus:outline-none bg-white">
                    <option value="">-- All Plays & Shows --</option>
                    @foreach($events as $ev)
                        <option value="{{ $ev->id }}" {{ request('event_id') == $ev->id ? 'selected' : '' }}>
                            {{ $ev->title }}
                        </option>
                    @endforeach
                </select>
            </div>

            <!-- Filter by Payment -->
            <div class="sm:col-span-3">
                <select name="payment_status" class="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-maroon-700 focus:outline-none bg-white">
                    <option value="">-- All Payment Types --</option>
                    <option value="paid" {{ request('payment_status') === 'paid' ? 'selected' : '' }}>Paid Tickets Only</option>
                    <option value="free" {{ request('payment_status') === 'free' ? 'selected' : '' }}>Free Passes Only</option>
                </select>
            </div>

            <!-- Search by Name / Reference -->
            <div class="sm:col-span-3">
                <input type="text" 
                       name="search" 
                       value="{{ request('search') }}" 
                       placeholder="Student name, ref, or GCash..." 
                       class="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-maroon-700 focus:outline-none">
            </div>

            <!-- Submit Buttons -->
            <div class="sm:col-span-2 flex items-center gap-2">
                <button type="submit" class="w-full py-2 bg-maroon-700 hover:bg-maroon-800 text-white font-bold text-xs rounded-xl transition">
                    Filter
                </button>
                @if(request()->hasAny(['event_id', 'payment_status', 'search']))
                    <a href="{{ route('admin.bookings.index') }}" class="text-xs text-gray-500 font-bold hover:text-gray-800">
                        Reset
                    </a>
                @endif
            </div>
        </form>
    </div>

    <!-- Bookings Table -->
    <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        @if($bookings->isNotEmpty())
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-gray-600">
                    <thead class="bg-gray-50 text-[11px] font-black text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        <tr>
                            <th class="py-3.5 px-4">Booking Ref</th>
                            <th class="py-3.5 px-4">Student Attendee</th>
                            <th class="py-3.5 px-4">Show Title</th>
                            <th class="py-3.5 px-4">Seats Reserved</th>
                            <th class="py-3.5 px-4">Amount / GCash</th>
                            <th class="py-3.5 px-4">Booked Date</th>
                            <th class="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 font-medium">
                        @foreach($bookings as $booking)
                            <tr class="hover:bg-gray-50 transition">
                                <td class="py-3.5 px-4 font-mono font-bold text-maroon-700">
                                    {{ $booking->booking_reference }}
                                </td>
                                <td class="py-3.5 px-4 font-bold text-gray-900">
                                    {{ $booking->user?->name ?? 'Attendee' }}
                                    <span class="block text-[10px] text-gray-400 font-normal">{{ $booking->user?->email }}</span>
                                </td>
                                <td class="py-3.5 px-4">
                                    <a href="{{ route('admin.events.show', $booking->event_id) }}" class="font-bold text-gray-900 hover:text-maroon-700 line-clamp-1">
                                        {{ $booking->event?->title ?? 'N/A' }}
                                    </a>
                                    <span class="text-[10px] text-gray-400 block">
                                        {{ $booking->event?->show_date ? $booking->event->show_date->format('M d, Y') : '' }}
                                    </span>
                                </td>
                                <td class="py-3.5 px-4">
                                    <div class="flex items-center gap-1 flex-wrap">
                                        @foreach($booking->tickets as $ticket)
                                            <span class="px-2 py-0.5 rounded bg-maroon-50 text-maroon-800 font-bold border border-maroon-200 text-[10px]">
                                                Row {{ $ticket->seat->row_label }}-{{ $ticket->seat->seat_number }}
                                            </span>
                                        @endforeach
                                    </div>
                                </td>
                                <td class="py-3.5 px-4">
                                    @if($booking->payment_status === 'free')
                                        <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                                            FREE
                                        </span>
                                    @else
                                        <span class="font-bold text-gray-900">₱{{ number_format($booking->total_amount, 2) }}</span>
                                        @if($booking->gcash_reference)
                                            <span class="block font-mono text-[10px] text-gray-500">Ref: {{ $booking->gcash_reference }}</span>
                                        @endif
                                    @endif
                                </td>
                                <td class="py-3.5 px-4 text-gray-500 text-[11px]">
                                    {{ $booking->created_at ? $booking->created_at->format('M d, Y h:i A') : 'N/A' }}
                                </td>
                                <td class="py-3.5 px-4 text-right">
                                    <form method="POST" action="{{ route('admin.bookings.destroy', $booking->id) }}" onsubmit="return confirm('Cancel reservation #{{ $booking->booking_reference }}? This will release the seats.');">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="text-xs text-red-600 hover:text-red-800 font-bold hover:underline">
                                            Cancel
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>

            <!-- Pagination Links -->
            <div class="mt-4 pt-4 border-t border-gray-100">
                {{ $bookings->links() }}
            </div>
        @else
            <div class="py-12 text-center text-gray-500">
                <p class="font-bold text-base text-gray-800">No Reservations Found</p>
                <p class="text-xs text-gray-400 mt-0.5">No student reservations match your search criteria.</p>
            </div>
        @endif
    </div>

</div>
@endsection
