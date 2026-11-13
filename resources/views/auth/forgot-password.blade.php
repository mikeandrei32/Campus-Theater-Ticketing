@extends('layouts.admin', ['title' => 'Forgot Password • MSEUF Theater & Cinema Ticketing'])

@section('content')
<div class="py-10 sm:py-16 flex items-center justify-center">
    <div class="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden" x-data="{ loading: false }">

        <!-- Top Maroon Banner -->
        <div class="bg-gradient-to-r from-maroon-900 via-maroon-700 to-maroon-900 p-6 sm:p-8 text-white text-center relative overflow-hidden border-b-2 border-vipGold">
            <div class="w-12 h-12 rounded-full bg-white text-maroon-700 font-black text-base flex items-center justify-center mx-auto border-2 border-vipGold shadow-md mb-3">
                EU
            </div>
            <h1 class="text-xl sm:text-2xl font-black tracking-tight">Password Recovery</h1>
            <p class="text-xs text-maroon-100 mt-1">
                Enter your registered university email to reset your password.
            </p>
        </div>

        <div class="p-6 sm:p-8">
            @if(session('status'))
                <div class="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs space-y-2">
                    <div class="font-black flex items-center gap-2">
                        <span>{{ session('status') }}</span>
                    </div>
                    @if(session('reset_url'))
                        <div class="pt-2 border-t border-emerald-200">
                            <p class="text-[11px] text-emerald-800 mb-2">Click the button below to set your new password now:</p>
                            <a href="{{ session('reset_url') }}"
                               class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-black text-xs shadow-sm transition">
                                <span>Reset Password Now</span>
                                <span>&rarr;</span>
                            </a>
                        </div>
                    @endif
                </div>
            @endif

            <form method="POST" action="{{ route('password.email') }}" @submit="loading = true" class="space-y-5" novalidate>
                @csrf

                <div>
                    <label for="email" class="block text-xs font-black text-gray-800 uppercase tracking-wider mb-2">
                        Registered Email Address <span class="text-red-500">*</span>
                    </label>
                    <input type="email"
                           id="email"
                           name="email"
                           value="{{ old('email') }}"
                           required
                           autofocus
                           placeholder="student@mseuf.edu.ph"
                           class="w-full px-4 py-3 text-sm rounded-xl border @error('email') border-red-500 bg-red-50/30 @else border-gray-300 bg-gray-50/50 focus:bg-white @enderror focus:ring-2 focus:ring-maroon-700 focus:outline-none transition">
                    @error('email')
                        <p class="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1" role="alert">
                            <span>{{ $message }}</span>
                        </p>
                    @enderror
                </div>

                <button type="submit"
                        :disabled="loading"
                        class="w-full py-3.5 px-6 rounded-2xl bg-maroon-700 hover:bg-maroon-800 disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2">
                    <span x-show="!loading">Generate Recovery Link &rarr;</span>
                    <span x-show="loading" x-cloak>Generating Link...</span>
                </button>
            </form>

            <div class="mt-6 pt-5 border-t border-gray-100 text-center">
                <a href="{{ route('login') }}" class="text-xs font-black text-maroon-700 hover:text-maroon-900 hover:underline">
                    &larr; Back to Sign In
                </a>
            </div>
        </div>
    </div>
</div>
@endsection
