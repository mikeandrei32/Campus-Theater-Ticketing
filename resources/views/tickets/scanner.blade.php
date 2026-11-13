@extends('layouts.admin')

@section('content')
<div class="space-y-8" x-data="scannerComponent()">

    <!-- ========================================================================= -->
    <!-- 1. TOP HEADER & METRIC SUMMARY                                            -->
    <!-- ========================================================================= -->
    <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
            <div class="flex items-center gap-2 text-xs text-gray-500 font-bold mb-1">
                <a href="{{ route('admin.events.index') }}" class="hover:text-maroon-700">Shows & Plays</a>
                <span>›</span>
                <span class="text-maroon-700 font-extrabold">Gate Marshal Portal</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2.5">
                <span>Digital Ticket & Booking Scanner</span>
            </h1>
            <p class="text-xs text-gray-500 mt-1">
                Verify attendee admission by entering their <strong class="text-maroon-700">Booking Reference</strong> (e.g. <code>MSEUF-XXXXXX</code>) or scanning their <strong class="text-maroon-700">QR Token</strong>.
            </p>
        </div>

        <!-- Live Gate Stats -->
        <div class="flex items-center gap-2">
            <div class="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 shadow-sm">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Admitted: <span class="font-black text-sm" x-text="stats.admitted">{{ $stats['total_admitted'] ?? 0 }}</span></span>
            </div>
            <div class="px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-800 shadow-sm">
                <span>Pending: <span class="font-black text-sm" x-text="stats.pending">{{ $stats['pending_admission'] ?? 0 }}</span></span>
            </div>
        </div>
    </div>

    <!-- ========================================================================= -->
    <!-- 2. SCANNER / REFERENCE VERIFICATION CARD                                  -->
    <!-- ========================================================================= -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- Left Column: Input Form & Camera Scanner (7 cols) -->
        <div class="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm flex flex-col justify-between">
            
            <div>
                <!-- Mode Switch Tabs -->
                <div class="flex items-center gap-2 mb-6 p-1.5 bg-gray-100 rounded-2xl w-fit">
                    <button type="button" 
                            @click="mode = 'manual'; stopCamera()"
                            class="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2"
                            :class="mode === 'manual' ? 'bg-white text-maroon-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'">
                        <span>Booking Ref / Token Input</span>
                    </button>

                    <button type="button" 
                            @click="mode = 'camera'; startCamera()"
                            class="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2"
                            :class="mode === 'camera' ? 'bg-white text-maroon-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'">
                        <span>Live Camera QR Scanner</span>
                    </button>
                </div>

                <!-- Manual / Barcode Scanner Input Form -->
                <div x-show="mode === 'manual'">
                    <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">
                        Enter Booking Reference or QR Token
                    </label>

                    <div class="relative">
                        <input 
                            type="text" 
                            x-model="tokenInput"
                            x-ref="scannerInput"
                            @keydown.enter.prevent="submitToken()"
                            placeholder="e.g. MSEUF-XXXXXX or UUID token..."
                            class="w-full pl-4 pr-24 py-3.5 bg-gray-50 border-2 border-gray-300 focus:border-maroon-700 focus:bg-white rounded-2xl text-gray-900 font-mono text-base font-bold uppercase tracking-wider focus:outline-none transition shadow-inner"
                            autofocus
                        >

                        <div class="absolute right-2 top-2 flex items-center gap-1.5">
                            <button 
                                type="button" 
                                x-show="tokenInput"
                                @click="tokenInput = ''; $refs.scannerInput.focus()" 
                                class="p-2 text-gray-400 hover:text-gray-600 rounded-lg text-xs font-bold"
                                title="Clear">
                                &times;
                            </button>
                            <button 
                                type="button" 
                                @click="submitToken()" 
                                :disabled="loading || !tokenInput.trim()"
                                class="px-4 py-2 bg-maroon-700 hover:bg-maroon-800 disabled:opacity-40 text-white font-black rounded-xl transition text-xs shadow-md flex items-center gap-1.5">
                                <span x-show="!loading">Verify Pass</span>
                                <span x-show="loading" class="flex items-center gap-1">
                                    <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                    <span>Checking...</span>
                                </span>
                            </button>
                        </div>
                    </div>

                    <div class="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span class="flex items-center gap-1 text-[11px]">
                            <span class="text-maroon-700 font-bold">Tip:</span>
                            Accepts Master Booking Reference (all seats) or single-seat QR token.
                        </span>
                        <button type="button" 
                                @click="pasteClipboard()" 
                                class="text-[11px] font-bold text-maroon-700 hover:underline flex items-center gap-1">
                            <span>Paste</span>
                        </button>
                    </div>
                </div>

                <!-- Camera QR Scanner Container -->
                <div x-show="mode === 'camera'" x-cloak class="space-y-4">
                    <div class="relative bg-gray-900 rounded-2xl overflow-hidden min-h-[260px] flex items-center justify-center border-2 border-maroon-700">
                        <div id="qr-reader" class="w-full"></div>
                        <div x-show="!cameraActive" class="text-center p-6 text-white">
                            <p class="font-bold text-sm">Camera Offline</p>
                            <p class="text-xs text-gray-400 mt-1">Click the button below to start gate camera</p>
                        </div>
                    </div>

                    <div class="flex items-center justify-center gap-2">
                        <button type="button" 
                                @click="toggleCamera()" 
                                class="px-4 py-2 bg-maroon-700 hover:bg-maroon-800 text-white font-bold text-xs rounded-xl transition shadow">
                            <span x-text="cameraActive ? 'Stop Camera' : 'Start Camera Scanner'"></span>
                        </button>
                    </div>
                </div>

                <!-- Gate Marshal Guidelines -->
                <div class="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600">
                    <div class="p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <span class="font-bold text-gray-900 block mb-0.5">Verification Options</span>
                        <span>Marshals can scan the QR code or directly type/paste the 6-character booking reference code.</span>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <span class="font-bold text-gray-900 block mb-0.5">Double-Entry Protection</span>
                        <span>Already checked-in passes will trigger an amber alert to prevent pass sharing.</span>
                    </div>
                </div>
            </div>

            <!-- Quick Test Sample References (for testing / admin convenience) -->
            @if(isset($recentBookings) && $recentBookings->isNotEmpty())
                <div class="mt-6 pt-4 border-t border-gray-100">
                    <span class="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider block mb-2">
                        Quick-Select Active Reservation for Test:
                    </span>
                    <div class="flex flex-wrap gap-2">
                        @foreach($recentBookings as $b)
                            <button type="button" 
                                    @click="tokenInput = '{{ $b->booking_reference }}'; submitToken()"
                                    class="px-2.5 py-1 bg-gray-100 hover:bg-maroon-50 hover:text-maroon-700 hover:border-maroon-300 text-gray-700 rounded-lg text-[11px] font-mono font-bold border border-gray-200 transition flex items-center gap-1.5"
                                    title="Student: {{ $b->user?->name }} ({{ $b->total_seats }} seats)">
                                <span>{{ $b->booking_reference }}</span>
                                <span class="text-[10px] text-gray-400 font-sans font-normal">({{ $b->total_seats }} seats)</span>
                            </button>
                        @endforeach
                    </div>
                </div>
            @endif

        </div>

        <!-- Right Column: Verification Result Live Card (5 cols) -->
        <div class="lg:col-span-5 flex flex-col">
            
            <!-- Dynamic Result Card -->
            <div class="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm flex-1 flex flex-col justify-between">
                
                <div>
                    <div class="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                        <h3 class="text-xs font-black uppercase tracking-wider text-gray-500">
                            Verification Status Display
                        </h3>
                        <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                              :class="{
                                  'bg-emerald-100 text-emerald-800': result?.status === 'success',
                                  'bg-amber-100 text-amber-800': result?.status === 'warning',
                                  'bg-red-100 text-red-800': result?.status === 'error',
                                  'bg-gray-100 text-gray-500': !result
                              }"
                              x-text="result ? (result.status === 'success' ? 'VALID PASS' : (result.status === 'warning' ? 'DUPLICATE / USED' : 'INVALID')) : 'IDLE'">
                        </span>
                    </div>

                    <!-- Idle / Waiting State -->
                    <template x-if="!result && !loading">
                        <div class="py-12 text-center text-gray-400">
                            <div class="w-16 h-16 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-3 text-xs font-black">
                                SCAN
                            </div>
                            <h4 class="font-bold text-gray-700 text-sm">Ready to Verify Pass</h4>
                            <p class="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                                Enter an attendee's booking reference or scan their QR token to view admission details.
                            </p>
                        </div>
                    </template>

                    <!-- Loading State -->
                    <template x-if="loading">
                        <div class="py-12 text-center text-gray-500">
                            <div class="w-12 h-12 border-4 border-maroon-200 border-t-maroon-700 rounded-full animate-spin mx-auto mb-3"></div>
                            <p class="text-xs font-bold text-gray-700">Verifying in database...</p>
                        </div>
                    </template>

                    <!-- Active Result State -->
                    <template x-if="result && !loading">
                        <div class="space-y-4">
                            
                            <!-- Status Banner -->
                            <div class="p-4 rounded-2xl border transition-all"
                                 :class="{
                                     'bg-emerald-50 border-emerald-300 text-emerald-950': result.status === 'success',
                                     'bg-amber-50 border-amber-300 text-amber-950': result.status === 'warning',
                                     'bg-red-50 border-red-300 text-red-950': result.status === 'error'
                                 }">
                                <div class="flex items-start gap-3">
                                    <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-lg"
                                         :class="{
                                             'bg-emerald-200 text-emerald-900': result.status === 'success',
                                             'bg-amber-200 text-amber-900': result.status === 'warning',
                                             'bg-red-200 text-red-900': result.status === 'error'
                                         }">
                                        <span x-text="result.status === 'success' ? '✓' : (result.status === 'warning' ? '!' : '✕')"></span>
                                    </div>

                                    <div>
                                        <h4 class="font-black text-sm uppercase tracking-wide" 
                                            x-text="result.status === 'success' ? 'Admission Granted' : (result.status === 'warning' ? 'Pass Already Admitted' : 'Invalid Admission Code')"></h4>
                                        <p class="text-xs mt-0.5" x-text="result.message"></p>
                                    </div>
                                </div>
                            </div>

                            <!-- Attendee & Show Details (if verified or warned) -->
                            <template x-if="result.attendee">
                                <div class="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
                                    
                                    <!-- Attendee & Ref -->
                                    <div class="flex items-start justify-between gap-2 pb-3 border-b border-gray-200">
                                        <div>
                                            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Attendee</span>
                                            <span class="font-black text-sm text-gray-900" x-text="result.attendee"></span>
                                            <span class="text-[11px] text-gray-500 block font-mono" x-text="result.attendee_email"></span>
                                        </div>

                                        <div class="text-right">
                                            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Reference Code</span>
                                            <span class="font-mono font-black text-sm text-maroon-700" x-text="result.booking_reference"></span>
                                            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5"
                                                  :class="result.payment_status === 'free' ? 'bg-emerald-100 text-emerald-800' : 'bg-maroon-100 text-maroon-800'"
                                                  x-text="result.payment_status === 'free' ? 'FREE PASS' : 'PAID (GCASH)'"></span>
                                        </div>
                                    </div>

                                    <!-- Event Title & Venue -->
                                    <template x-if="result.event_title">
                                        <div>
                                            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Campus Show</span>
                                            <span class="font-extrabold text-xs text-gray-900" x-text="result.event_title"></span>
                                            <span class="text-[11px] text-gray-500 block" x-text="result.event_venue + ' • ' + (result.event_date || '')"></span>
                                        </div>
                                    </template>

                                    <!-- Seats Badges -->
                                    <div>
                                        <div class="flex items-center justify-between mb-1.5">
                                            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                Reserved Seats (<span x-text="result.total_seats || 1"></span>)
                                            </span>
                                            <span class="text-[10px] font-bold text-maroon-700" x-text="result.verification_type === 'booking_reference' ? 'All Seats in Booking' : 'Single Seat Pass'"></span>
                                        </div>

                                        <div class="flex flex-wrap gap-1.5">
                                            <template x-for="(s, idx) in (result.seats_list || [])" :key="idx">
                                                <div class="px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border"
                                                     :class="s.is_vip ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-maroon-50 text-maroon-900 border-maroon-200'">
                                                    <template x-if="s.is_vip">
                                                        <span class="text-[10px] text-amber-700 font-black">★ VIP</span>
                                                    </template>
                                                    <span x-text="s.seat_code"></span>
                                                </div>
                                            </template>
                                        </div>
                                    </div>

                                    <!-- Check-in Time Stamp -->
                                    <div class="pt-2 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
                                        <span>Verified Time:</span>
                                        <span class="font-bold text-gray-800" x-text="result.checked_in_at || 'Just now'"></span>
                                    </div>

                                </div>
                            </template>

                        </div>
                    </template>
                </div>

                <!-- Footer Action Buttons -->
                <div class="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <button type="button" 
                            @click="resetResult()" 
                            x-show="result"
                            class="text-xs text-gray-500 hover:text-gray-900 font-bold">
                        Clear & Ready Next
                    </button>
                    <div class="text-[11px] text-gray-400">
                        Session admissions: <strong class="text-maroon-700" x-text="history.length">0</strong>
                    </div>
                </div>

            </div>

        </div>

    </div>

    <!-- ========================================================================= -->
    <!-- 3. LIVE SESSION GATE ADMISSIONS LOG                                       -->
    <!-- ========================================================================= -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm" x-show="history.length > 0" x-cloak>
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-black text-gray-900 flex items-center gap-2">
                <span>Recent Gate Admissions (This Session)</span>
            </h3>
            <button type="button" @click="history = []" class="text-xs text-gray-400 hover:text-gray-600 font-bold">
                Clear Session Log
            </button>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-gray-600">
                <thead class="bg-gray-50 text-[11px] font-black text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                        <th class="py-2.5 px-3">Time</th>
                        <th class="py-2.5 px-3">Booking Reference</th>
                        <th class="py-2.5 px-3">Attendee</th>
                        <th class="py-2.5 px-3">Seats</th>
                        <th class="py-2.5 px-3">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 font-medium">
                    <template x-for="(item, idx) in history" :key="idx">
                        <tr class="hover:bg-gray-50">
                            <td class="py-2.5 px-3 text-gray-400 font-mono text-[11px]" x-text="item.time"></td>
                            <td class="py-2.5 px-3 font-mono font-bold text-maroon-700" x-text="item.reference"></td>
                            <td class="py-2.5 px-3 font-bold text-gray-900" x-text="item.attendee"></td>
                            <td class="py-2.5 px-3" x-text="item.seats"></td>
                            <td class="py-2.5 px-3">
                                <span class="px-2 py-0.5 rounded-full font-bold text-[10px]"
                                      :class="item.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                                      x-text="item.status === 'success' ? 'Admitted' : 'Already Admitted'">
                                </span>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>
    </div>

</div>

<!-- HTML5-QRCode Library for Web Camera Scanning -->
<script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>

<script>
function scannerComponent() {
    return {
        mode: 'manual', // 'manual' or 'camera'
        tokenInput: '',
        loading: false,
        result: null,
        cameraActive: false,
        html5QrCode: null,
        history: [],
        stats: {
            admitted: {{ $stats['total_admitted'] ?? 0 }},
            pending: {{ $stats['pending_admission'] ?? 0 }}
        },

        async submitToken() {
            const rawToken = this.tokenInput.trim();
            if (!rawToken) return;

            this.loading = true;
            this.result = null;

            try {
                const response = await fetch("{{ route('marshal.validate') }}", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ token: rawToken })
                });

                const data = await response.json();
                this.result = data;

                if (data.status === 'success') {
                    // Update stats
                    const admittedNow = data.admitted_count || 1;
                    this.stats.admitted += admittedNow;
                    this.stats.pending = Math.max(0, this.stats.pending - admittedNow);

                    // Push to session history
                    this.history.unshift({
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        reference: data.booking_reference || rawToken,
                        attendee: data.attendee || 'Attendee',
                        seats: data.seat || 'Reserved Seat',
                        status: 'success'
                    });

                    // Clear input and refocus
                    this.tokenInput = '';
                    if (this.$refs.scannerInput) {
                        this.$refs.scannerInput.focus();
                    }
                } else if (data.status === 'warning' && data.attendee) {
                    this.history.unshift({
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        reference: data.booking_reference || rawToken,
                        attendee: data.attendee || 'Attendee',
                        seats: data.seat || 'Reserved Seat',
                        status: 'warning'
                    });
                }
            } catch (e) {
                this.result = {
                    status: 'error',
                    message: 'Network or server error while validating ticket code.'
                };
            } finally {
                this.loading = false;
            }
        },

        resetResult() {
            this.result = null;
            this.tokenInput = '';
            if (this.$refs.scannerInput) {
                this.$refs.scannerInput.focus();
            }
        },

        async pasteClipboard() {
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    this.tokenInput = text.trim();
                    this.submitToken();
                }
            } catch (err) {
                console.warn('Clipboard read error', err);
            }
        },

        startCamera() {
            if (this.cameraActive) return;
            this.cameraActive = true;

            this.$nextTick(() => {
                if (typeof Html5Qrcode === 'undefined') {
                    console.error('Html5Qrcode not loaded');
                    return;
                }

                if (!this.html5QrCode) {
                    this.html5QrCode = new Html5Qrcode("qr-reader");
                }

                this.html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    (decodedText) => {
                        console.log("Scanned text:", decodedText);
                        this.tokenInput = decodedText;
                        this.submitToken();
                    },
                    (errorMessage) => {
                        // ignore scan frame errors
                    }
                ).catch((err) => {
                    console.error("Camera start failed:", err);
                    this.cameraActive = false;
                });
            });
        },

        stopCamera() {
            if (this.html5QrCode && this.cameraActive) {
                this.html5QrCode.stop().then(() => {
                    this.cameraActive = false;
                }).catch(err => console.error(err));
            }
        },

        toggleCamera() {
            if (this.cameraActive) {
                this.stopCamera();
            } else {
                this.startCamera();
            }
        }
    }
}
</script>
@endsection
