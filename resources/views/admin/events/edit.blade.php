@extends('layouts.admin')

@section('content')
<div class="max-w-5xl mx-auto space-y-6" 
     x-data="{
        title: '{{ old('title', $event->title) }}',
        venue: 'Little Theater, AEC Building',
        showDate: '{{ old('show_date', $event->show_date ? $event->show_date->format('Y-m-d\TH:i') : '') }}',
        pricingType: '{{ old('pricing_type', $event->pricing_type) }}',
        regularPrice: '{{ old('regular_price', $event->regular_price) }}',
        vipPrice: '{{ old('vip_price', $event->vip_price) }}',
        bannerImage: '{{ old('banner_image', $event->banner_image) }}',
        setPoster(url) {
            this.bannerImage = url;
        }
     }">

    <!-- Top Breadcrumb & Page Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
            <div class="flex items-center gap-2 text-xs text-gray-500 font-bold mb-1">
                <a href="{{ route('admin.events.index') }}" class="hover:text-maroon-700">Shows & Plays</a>
                <span>›</span>
                <a href="{{ route('admin.events.show', $event->id) }}" class="hover:text-maroon-700">{{ $event->title }}</a>
                <span>›</span>
                <span class="text-maroon-700 font-extrabold">Edit Show</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
                <span>✏️</span>
                <span>Edit Campus Play / Cine Show</span>
            </h1>
            <p class="text-xs text-gray-500 mt-1">
                Updating these details will immediately sync with the student mobile app.
            </p>
        </div>

        <div class="flex items-center gap-2">
            <a href="{{ route('admin.events.show', $event->id) }}" 
               class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition">
                &larr; View Event Overview
            </a>
        </div>
    </div>

    <!-- Main Grid: Form on Left, Live Mobile Preview on Right -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- ========================================================================= -->
        <!-- FORM SECTION (Left 7 Cols)                                                -->
        <!-- ========================================================================= -->
        <div class="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200">
            
            <form method="POST" action="{{ route('admin.events.update', $event->id) }}" class="space-y-6">
                {{-- CSRF Token & PUT Method for standard RESTful update in Laravel --}}
                @csrf
                @method('PUT')

                <!-- 1. Show Title -->
                <div>
                    <label for="title" class="block text-xs font-black text-gray-800 uppercase tracking-wider mb-2">
                        Show Title <span class="text-red-500">*</span>
                    </label>
                    <input type="text" 
                           id="title" 
                           name="title" 
                           x-model="title"
                           class="w-full px-4 py-3 text-sm rounded-xl border @error('title') border-red-500 @else border-gray-300 @enderror focus:ring-2 focus:ring-maroon-700 focus:outline-none transition"
                           required>
                    @error('title')
                        <p class="text-xs text-red-600 font-bold mt-1">{{ $message }}</p>
                    @enderror
                </div>

                <!-- 2. University Venue (Specifically for Little Theater) -->
                <div>
                    <label class="block text-xs font-black text-gray-800 uppercase tracking-wider mb-2">
                        Venue / Auditorium
                    </label>
                    <input type="hidden" name="venue" value="Little Theater, AEC Building">
                    <div class="flex items-center gap-3 p-3.5 bg-maroon-50 border-2 border-maroon-200 rounded-2xl text-maroon-900">
                        <div class="w-9 h-9 rounded-xl bg-maroon-700 text-white flex items-center justify-center font-bold text-base shrink-0">
                            🎭
                        </div>
                        <div>
                            <div class="font-extrabold text-sm text-maroon-950">Little Theater, AEC Building</div>
                            <div class="text-[11px] text-maroon-700 font-semibold">MSEUF Campus • Dedicated 60-Seat Interactive Auditorium</div>
                        </div>
                    </div>
                </div>


                <!-- 3. Show Date & Time -->
                <div>
                    <label for="show_date" class="block text-xs font-black text-gray-800 uppercase tracking-wider mb-2">
                        Show Date & Time <span class="text-red-500">*</span>
                    </label>
                    <input type="datetime-local" 
                           id="show_date" 
                           name="show_date" 
                           x-model="showDate"
                           class="w-full px-4 py-3 text-sm rounded-xl border @error('show_date') border-red-500 @else border-gray-300 @enderror focus:ring-2 focus:ring-maroon-700 focus:outline-none"
                           required>
                    @error('show_date')
                        <p class="text-xs text-red-600 font-bold mt-1">{{ $message }}</p>
                    @enderror
                </div>

                <!-- 4. Pricing Type (Free vs Paid) -->
                <div>
                    <label class="block text-xs font-black text-gray-800 uppercase tracking-wider mb-2">
                        Admission / Pricing Type <span class="text-red-500">*</span>
                    </label>
                    <div class="grid grid-cols-2 gap-4">
                        <!-- Paid Option -->
                        <label class="cursor-pointer border-2 rounded-2xl p-4 flex items-center gap-3 transition"
                               :class="pricingType === 'paid' ? 'border-maroon-700 bg-maroon-50 text-maroon-900 shadow-sm' : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'">
                            <input type="radio" 
                                   name="pricing_type" 
                                   value="paid" 
                                   x-model="pricingType"
                                   class="text-maroon-700 focus:ring-maroon-700">
                            <div>
                                <div class="font-extrabold text-sm">★ Paid Admission</div>
                                <div class="text-[11px] text-gray-500">Regular & VIP Tier Pricing</div>
                            </div>
                        </label>

                        <!-- Free Option -->
                        <label class="cursor-pointer border-2 rounded-2xl p-4 flex items-center gap-3 transition"
                               :class="pricingType === 'free' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm' : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'">
                            <input type="radio" 
                                   name="pricing_type" 
                                   value="free" 
                                   x-model="pricingType"
                                   class="text-emerald-600 focus:ring-emerald-600">
                            <div>
                                <div class="font-extrabold text-sm">Free Admission</div>
                                <div class="text-[11px] text-gray-500">No payment required (₱0.00)</div>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- 5. Ticket Prices (Conditional when Paid) -->
                <div x-show="pricingType === 'paid'" x-transition class="p-5 rounded-2xl bg-amber-50/70 border border-vipGold-border space-y-4">
                    <div class="flex items-center gap-2 text-xs font-black text-maroon-900">
                        <span class="text-vipGold text-base">★</span>
                        <span>Tiered Seat Pricing (Auditorium Rows)</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <!-- Regular Seats (Rows C-F) -->
                        <div>
                            <label for="regular_price" class="block text-xs font-bold text-gray-700 mb-1">
                                Regular Seats (Rows C to F) ₱
                            </label>
                            <div class="relative">
                                <span class="absolute left-3 top-2.5 text-xs text-gray-500 font-bold">₱</span>
                                <input type="number" 
                                       step="1" 
                                       id="regular_price" 
                                       name="regular_price" 
                                       x-model="regularPrice"
                                       class="w-full pl-7 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-maroon-700 focus:outline-none">
                            </div>
                        </div>

                        <!-- VIP Front Rows (Rows A-B) -->
                        <div>
                            <label for="vip_price" class="block text-xs font-bold text-vipGold-dark mb-1">
                                ★ VIP Front Rows (Rows A & B) ₱
                            </label>
                            <div class="relative">
                                <span class="absolute left-3 top-2.5 text-xs text-vipGold font-bold">₱</span>
                                <input type="number" 
                                       step="1" 
                                       id="vip_price" 
                                       name="vip_price" 
                                       x-model="vipPrice"
                                       class="w-full pl-7 pr-4 py-2.5 text-sm rounded-xl border border-vipGold-border focus:ring-2 focus:ring-maroon-700 focus:outline-none bg-white">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 6. Banner Poster Selector -->
                <div>
                    <label class="block text-xs font-black text-gray-800 uppercase tracking-wider mb-2">
                        Show Poster / Banner Image
                    </label>

                    <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                        @foreach($presetPosters as $poster)
                            <button type="button" 
                                    @click="setPoster('{{ $poster['url'] }}')"
                                    class="relative rounded-xl overflow-hidden border-2 transition hover:opacity-100 group h-16"
                                    :class="bannerImage === '{{ $poster['url'] }}' ? 'border-maroon-700 ring-2 ring-maroon-500 ring-offset-1' : 'border-gray-200 opacity-70 hover:opacity-100'">
                                <img src="{{ $poster['url'] }}" alt="{{ $poster['title'] }}" class="w-full h-full object-cover">
                                <div class="absolute inset-0 bg-black/40 flex items-center justify-center p-1 text-[9px] text-white font-black text-center line-clamp-2">
                                    {{ $poster['title'] }}
                                </div>
                            </button>
                        @endforeach
                    </div>

                    <input type="url" 
                           id="banner_image" 
                           name="banner_image" 
                           x-model="bannerImage"
                           class="w-full px-4 py-2.5 text-xs font-mono rounded-xl border border-gray-300 focus:ring-2 focus:ring-maroon-700 focus:outline-none">
                </div>

                <!-- Submit Button -->
                <div class="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <a href="{{ route('admin.events.show', $event->id) }}" class="text-xs text-gray-500 font-bold hover:text-gray-800">
                        Cancel
                    </a>

                    <button type="submit" 
                            class="px-8 py-3.5 bg-maroon-700 hover:bg-maroon-800 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
                        <span>💾</span>
                        <span>Save & Update Show</span>
                    </button>
                </div>
            </form>

        </div>

        <!-- ========================================================================= -->
        <!-- LIVE MOBILE PREVIEW (Right 5 Cols)                                        -->
        <!-- ========================================================================= -->
        <div class="lg:col-span-5 space-y-4">
            <div class="flex items-center justify-between">
                <span class="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📱</span>
                    <span>Student Mobile App Live Preview</span>
                </span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Live Sync
                </span>
            </div>

            <!-- Preview Phone Card -->
            <div class="bg-gray-900 rounded-[36px] p-4 shadow-2xl border-4 border-gray-800 max-w-sm mx-auto">
                <div class="flex items-center justify-between px-3 py-1 mb-2 text-white/60 text-[10px] font-mono">
                    <span>9:41</span>
                    <div class="flex items-center gap-1.5">
                        <span>5G</span>
                        <span>100%</span>
                    </div>
                </div>

                <div class="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-md">
                    <div class="h-36 w-full relative bg-gray-900">
                        <img :src="bannerImage || 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80'" 
                             class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                        <div class="absolute top-2.5 right-2.5">
                            <span x-show="pricingType === 'free'" class="px-2.5 py-1 bg-emerald-600 text-white font-black text-[10px] rounded-lg shadow">
                                FREE ADMISSION
                            </span>
                            <span x-show="pricingType === 'paid'" class="px-2.5 py-1 bg-maroon-700 text-white border border-vipGold font-black text-[10px] rounded-lg shadow">
                                <span class="text-vipGold" x-text="'VIP ₱' + vipPrice"></span> • <span x-text="'REG ₱' + regularPrice"></span>
                            </span>
                        </div>
                    </div>

                    <div class="p-4 space-y-2">
                        <h4 class="text-sm font-black text-gray-900 line-clamp-1 leading-snug" x-text="title || 'Show Title'"></h4>
                        
                        <div class="flex items-center gap-1.5 text-[11px] text-gray-600 font-semibold">
                            <span class="text-maroon-700">📍</span>
                            <span class="line-clamp-1" x-text="venue || 'MSEUF Venue'"></span>
                        </div>

                        <div class="flex items-center gap-1.5 text-[11px] text-gray-600 font-semibold">
                            <span>📅</span>
                            <span x-text="showDate ? showDate.replace('T', ' • ') : 'Upcoming Date'"></span>
                        </div>

                        <button type="button" class="w-full mt-2 py-2.5 bg-maroon-700 text-white font-black text-xs rounded-xl text-center shadow-sm">
                            Select Cinema Seats ›
                        </button>
                    </div>
                </div>

                <div class="text-center mt-3 text-[10px] text-gray-400 font-mono">
                    Live Mobile Preview
                </div>
            </div>

        </div>

    </div>

</div>
@endsection
