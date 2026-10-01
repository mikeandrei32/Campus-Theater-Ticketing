<x-app-layout>
<div class="py-10 bg-gray-50 text-gray-900 min-h-screen">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Hero Section (MSEUF Maroon & White) -->
        <div class="relative overflow-hidden rounded-3xl bg-maroon-800 text-white p-8 sm:p-12 mb-10 shadow-xl border border-maroon-900">
            <div class="absolute -right-16 -top-16 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div class="absolute -left-16 -bottom-16 w-80 h-80 bg-maroon-950/40 rounded-full blur-2xl pointer-events-none"></div>

            <div class="max-w-2xl relative z-10">
                <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 text-xs font-bold uppercase tracking-wider mb-4">
                    <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    MSEUF College Plays & Pageants
                </span>
                <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                    University Theater Ticketing
                </h1>
                <p class="mt-4 text-maroon-100 text-sm sm:text-base leading-relaxed">
                    Interactive cinema seating experience for Manuel S. Enverga University Foundation campus theater shows, coronation pageants, and drama festivals.
                </p>
                <div class="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-maroon-200">
                    <div class="flex items-center gap-1.5 bg-maroon-900/60 px-3 py-1.5 rounded-lg border border-maroon-700">
                        <span class="text-amber-400 font-bold">★</span> VIP Front Rows (A-B)
                    </div>
                    <div class="flex items-center gap-1.5 bg-maroon-900/60 px-3 py-1.5 rounded-lg border border-maroon-700">
                        <span class="text-white">&bull;</span> Regular Tiers (Rows C-F)
                    </div>
                    <div class="flex items-center gap-1.5 bg-maroon-900/60 px-3 py-1.5 rounded-lg border border-maroon-700">
                        <span class="text-amber-300">⚡</span> Real-Time Dynamic Selection
                    </div>
                </div>
            </div>
        </div>

        <!-- Section Title -->
        <div class="mb-6">
            <h2 class="text-2xl font-black text-maroon-950">Upcoming Campus Shows</h2>
            <p class="text-sm text-gray-600 mt-0.5">Select an event to view the auditorium seat map and reserve tickets</p>
        </div>

        <!-- Events Grid (White cards with Maroon accents) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            @forelse($events as $event)
                <div class="group bg-white rounded-3xl border border-gray-200 hover:border-maroon-400 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-sm">
                    <div>
                        <!-- Banner Image Container -->
                        <div class="h-56 w-full relative overflow-hidden bg-gray-100">
                            @if($event->banner_image)
                                <img src="{{ $event->banner_image }}" alt="{{ $event->title }}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                            @else
                                <div class="w-full h-full bg-maroon-900 flex items-center justify-center text-white">
                                    <span class="font-black text-xl tracking-wider">MSEUF THEATER</span>
                                </div>
                            @endif

                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"></div>

                            <!-- Date Badge -->
                            <div class="absolute top-4 left-4 bg-maroon-800 text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md border border-maroon-700">
                                <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                                {{ $event->show_date->format('M d, Y') }} &bull; {{ $event->show_date->format('h:i A') }}
                            </div>

                            <!-- Pricing Badge -->
                            <div class="absolute bottom-4 left-4">
                                @if($event->pricing_type === 'paid')
                                    <span class="inline-flex items-center gap-1.5 bg-amber-500 text-maroon-950 font-black text-xs px-3 py-1 rounded-full shadow-md">
                                        <span>PAID</span>
                                        <span class="text-maroon-900 font-bold">&bull; VIP ₱{{ number_format($event->vip_price, 0) }} / Reg ₱{{ number_format($event->regular_price, 0) }}</span>
                                    </span>
                                @else
                                    <span class="inline-flex items-center gap-1.5 bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-md">
                                        <span>FREE ADMISSION</span>
                                    </span>
                                @endif
                            </div>

                            <!-- Seats Remaining Badge -->
                            @php
                                $remainingSeats = max(0, $totalSeats - $event->booked_seats_count);
                            @endphp
                            <div class="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-gray-800 shadow-md">
                                <span class="{{ $remainingSeats < 15 ? 'text-maroon-700' : 'text-emerald-700' }}">{{ $remainingSeats }}</span> / {{ $totalSeats }} seats left
                            </div>
                        </div>

                        <!-- Card Content -->
                        <div class="p-6">
                            <h3 class="text-xl font-extrabold text-maroon-950 group-hover:text-maroon-700 transition-colors">
                                {{ $event->title }}
                            </h3>

                            <div class="mt-2.5 flex items-center gap-2 text-xs font-semibold text-gray-500">
                                <svg class="w-4 h-4 text-maroon-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{{ $event->venue }}</span>
                            </div>

                            <p class="mt-3 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                Collegiate performing arts and cultural showcase at Manuel S. Enverga University Foundation. Interactive theater seat assignment with real-time availability.
                            </p>
                        </div>
                    </div>

                    <!-- Footer Action -->
                    <div class="px-6 pb-6 pt-3 flex items-center justify-between border-t border-gray-100 bg-gray-50/50">
                        <div class="text-xs">
                            <span class="text-gray-500 block text-[11px] font-medium">Auditorium Tiers</span>
                            <span class="text-amber-700 font-bold">★ VIP</span>
                            <span class="text-gray-400">&bull;</span>
                            <span class="text-gray-700 font-semibold">Regular</span>
                        </div>

                        <a href="{{ route('theater.seats', $event->id) }}" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-maroon-800 hover:bg-maroon-700 text-white font-extrabold text-xs tracking-wider uppercase transition shadow-md hover:shadow-lg">
                            Select Seats
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                </div>
            @empty
                <div class="col-span-full py-16 text-center text-gray-500 bg-white rounded-3xl border border-gray-200">
                    <p class="text-lg font-semibold">No theater events scheduled right now.</p>
                </div>
            @endforelse
        </div>

    </div>
</div>
</x-app-layout>
