@extends('layouts.admin')

@section('content')
<div class="space-y-8">

    <!-- ========================================================================= -->
    <!-- 1. HERO & KPI STATS OVERVIEW                                              -->
    <!-- ========================================================================= -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-maroon-900 via-maroon-700 to-maroon-900 text-white p-6 sm:p-8 shadow-xl border border-maroon-800">
        <div class="absolute -right-16 -top-16 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div class="absolute -left-16 -bottom-16 w-72 h-72 bg-maroon-950/50 rounded-full blur-2xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
                <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 text-xs font-bold uppercase tracking-wider mb-3">
                    <span class="w-2 h-2 rounded-full bg-vipGold animate-pulse"></span>
                    MSEUF Admin Dashboard
                </span>
                <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight">
                    Campus Theater & Cinema Publisher
                </h1>
                <p class="mt-2 text-maroon-100 text-xs sm:text-sm max-w-xl leading-relaxed">
                    Post and manage campus plays, cinema screenings, and drama events. Students can browse these shows and reserve seats directly in the mobile app.
                </p>
            </div>

            <!-- Quick Action: Post New Show -->
            @if(auth()->user()?->canManageTheater())
                <div class="shrink-0">
                    <a href="{{ route('admin.events.create') }}" 
                       class="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-vipGold hover:bg-amber-400 text-maroon-950 font-black text-sm tracking-wide shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                        <span>+ Post New Play / Cine</span>
                    </a>
                </div>
            @endif
        </div>

        <!-- Metric KPI Cards (Clean, beginner-friendly analytics) -->
        <div class="mt-6 pt-6 border-t border-white/15 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- 1. Total Shows -->
            <div class="bg-black/20 rounded-2xl p-4 border border-white/10">
                <div class="text-[11px] font-bold text-maroon-200 uppercase tracking-wider">Total Shows</div>
                <div class="text-2xl sm:text-3xl font-black text-white mt-1">{{ $totalEventsCount }}</div>
                <div class="text-[10px] text-maroon-200 mt-0.5">Plays & Cinema Movies</div>
            </div>

            <!-- 2. Total Student Reservations -->
            <div class="bg-black/20 rounded-2xl p-4 border border-white/10">
                <div class="text-[11px] font-bold text-maroon-200 uppercase tracking-wider">Reservations</div>
                <div class="text-2xl sm:text-3xl font-black text-white mt-1">{{ $totalBookingsCount }}</div>
                <div class="text-[10px] text-maroon-200 mt-0.5">Student booking orders</div>
            </div>

            <!-- 3. Seats Reserved -->
            <div class="bg-black/20 rounded-2xl p-4 border border-white/10">
                <div class="text-[11px] font-bold text-maroon-200 uppercase tracking-wider">Seats Occupied</div>
                <div class="text-2xl sm:text-3xl font-black text-vipGold mt-1">{{ $totalSeatsReservedCount }}</div>
                <div class="text-[10px] text-maroon-200 mt-0.5">Across all showtimes</div>
            </div>

            <!-- 4. Total GCash Revenue -->
            <div class="bg-black/20 rounded-2xl p-4 border border-white/10">
                <div class="text-[11px] font-bold text-maroon-200 uppercase tracking-wider">Total Revenue</div>
                <div class="text-2xl sm:text-3xl font-black text-emerald-300 mt-1">₱{{ number_format($totalRevenue, 2) }}</div>
                <div class="text-[10px] text-maroon-200 mt-0.5">Paid Ticket Sales</div>
            </div>
        </div>
    </div>

    <!-- ========================================================================= -->
    <!-- 2. SEARCH & FILTER TABS (Identical to Mobile App Filter Chips)             -->
    <!-- ========================================================================= -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <!-- Filter Tabs -->
        <div class="flex items-center gap-2 flex-wrap">
            <a href="{{ route('admin.events.index', ['filter' => 'all', 'search' => $searchQuery]) }}"
               class="px-4 py-2 rounded-full text-xs font-extrabold transition border {{ $currentFilter === 'all' ? 'bg-maroon-700 text-white border-maroon-700 shadow-sm' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' }}">
                All Shows ({{ $events->count() }})
            </a>

            <a href="{{ route('admin.events.index', ['filter' => 'paid', 'search' => $searchQuery]) }}"
               class="px-4 py-2 rounded-full text-xs font-extrabold transition border {{ $currentFilter === 'paid' ? 'bg-maroon-700 text-white border-maroon-700 shadow-sm' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' }}">
                ★ VIP & Paid Shows
            </a>

            <a href="{{ route('admin.events.index', ['filter' => 'free', 'search' => $searchQuery]) }}"
               class="px-4 py-2 rounded-full text-xs font-extrabold transition border {{ $currentFilter === 'free' ? 'bg-maroon-700 text-white border-maroon-700 shadow-sm' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' }}">
                Free Admission
            </a>
        </div>

        <!-- Search Bar -->
        <form method="GET" action="{{ route('admin.events.index') }}" class="flex items-center gap-2">
            <input type="hidden" name="filter" value="{{ $currentFilter }}">
            <div class="relative w-full md:w-64">
                <input type="text" 
                       name="search" 
                       value="{{ $searchQuery }}" 
                       placeholder="Search title or venue..." 
                       class="w-full px-4 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-maroon-700 focus:outline-none">
            </div>
            <button type="submit" class="px-4 py-2 bg-maroon-700 hover:bg-maroon-800 text-white font-bold text-xs rounded-xl transition">
                Search
            </button>
            @if($searchQuery)
                <a href="{{ route('admin.events.index', ['filter' => $currentFilter]) }}" class="text-xs text-gray-500 hover:text-gray-800 font-bold">
                    Clear
                </a>
            @endif
        </form>
    </div>

    <!-- ========================================================================= -->
    <!-- 3. SHOWS CARDS GRID (Styled to match Mobile App Cards)                    -->
    <!-- ========================================================================= -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        @forelse($events as $event)
            @php
                $isFree = $event->pricing_type === 'free';
                $booked = $event->booked_seats_count ?? 0;
                $available = max(0, $totalSeats - $booked);
                $percent = min(100, round(($booked / $totalSeats) * 100));
            @endphp

            <div class="group bg-white rounded-3xl border border-gray-200 hover:border-maroon-400 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-sm">
                <div>
                    <!-- Banner Image Container with Badges -->
                    <div class="h-48 sm:h-56 w-full relative overflow-hidden bg-gray-900">
                        @if($event->banner_image)
                            <img src="{{ $event->banner_image }}" 
                                 alt="{{ $event->title }}" 
                                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        @else
                            <div class="w-full h-full bg-maroon-900 flex items-center justify-center text-white">
                                <span class="font-black text-xl tracking-wider">MSEUF THEATER</span>
                            </div>
                        @endif

                        <!-- Gradient Overlay -->
                        <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>

                        <!-- Top Left: Date Badge -->
                        <div class="absolute top-4 left-4 bg-maroon-700/95 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-md border border-maroon-500">
                            <span class="w-2 h-2 rounded-full bg-vipGold"></span>
                            <span>{{ $event->show_date ? $event->show_date->format('M d, Y • h:i A') : 'TBA' }}</span>
                        </div>

                        <!-- Top Right: Capacity Badge -->
                        <div class="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-gray-800 shadow-md">
                            <span class="{{ $available < 15 ? 'text-maroon-700' : 'text-emerald-700' }} font-black">{{ $available }}</span> / {{ $totalSeats }} open
                        </div>

                        <!-- Bottom Left: Pricing Badge (Emerald for Free, Maroon & Gold for Paid) -->
                        <div class="absolute bottom-4 left-4">
                            @if($isFree)
                                <span class="inline-flex items-center gap-1.5 bg-emerald-600 text-white font-black text-xs px-3.5 py-1 rounded-full shadow-md">
                                    <span>FREE ADMISSION</span>
                                </span>
                            @else
                                <span class="inline-flex items-center gap-1.5 bg-maroon-700 text-white border border-vipGold font-black text-xs px-3.5 py-1 rounded-full shadow-md">
                                    <span class="text-vipGold">★ VIP ₱{{ number_format($event->vip_price, 0) }}</span>
                                    <span class="text-white/60">&bull;</span>
                                    <span>REG ₱{{ number_format($event->regular_price, 0) }}</span>
                                </span>
                            @endif
                        </div>
                    </div>

                    <!-- Card Body -->
                    <div class="p-6">
                        <h3 class="text-xl font-black text-gray-900 group-hover:text-maroon-700 transition-colors leading-tight">
                            {{ $event->title }}
                        </h3>

                        <!-- Venue -->
                        <div class="mt-2.5 flex items-center gap-2 text-xs font-semibold text-gray-600">
                            <span class="text-maroon-700 font-bold">Venue:</span>
                            <span>{{ $event->venue }}</span>
                        </div>

                        <!-- Auditorium Seat Progress Bar (Matches Mobile App) -->
                        <div class="mt-4 pt-4 border-t border-gray-100">
                            <div class="flex items-center justify-between text-xs mb-1.5">
                                <span class="font-bold text-gray-500">Auditorium Seat Occupancy</span>
                                <span class="font-extrabold text-maroon-700">{{ $booked }} booked ({{ $percent }}%)</span>
                            </div>
                            <div class="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div class="h-full bg-maroon-700 rounded-full transition-all duration-500" style="width: {{ $percent }}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Admin Actions Footer -->
                <div class="px-6 py-4 border-t border-gray-100 bg-[#F8FAFC] flex items-center justify-between gap-2">
                    
                    <!-- Left: Quick link to edit or delete -->
                    <div class="flex items-center gap-2">
                        @if(auth()->user()?->canManageTheater())
                            <a href="{{ route('admin.events.edit', $event->id) }}" 
                               class="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition flex items-center gap-1">
                                <span>Edit</span>
                            </a>

                            <!-- Delete Button with confirmation modal -->
                            <form method="POST" action="{{ route('admin.events.destroy', $event->id) }}" onsubmit="return confirm('Are you sure you want to delete \'{{ addslashes($event->title) }}\'? This will also cancel all reservations for this show.');">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs transition flex items-center gap-1">
                                    <span>Delete</span>
                                </button>
                            </form>
                        @endif
                    </div>

                    <!-- Right: Reserve Seats & Manage Seat Map CTAs -->
                    <div class="flex items-center gap-2">
                        <a href="{{ route('theater.seats', $event->id) }}"
                           class="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-maroon-50 hover:bg-maroon-100 text-maroon-800 border border-maroon-200 font-extrabold text-xs tracking-wide transition">
                            <span>Book</span>
                        </a>
                        <a href="{{ route('admin.events.show', $event->id) }}" 
                           class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-extrabold text-xs tracking-wider uppercase transition shadow-md hover:shadow-lg">
                            <span>Manage & Seats</span>
                            <span>›</span>
                        </a>
                    </div>
                </div>
            </div>
        @empty
            <div class="col-span-full py-16 text-center bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                <h3 class="text-lg font-black text-gray-800">No Shows or Plays Found</h3>
                <p class="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    @if($searchQuery || $currentFilter !== 'all')
                        No campus plays match your search or filter. Try clearing the search.
                    @else
                        No campus theater shows have been posted yet. Click the button below to publish your first show!
                    @endif
                </p>
                <div class="mt-6">
                    <a href="{{ route('admin.events.create') }}" class="px-6 py-3 bg-maroon-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-maroon-800 transition">
                        + Post Your First Show
                    </a>
                </div>
            </div>
        @endforelse
    </div>

</div>
@endsection
