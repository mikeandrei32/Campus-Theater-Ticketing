<x-app-layout>
<div class="py-12 bg-gray-50 text-gray-900 min-h-screen">
    <div class="max-w-2xl mx-auto px-4 sm:px-6">
        
        <div class="text-center mb-8">
            <span class="text-xs font-bold uppercase tracking-wider text-maroon-800 bg-maroon-100 px-3 py-1 rounded-full border border-maroon-200">
                Marshal Portal &bull; Gate Verification
            </span>
            <h1 class="text-3xl font-black text-maroon-950 mt-2">Digital Ticket Scanner</h1>
            <p class="text-gray-600 text-sm mt-1">Scan attendee QR ticket token to validate admission</p>
        </div>

        <!-- Scanner Card -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-md mb-8" x-data="scannerComponent()">
            
            <!-- Manual / Camera QR Input -->
            <div class="mb-6">
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">QR Token / Reference</label>
                <div class="flex gap-2">
                    <input 
                        type="text" 
                        x-model="tokenInput"
                        @keydown.enter.prevent="submitToken()"
                        placeholder="Scan or enter QR token UUID / reference..."
                        class="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800 focus:bg-white"
                        autofocus
                    >
                    <button 
                        type="button" 
                        @click="submitToken()" 
                        :disabled="loading || !tokenInput.trim()"
                        class="px-6 py-3 bg-maroon-800 hover:bg-maroon-700 disabled:opacity-40 text-white font-bold rounded-xl transition shadow-sm text-sm">
                        <span x-show="!loading">Verify</span>
                        <span x-show="loading">Checking...</span>
                    </button>
                </div>
            </div>

            <!-- Validation Result Notification -->
            <div x-show="result" x-cloak class="mt-4 p-5 rounded-2xl border transition-all"
                 :class="{
                     'bg-emerald-50 border-emerald-300 text-emerald-900': result?.status === 'success',
                     'bg-amber-50 border-amber-300 text-amber-900': result?.status === 'warning',
                     'bg-red-50 border-red-300 text-red-900': result?.status === 'error'
                 }">
                <div class="flex items-start gap-3">
                    <template x-if="result?.status === 'success'">
                        <div class="w-8 h-8 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </template>
                    <template x-if="result?.status === 'warning'">
                        <div class="w-8 h-8 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </template>
                    <template x-if="result?.status === 'error'">
                        <div class="w-8 h-8 rounded-full bg-red-200 text-red-800 flex items-center justify-center shrink-0">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    </template>

                    <div>
                        <h4 class="font-black text-sm uppercase tracking-wide" x-text="result?.status === 'success' ? 'Admission Granted' : (result?.status === 'warning' ? 'Already Admitted' : 'Invalid Ticket')"></h4>
                        <p class="text-xs mt-0.5" x-text="result?.message || ''"></p>

                        <template x-if="result?.attendee">
                            <div class="mt-2 text-xs font-semibold">
                                <p><span class="font-normal opacity-75">Attendee:</span> <span x-text="result.attendee"></span></p>
                                <p><span class="font-normal opacity-75">Seat:</span> <span x-text="result.seat"></span></p>
                            </div>
                        </template>
                    </div>
                </div>
            </div>

            <!-- Gate Marshal Instructions -->
            <div class="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                <p class="font-bold text-gray-700">Marshal Check-in Instructions:</p>
                <p>&bull; Verify student ID alongside the validated ticket pass.</p>
                <p>&bull; Red flags will be raised if the same QR token is scanned twice.</p>
                <p>&bull; Rows A & B are VIP front-row seating only.</p>
            </div>
        </div>

    </div>
</div>

<script>
function scannerComponent() {
    return {
        tokenInput: '',
        loading: false,
        result: null,
        async submitToken() {
            if (!this.tokenInput.trim()) return;
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
                    body: JSON.stringify({ token: this.tokenInput.trim() })
                });

                const data = await response.json();
                this.result = data;
                if (data.status === 'success') {
                    this.tokenInput = '';
                }
            } catch (e) {
                this.result = { status: 'error', message: 'Network or validation error occurred.' };
            } finally {
                this.loading = false;
            }
        }
    }
}
</script>
</x-app-layout>
