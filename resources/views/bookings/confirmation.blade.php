<x-app-layout>
<div class="min-h-screen py-12 px-4 flex flex-col items-center justify-center bg-gray-50">
    
    <!-- Top Action Nav -->
    <div class="w-full max-w-md flex items-center justify-between mb-4 print:hidden">
        <a href="{{ route('events.index') }}" class="text-xs font-semibold text-maroon-800 hover:text-maroon-950 flex items-center gap-1.5 transition">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Shows
        </a>

        <div class="flex items-center gap-2">
            <button onclick="window.print()" class="px-3 py-1.5 bg-white hover:bg-gray-100 text-maroon-800 text-xs font-bold rounded-lg border border-gray-300 transition shadow-sm flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Stub
            </button>
        </div>
    </div>

    <!-- Digital Cinema Stub Card (Maroon & White) -->
    <div class="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-200 text-gray-900 transition-all">
        <!-- Header Strip -->
        <div class="bg-maroon-800 p-6 text-white text-center relative overflow-hidden">
            <div class="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div class="absolute -left-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>

            <span class="text-[11px] font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full inline-block backdrop-blur-sm">
                MSEUF University Theater Pass
            </span>
            <h2 class="text-2xl font-black mt-3 tracking-tight leading-tight">{{ $booking->event->title }}</h2>
            <p class="text-xs text-maroon-100 mt-1 font-medium">{{ $booking->event->venue }}</p>
            <p class="text-xs text-white font-bold mt-2 bg-black/20 py-1 px-3 rounded-full inline-block">
                {{ $booking->event->show_date->format('l, F d, Y') }} &bull; {{ $booking->event->show_date->format('h:i A') }}
            </p>
        </div>

        <!-- Dashed Ticket Cut-line with Cinema Notches -->
        <div class="relative border-b-2 border-dashed border-gray-300 my-1 bg-white">
            <div class="absolute -left-3 -top-3 w-6 h-6 bg-gray-50 rounded-full border-r border-gray-300"></div>
            <div class="absolute -right-3 -top-3 w-6 h-6 bg-gray-50 rounded-full border-l border-gray-300"></div>
        </div>

        <div class="p-6 sm:p-7 bg-white">
            <!-- Attendee & Reference Grid -->
            <div class="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-6 pb-4 border-b border-gray-100">
                <div>
                    <p class="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Attendee</p>
                    <p class="text-sm font-bold text-maroon-950 mt-0.5 truncate">{{ $booking->user->name }}</p>
                    <p class="text-[11px] text-gray-500 font-mono">{{ $booking->user->email }}</p>
                </div>
                <div>
                    <p class="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Booking Reference</p>
                    <p class="text-sm font-mono font-black text-maroon-800 mt-0.5">{{ $booking->booking_reference }}</p>
                    <p class="text-[11px] text-emerald-700 font-semibold uppercase flex items-center gap-1 mt-0.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Confirmed
                    </p>
                </div>
            </div>

            <!-- Reserved Seats Badges -->
            <div class="mb-6">
                <div class="flex items-center justify-between mb-2">
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-wider text-[10px]">Assigned Seats</p>
                    <span class="text-xs font-bold text-maroon-800">{{ $booking->total_seats }} {{ Str::plural('Seat', $booking->total_seats) }}</span>
                </div>
                
                <div class="flex flex-wrap gap-2">
                    @foreach($booking->tickets as $ticket)
                        <div class="px-3 py-1.5 rounded-xl text-sm font-extrabold flex items-center gap-2 border {{ $ticket->seat->tier === 'vip' ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-maroon-50 text-maroon-900 border-maroon-200' }}">
                            @if($ticket->seat->tier === 'vip')
                                <span class="text-xs text-amber-700 font-black">★ VIP</span>
                            @endif
                            <span>Row {{ $ticket->seat->row_label }} - Seat {{ $ticket->seat->seat_number }}</span>
                        </div>
                    @endforeach
                </div>
            </div>

            <!-- Total and Payment info -->
            <div class="mb-6 p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                <div>
                    <span class="text-gray-500 block text-[10px] font-bold uppercase">Payment Status</span>
                    <span class="font-black text-maroon-900 uppercase">{{ $booking->payment_status }}</span>
                    @if($booking->gcash_reference)
                        <span class="text-gray-500 font-mono text-[10px] block">Ref: {{ $booking->gcash_reference }}</span>
                    @endif
                </div>
                <div class="text-right">
                    <span class="text-gray-500 block text-[10px] font-bold uppercase">Total Amount</span>
                    <span class="font-black text-maroon-800 text-base">
                        {{ $booking->payment_status === 'free' ? 'FREE' : '₱' . number_format($booking->total_amount, 2) }}
                    </span>
                </div>
            </div>

            <!-- Master QR Token representation for this booking -->
            <div class="flex flex-col items-center justify-center p-5 bg-gray-50 rounded-2xl border border-gray-200">
                <div class="p-2.5 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center">
                    {!! App\Support\QrCode::size(150)->generate($booking->booking_reference) !!}
                </div>
                <span class="text-[11px] text-gray-600 mt-3 font-bold tracking-wide uppercase">
                    Scan at Theater Gate Entrance
                </span>
                <span class="text-[10px] text-gray-400 font-mono mt-0.5">
                    {{ $booking->booking_reference }}
                </span>
            </div>

            <div class="mt-6 text-center">
                <p class="text-[11px] text-gray-500 leading-relaxed">
                    Present this digital ticket stub on your mobile device or printout at the Manuel S. Enverga University Theater lobby entrance.
                </p>
            </div>
        </div>
    </div>
</div>
</x-app-layout>
