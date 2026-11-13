@extends('layouts.admin')

@section('content')
<div class="space-y-8" x-data="{ selectedSeatInfo: null }">

    <!-- ========================================================================= -->
    <!-- 1. TOP NAVIGATION & ACTION BAR                                            -->
    <!-- ========================================================================= -->
    <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
            <div class="flex items-center gap-2 text-xs text-gray-500 font-bold mb-1">
                <a href="{{ route('admin.events.index') }}" class="hover:text-maroon-700">Shows & Plays</a>
                <span>›</span>
                <span class="text-maroon-700 font-extrabold">{{ $event->title }}</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-gray-900">
                Show Overview & Live Seat Map
            </h1>
        </div>

        @if(auth()->user()?->canManageTheater())
            <div class="flex items-center gap-2.5 flex-wrap">
                <a href="{{ route('admin.events.edit', $event->id) }}" 
                   class="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition flex items-center gap-1.5 shadow-sm">
                    <span>Edit Show Details</span>
                </a>

                <a href="{{ route('admin.scanner') }}" 
                   class="px-4 py-2.5 rounded-xl bg-maroon-50 hover:bg-maroon-100 text-maroon-800 font-bold text-xs transition border border-maroon-200 flex items-center gap-1.5">
                    <span>Gate Scanner</span>
                </a>

                <form method="POST" action="{{ route('admin.events.destroy', $event->id) }}" onsubmit="return confirm('Are you sure you want to delete this show?');">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition border border-red-200 flex items-center gap-1.5">
                        <span>Delete</span>
                    </button>
                </form>
            </div>
        @endif
    </div>

    <!-- ========================================================================= -->
    <!-- 2. SHOW SUMMARY BANNER & STATS CARDS                                      -->
    <!-- ========================================================================= -->
    <div class="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm grid grid-cols-1 lg:grid-cols-12">
        
        <!-- Banner Image Container (5 cols) -->
        <div class="lg:col-span-5 relative bg-gray-900 min-h-[220px]">
            @if($event->banner_image)
                <img src="{{ $event->banner_image }}" alt="{{ $event->title }}" class="w-full h-full object-cover">
            @else
                <div class="w-full h-full bg-maroon-900 flex items-center justify-center text-white font-black text-xl">
                    MSEUF THEATER
                </div>
            @endif
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>

            <div class="absolute bottom-4 left-4 right-4">
                @if($event->pricing_type === 'free')
                    <span class="inline-block px-3 py-1 bg-emerald-600 text-white font-black text-xs rounded-full shadow mb-2">
                        FREE ADMISSION
                    </span>
                @else
                    <span class="inline-block px-3 py-1 bg-maroon-700 text-white border border-vipGold font-black text-xs rounded-full shadow mb-2">
                        ★ VIP ₱{{ number_format($event->vip_price, 0) }} &bull; REG ₱{{ number_format($event->regular_price, 0) }}
                    </span>
                @endif
                <div class="text-white text-xs font-semibold flex items-center gap-2">
                    <span>{{ $event->venue }}</span>
                </div>
            </div>
        </div>

        <!-- Details & Stats (7 cols) -->
        <div class="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
                <div class="flex items-center gap-2 text-xs font-bold text-maroon-700 mb-1">
                    <span>{{ $event->show_date ? $event->show_date->format('l, F d, Y • h:i A') : 'TBA' }}</span>
                </div>
                <h2 class="text-2xl font-black text-gray-900 leading-snug">
                    {{ $event->title }}
                </h2>
                <p class="text-xs text-gray-500 mt-1">
                    Live production hosted at Manuel S. Enverga University Foundation. Interactive auditorium seat picker enabled for students.
                </p>
            </div>

            <!-- Stats Bar -->
            <div class="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div class="bg-gray-50 rounded-2xl p-3 border border-gray-200">
                    <div class="text-[10px] uppercase font-bold text-gray-500">Reserved Seats</div>
                    <div class="text-xl font-black text-maroon-700 mt-0.5">{{ $occupiedCount }}</div>
                    <div class="text-[10px] text-gray-400">of {{ $totalSeats }} total</div>
                </div>

                <div class="bg-gray-50 rounded-2xl p-3 border border-gray-200">
                    <div class="text-[10px] uppercase font-bold text-gray-500">Open Seats</div>
                    <div class="text-xl font-black text-emerald-600 mt-0.5">{{ $availableCount }}</div>
                    <div class="text-[10px] text-gray-400">Available</div>
                </div>

                <div class="bg-gray-50 rounded-2xl p-3 border border-gray-200">
                    <div class="text-[10px] uppercase font-bold text-gray-500">Occupancy</div>
                    <div class="text-xl font-black text-gray-900 mt-0.5">{{ $occupancyRate }}%</div>
                    <div class="text-[10px] text-gray-400">Capacity</div>
                </div>

                <div class="bg-gray-50 rounded-2xl p-3 border border-gray-200">
                    <div class="text-[10px] uppercase font-bold text-gray-500">Show Revenue</div>
                    <div class="text-xl font-black text-vipGold mt-0.5">₱{{ number_format($eventRevenue, 0) }}</div>
                    <div class="text-[10px] text-gray-400">GCash Sales</div>
                </div>
            </div>
        </div>
    </div>

    <!-- ========================================================================= -->
    <!-- 3. INTERACTIVE VISUAL CINEMA SEATING MAP                                   -->
    <!-- ========================================================================= -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
                <h3 class="text-lg font-black text-gray-900 flex items-center gap-2">
                    <span>Auditorium Live Seating Layout (60 Seats)</span>
                </h3>
                <p class="text-xs text-gray-500 mt-0.5">
                    Click any seat to inspect student reservation details and check-in status.
                </p>
            </div>

            <!-- Legend (Matches Mobile App Legend) -->
            <div class="flex items-center gap-4 text-xs font-bold flex-wrap">
                <div class="flex items-center gap-1.5">
                    <div class="w-4 h-4 rounded-md border-2 border-maroon-700 bg-white"></div>
                    <span class="text-gray-600">Available</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <div class="w-4 h-4 rounded-md bg-maroon-700"></div>
                    <span class="text-gray-900 font-extrabold">Occupied</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="px-2 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-300 text-[10px] font-black">VIP (Rows A-B)</span>
                </div>
            </div>
        </div>

        <!-- Stage Representation -->
        <div class="max-w-xl mx-auto mb-8 text-center">
            <div class="h-3.5 bg-gradient-to-r from-transparent via-maroon-700 to-transparent rounded-full opacity-70 mb-1"></div>
            <div class="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                AUDITORIUM STAGE / CINEMA SCREEN
            </div>
        </div>

        <!-- Cinema Seating Grid -->
        <div class="max-w-2xl mx-auto space-y-3 overflow-x-auto pb-4">
            @foreach($groupedSeats as $rowLabel => $seats)
                @php
                    $isVipRow = in_array($rowLabel, ['A', 'B']);
                @endphp
                <div class="flex items-center justify-center gap-2 min-w-[500px]">
                    <!-- Row Label -->
                    <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black {{ $isVipRow ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-gray-100 text-gray-600' }}">
                        {{ $rowLabel }}
                    </div>

                    <!-- Row Seats (1 to 10) -->
                    <div class="flex items-center gap-1.5 sm:gap-2">
                        @foreach($seats as $seat)
                            @php
                                $isOccupied = in_array($seat->id, $occupiedSeatIds);
                                $occupant = $occupiedSeatMap[$seat->id] ?? null;
                            @endphp

                            <button type="button" 
                                    @click="selectedSeatInfo = {
                                        seatCode: '{{ $seat->row_label }}{{ $seat->seat_number }}',
                                        tier: '{{ $seat->tier }}',
                                        isOccupied: {{ $isOccupied ? 'true' : 'false' }},
                                        student: '{{ $occupant['student_name'] ?? 'None' }}',
                                        bookingRef: '{{ $occupant['booking_ref'] ?? 'N/A' }}',
                                        checkedIn: {{ ($occupant['is_checked_in'] ?? false) ? 'true' : 'false' }},
                                        token: '{{ $occupant['qr_token'] ?? '' }}'
                                    }"
                                    class="w-7 h-7 sm:w-9 sm:h-9 rounded-lg text-[10px] sm:text-xs font-bold transition flex items-center justify-center relative group
                                    {{ $isOccupied 
                                        ? 'bg-maroon-700 text-white shadow-sm ring-1 ring-maroon-900 cursor-pointer' 
                                        : 'bg-white border-2 border-maroon-700 text-maroon-800 hover:bg-maroon-50' }}
                                    {{ $isVipRow && !$isOccupied ? 'border-amber-500' : '' }}"
                                    title="{{ $isOccupied ? 'Seat ' . $seat->row_label . $seat->seat_number . ': ' . ($occupant['student_name'] ?? 'Occupied') : 'Seat ' . $seat->row_label . $seat->seat_number . ' (Available)' }}">
                                
                                <span>{{ $seat->seat_number }}</span>

                                @if($isOccupied && ($occupant['is_checked_in'] ?? false))
                                    <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border border-white rounded-full"></span>
                                @endif
                            </button>
                        @endforeach
                    </div>

                    <!-- Right Row Label -->
                    <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black {{ $isVipRow ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-gray-100 text-gray-600' }}">
                        {{ $rowLabel }}
                    </div>
                </div>
            @endforeach
        </div>

        <!-- Selected Seat Inspector Drawer -->
        <div x-show="selectedSeatInfo" x-cloak class="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black"
                     :class="selectedSeatInfo?.isOccupied ? 'bg-maroon-700 text-white' : 'bg-white border-2 border-maroon-700 text-maroon-700'">
                    <span x-text="selectedSeatInfo?.seatCode"></span>
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-black text-sm text-gray-900" x-text="'Seat ' + selectedSeatInfo?.seatCode"></span>
                        <span class="text-[10px] font-extrabold px-2 py-0.5 rounded uppercase"
                              :class="selectedSeatInfo?.tier === 'vip' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-gray-200 text-gray-700'"
                              x-text="selectedSeatInfo?.tier + ' Tier'"></span>
                    </div>
                    <div class="text-xs text-gray-600 mt-0.5" x-show="selectedSeatInfo?.isOccupied">
                        Reserved by: <strong class="text-maroon-700" x-text="selectedSeatInfo?.student"></strong> &bull; Ref: <code class="font-mono" x-text="selectedSeatInfo?.bookingRef"></code>
                    </div>
                    <div class="text-xs text-emerald-700 font-bold mt-0.5" x-show="!selectedSeatInfo?.isOccupied">
                        Seat is open and available for student booking on mobile app
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <template x-if="selectedSeatInfo?.isOccupied">
                    <span class="px-3 py-1 rounded-full text-xs font-bold"
                          :class="selectedSeatInfo?.checkedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">
                        <span x-text="selectedSeatInfo?.checkedIn ? 'Checked In at Gate' : 'Gate Check-In Pending'"></span>
                    </span>
                </template>
                <button @click="selectedSeatInfo = null" class="text-xs text-gray-400 hover:text-gray-700 font-bold px-2 py-1">
                    Close
                </button>
            </div>
        </div>

    </div>

    <!-- ========================================================================= -->
    <!-- 4. STUDENT RESERVATIONS & ATTENDEES TABLE                                  -->
    <!-- ========================================================================= -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200">
        
        <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
                <h3 class="text-lg font-black text-gray-900 flex items-center gap-2">
                    <span>Student Attendee Reservations ({{ $bookings->count() }} Orders)</span>
                </h3>
                <p class="text-xs text-gray-500 mt-0.5">
                    List of students who booked passes for this play on the mobile application.
                </p>
            </div>
        </div>

        @if($bookings->isNotEmpty())
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-gray-600">
                    <thead class="bg-gray-50 text-[11px] font-black text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        <tr>
                            <th class="py-3.5 px-4">Booking Ref</th>
                            <th class="py-3.5 px-4">Student Name</th>
                            <th class="py-3.5 px-4">Seats Reserved</th>
                            <th class="py-3.5 px-4">Payment / GCash</th>
                            <th class="py-3.5 px-4">Gate Status</th>
                            <th class="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 font-medium">
                        @foreach($bookings as $b)
                            <tr class="hover:bg-gray-50 transition">
                                <td class="py-3 px-4 font-mono font-bold text-maroon-700">
                                    {{ $b->booking_reference }}
                                </td>
                                <td class="py-3 px-4 font-bold text-gray-900">
                                    {{ $b->user?->name ?? 'Attendee' }}
                                    <span class="block text-[10px] text-gray-400 font-normal">{{ $b->user?->email }}</span>
                                </td>
                                <td class="py-3 px-4">
                                    <div class="flex items-center gap-1 flex-wrap">
                                        @foreach($b->tickets as $t)
                                            <span class="px-2 py-0.5 rounded bg-maroon-50 text-maroon-800 font-bold border border-maroon-200 text-[10px]">
                                                Row {{ $t->seat->row_label }}-{{ $t->seat->seat_number }}
                                            </span>
                                        @endforeach
                                    </div>
                                </td>
                                <td class="py-3 px-4">
                                    @if($b->payment_status === 'free')
                                        <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                                            FREE
                                        </span>
                                    @else
                                        <span class="font-bold text-gray-900">₱{{ number_format($b->total_amount, 2) }}</span>
                                        @if($b->gcash_reference)
                                            <span class="block font-mono text-[10px] text-gray-500">Ref: {{ $b->gcash_reference }}</span>
                                        @endif
                                    @endif
                                </td>
                                <td class="py-3 px-4">
                                    @php
                                        $checkedCount = $b->tickets->where('is_checked_in', true)->count();
                                        $totalTickets = $b->tickets->count();
                                    @endphp
                                    @if($checkedCount === $totalTickets && $totalTickets > 0)
                                        <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                            All Checked In
                                        </span>
                                    @elseif($checkedCount > 0)
                                        <span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                            {{ $checkedCount }}/{{ $totalTickets }} In
                                        </span>
                                    @else
                                        <span class="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold text-[10px]">
                                            Pending
                                        </span>
                                    @endif
                                </td>
                                <td class="py-3 px-4 text-right">
                                    <form method="POST" action="{{ route('admin.bookings.destroy', $b->id) }}" onsubmit="return confirm('Cancel reservation #{{ $b->booking_reference }}? This will free up the reserved seats.');">
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
        @else
            <div class="py-8 text-center text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
                <p class="font-bold">No student reservations yet for this show.</p>
                <p class="text-[11px] text-gray-400 mt-0.5">Students can book seats through the mobile application.</p>
            </div>
        @endif

    </div>

</div>
@endsection
