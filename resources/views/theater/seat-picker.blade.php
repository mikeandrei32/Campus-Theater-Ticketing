<x-app-layout>
<div class="py-10 bg-gray-50 text-gray-900 min-h-screen" x-data="cinemaPicker({{ $event->pricing_type === 'paid' ? 'true' : 'false' }}, {{ (float)$event->vip_price }}, {{ (float)$event->regular_price }})">
    <div class="max-w-4xl mx-auto px-4">
        
        <!-- Breadcrumb / Back Navigation -->
        <div class="mb-6 flex items-center justify-between">
            <a href="{{ route('events.index') }}" class="inline-flex items-center gap-2 text-sm font-semibold text-maroon-800 hover:text-maroon-950 transition">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to All Shows
            </a>

            <div class="flex items-center gap-2">
                <span class="text-xs px-3 py-1 bg-white text-gray-700 font-semibold rounded-full border border-gray-200 shadow-sm">
                    Max 4 seats per student
                </span>
            </div>
        </div>

        <!-- Flash Notifications -->
        @if(session('error'))
            <div class="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center gap-3">
                <svg class="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ session('error') }}</span>
            </div>
        @endif

        @if(session('success'))
            <div class="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3">
                <svg class="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ session('success') }}</span>
            </div>
        @endif

        <!-- Header -->
        <div class="text-center mb-6">
            <span class="text-xs font-bold uppercase tracking-wider text-maroon-800 bg-maroon-100 px-3 py-1 rounded-full border border-maroon-200">
                Theater Seating Layout
            </span>
            <h1 class="text-3xl sm:text-4xl font-black text-maroon-950 tracking-tight mt-2">{{ $event->title }}</h1>
            <p class="text-gray-600 mt-1 flex flex-wrap items-center justify-center gap-2 text-sm font-medium">
                <span class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-maroon-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{{ $event->venue }}</span>
                </span>
                <span class="text-gray-400">&bull;</span>
                <span class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-maroon-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{{ $event->show_date->format('M d, Y') }} &bull; {{ $event->show_date->format('h:i A') }}</span>
                </span>
                <span class="text-gray-400">&bull;</span>
                @if($event->pricing_type === 'paid')
                    <span class="text-amber-800 font-bold bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 text-xs">
                        VIP: ₱{{ number_format($event->vip_price, 2) }} | Regular: ₱{{ number_format($event->regular_price, 2) }}
                    </span>
                @else
                    <span class="text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 text-xs">
                        Free Admission
                    </span>
                @endif
            </p>
        </div>

        <!-- Cinema Screen Graphic (Maroon & White) -->
        <div class="relative flex flex-col items-center my-8">
            <div class="w-3/4 sm:w-2/3 h-3.5 bg-gradient-to-r from-maroon-950 via-maroon-700 to-maroon-950 rounded-full shadow-[0_4px_20px_rgba(128,0,0,0.4)]"></div>
            <div class="w-5/6 h-8 bg-gradient-to-b from-maroon-800/10 to-transparent blur-sm rounded-t-[100px] -mt-1 pointer-events-none"></div>
            <span class="text-xs uppercase tracking-widest text-maroon-900 font-extrabold mt-2 flex items-center gap-2">
                <svg class="w-4 h-4 text-maroon-800" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                </svg>
                STAGE / SCREEN
            </span>
        </div>

        <!-- Legend (Maroon & White) -->
        <div class="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-xs text-gray-700 mb-8 bg-white py-3.5 px-6 rounded-2xl border border-gray-200 shadow-sm w-fit mx-auto font-medium">
            <div class="flex items-center gap-2">
                <span class="w-4 h-4 bg-white border-2 border-gray-300 rounded-t-md"></span>
                <span>Available</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="w-4 h-4 bg-amber-400 border border-amber-500 rounded-t-md"></span>
                <span class="font-bold text-amber-900">VIP (Rows A-B)</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="w-4 h-4 bg-maroon-800 rounded-t-md shadow-sm"></span>
                <span class="font-bold text-maroon-800">Selected</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="w-4 h-4 bg-gray-200 border border-gray-300 rounded-t-md opacity-60"></span>
                <span class="text-gray-400">Sold / Occupied</span>
            </div>
        </div>

        <!-- Seating Grid (White card with crisp borders) -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-md flex flex-col items-center gap-3 overflow-x-auto">
            @foreach($groupedSeats as $rowLabel => $seats)
                <div class="flex items-center gap-2 sm:gap-3">
                    <span class="w-6 text-center text-sm font-black text-maroon-900 select-none">{{ $rowLabel }}</span>

                    <div class="flex gap-1.5 sm:gap-2">
                        @foreach($seats as $seat)
                            @php
                                $isOccupied = in_array($seat->id, $occupiedSeatIds);
                            @endphp

                            <button
                                type="button"
                                @disabled($isOccupied)
                                @click="toggleSeat({{ $seat->id }}, '{{ $seat->row_label }}-{{ str_pad($seat->seat_number, 2, '0', STR_PAD_LEFT) }}', '{{ $seat->tier }}')"
                                :class="{
                                    'bg-maroon-800 text-white scale-110 shadow-lg shadow-maroon-900/40 ring-2 ring-maroon-400': isSelected({{ $seat->id }}),
                                    'bg-amber-400 hover:bg-amber-300 text-maroon-950 font-black border border-amber-500': !isSelected({{ $seat->id }}) && '{{ $seat->tier }}' === 'vip' && !{{ $isOccupied ? 'true' : 'false' }},
                                    'bg-white hover:bg-maroon-50 text-gray-800 border-2 border-gray-300 hover:border-maroon-600': !isSelected({{ $seat->id }}) && '{{ $seat->tier }}' === 'regular' && !{{ $isOccupied ? 'true' : 'false' }},
                                    'bg-gray-200 border border-gray-300 text-gray-400 cursor-not-allowed opacity-50': {{ $isOccupied ? 'true' : 'false' }}
                                }"
                                class="w-7 h-7 sm:w-8 sm:h-8 rounded-t-md text-xs font-bold transition flex items-center justify-center select-none"
                                title="Row {{ $seat->row_label }} Seat {{ $seat->seat_number }} ({{ strtoupper($seat->tier) }})">
                                {{ $seat->seat_number }}
                            </button>
                        @endforeach
                    </div>

                    <span class="w-6 text-center text-sm font-black text-maroon-900 select-none">{{ $rowLabel }}</span>
                </div>
            @endforeach
        </div>

        <!-- Cinema Summary Dock / Selection Drawer -->
        <div class="mt-8 bg-white p-6 rounded-3xl border border-gray-200 shadow-md">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div class="flex-1 w-full">
                    <div class="flex items-center justify-between mb-1">
                        <p class="text-sm font-bold text-gray-800">
                            Selected Seats (<span x-text="selectedSeats.length" class="text-maroon-800 font-black"></span>/4 max):
                        </p>
                        <span class="text-xs text-gray-500 font-semibold" x-show="selectedSeats.length > 0">
                            <span x-text="vipCount()" class="text-amber-600 font-bold"></span> VIP, 
                            <span x-text="regularCount()" class="text-gray-700 font-bold"></span> Regular
                        </span>
                    </div>
                    
                    <!-- Seat Chips -->
                    <div class="flex gap-2 mt-2 flex-wrap min-h-[36px] items-center">
                        <template x-if="selectedSeats.length === 0">
                            <span class="text-xs text-gray-400 italic">Click any available seat above to select it (limit 4 per student).</span>
                        </template>
                        <template x-for="seat in selectedSeats" :key="seat.id">
                            <span class="px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition"
                                  :class="seat.tier === 'vip' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-maroon-50 text-maroon-800 border-maroon-200'">
                                <span x-text="seat.tier === 'vip' ? '★ ' + seat.name : seat.name"></span>
                                <button type="button" @click="removeSeat(seat.id)" class="text-gray-400 hover:text-maroon-800 ml-1 font-bold">&times;</button>
                            </span>
                        </template>
                    </div>

                    <!-- Cost Breakdown Display -->
                    <div class="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs font-semibold">
                        <span class="text-gray-500">Estimated Total:</span>
                        <template x-if="isPaid">
                            <span class="text-maroon-900 font-black text-sm" x-text="formatCurrency(computedTotal())"></span>
                        </template>
                        <template x-if="!isPaid">
                            <span class="text-emerald-700 font-bold text-sm">FREE ADMISSION (₱0.00)</span>
                        </template>
                    </div>
                </div>

                <!-- Action Button & Summary Modal Trigger -->
                <div class="w-full md:w-auto flex items-center gap-3">
                    <button 
                        type="button" 
                        @click="showSummaryModal = true"
                        :disabled="selectedSeats.length === 0"
                        class="w-full md:w-auto px-7 py-3 bg-maroon-800 hover:bg-maroon-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 whitespace-nowrap">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Reserve Selected Seats
                    </button>
                </div>
            </div>
        </div>

        <!-- Reservation Confirmation & Checkout Modal (Pure MVC form submission) -->
        <div x-show="showSummaryModal" x-cloak class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div @click.away="showSummaryModal = false" class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-maroon-100 text-left">
                <div class="w-14 h-14 rounded-2xl bg-maroon-100 text-maroon-800 flex items-center justify-center mx-auto mb-4">
                    <svg class="w-7 h-7 text-maroon-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                </div>

                <div class="text-center mb-4">
                    <h3 class="text-xl font-black text-maroon-950">Confirm Reservation</h3>
                    <p class="text-xs text-gray-500 mt-0.5">{{ $event->title }}</p>
                </div>

                <form method="POST" action="{{ route('theater.book', $event->id) }}">
                    @csrf

                    <!-- Hidden Inputs for Selected Seats -->
                    <template x-for="seat in selectedSeats" :key="seat.id">
                        <input type="hidden" name="seat_ids[]" :value="seat.id">
                    </template>

                    <div class="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-left mb-4">
                        <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Reserved Seats:</p>
                        <div class="flex flex-wrap gap-1.5 mt-2">
                            <template x-for="seat in selectedSeats" :key="seat.id">
                                <span class="px-2.5 py-1 text-xs font-black rounded-lg border bg-white border-gray-300 text-maroon-900" x-text="seat.name"></span>
                            </template>
                        </div>

                        <div class="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                            <p><span class="font-bold text-gray-700">Venue:</span> {{ $event->venue }}</p>
                            <p><span class="font-bold text-gray-700">Schedule:</span> {{ $event->show_date->format('M d, Y - h:i A') }}</p>
                            <p><span class="font-bold text-gray-700">Total Price:</span> 
                                <span class="font-extrabold text-maroon-900" x-text="isPaid ? formatCurrency(computedTotal()) : 'FREE (₱0.00)'"></span>
                            </p>
                        </div>
                    </div>

                    <div class="space-y-3 mb-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">Student Full Name</label>
                            <input type="text" name="student_name" placeholder="e.g., Juan Dela Cruz" class="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500">
                        </div>

                        <template x-if="isPaid">
                            <div>
                                <label class="block text-xs font-bold text-gray-700 mb-1">GCash Reference No.</label>
                                <input type="text" name="gcash_reference" placeholder="e.g., 1029384756" :required="isPaid" class="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500">
                            </div>
                        </template>
                    </div>

                    <div class="flex gap-3">
                        <button type="submit" class="flex-1 py-3 bg-maroon-800 hover:bg-maroon-700 text-white font-extrabold text-xs rounded-xl transition shadow-md">
                            Confirm & Generate Stub
                        </button>
                        <button type="button" @click="showSummaryModal = false" class="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>

    </div>
</div>

<script>
function cinemaPicker(isPaid, vipPrice, regularPrice) {
    return {
        isPaid: isPaid,
        vipPrice: vipPrice || 0,
        regularPrice: regularPrice || 0,
        selectedSeats: [],
        showSummaryModal: false,
        toggleSeat(id, name, tier) {
            const index = this.selectedSeats.findIndex(s => s.id === id);
            if (index !== -1) {
                this.selectedSeats.splice(index, 1);
            } else {
                if (this.selectedSeats.length >= 4) {
                    alert('You can only select up to 4 seats per student.');
                    return;
                }
                this.selectedSeats.push({ id, name, tier });
            }
        },
        removeSeat(id) {
            this.selectedSeats = this.selectedSeats.filter(s => s.id !== id);
        },
        isSelected(id) {
            return this.selectedSeats.some(s => s.id === id);
        },
        vipCount() {
            return this.selectedSeats.filter(s => s.tier === 'vip').length;
        },
        regularCount() {
            return this.selectedSeats.filter(s => s.tier === 'regular').length;
        },
        computedTotal() {
            if (!this.isPaid) return 0;
            return (this.vipCount() * this.vipPrice) + (this.regularCount() * this.regularPrice);
        },
        formatCurrency(amount) {
            return '₱' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    }
}
</script>
</x-app-layout>
