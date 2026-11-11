@extends('layouts.admin', ['title' => 'Reset Password • MSEUF Theater & Cinema Ticketing'])

@section('content')
<div class="py-10 sm:py-16 flex items-center justify-center">
    <div class="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden"
         x-data="{ showPassword: false, showConfirm: false, loading: false }">

        <!-- Top Maroon Banner -->
        <div class="bg-gradient-to-r from-maroon-900 via-maroon-700 to-maroon-900 p-6 sm:p-8 text-white text-center relative overflow-hidden border-b-2 border-vipGold">
            <div class="w-12 h-12 rounded-full bg-white text-maroon-700 font-black text-base flex items-center justify-center mx-auto border-2 border-vipGold shadow-md mb-3">
                EU
            </div>
            <h1 class="text-xl sm:text-2xl font-black tracking-tight">Set New Password</h1>
            <p class="text-xs text-maroon-100 mt-1">
                Choose a strong password (minimum 8 characters) for your MSEUF account.
            </p>
        </div>

        <div class="p-6 sm:p-8">
            <form method="POST" action="{{ route('password.update') }}" @submit="loading = true" class="space-y-4" novalidate>
                @csrf
                <input type="hidden" name="token" value="{{ $token }}">

                <div>
                    <label for="email" class="block text-xs font-black text-gray-800 uppercase tracking-wider mb-1.5">
                        Email Address <span class="text-red-500">*</span>
                    </label>
                    <input type="email"
                           id="email"
                           name="email"
                           value="{{ old('email', $email) }}"
                           required
                           class="w-full px-4 py-2.5 text-sm rounded-xl border @error('email') border-red-500 @else border-gray-300 bg-gray-50 @enderror focus:ring-2 focus:ring-maroon-700 focus:outline-none">
                    @error('email')
                        <p class="text-xs text-red-600 font-bold mt-1">{{ $message }}</p>
                    @enderror
                </div>

                <div>
                    <label for="password" class="block text-xs font-black text-gray-800 uppercase tracking-wider mb-1.5">
                        New Password <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <input :type="showPassword ? 'text' : 'password'"
                               id="password"
                               name="password"
                               required
                               minlength="8"
                               autofocus
                               placeholder="Minimum 8 characters"
                               class="w-full pl-4 pr-11 py-2.5 text-sm rounded-xl border @error('password') border-red-500 @else border-gray-300 @enderror focus:ring-2 focus:ring-maroon-700 focus:outline-none">
                        <button type="button"
                                @click="showPassword = !showPassword"
                                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-maroon-700">
                            <span class="text-xs font-bold" x-text="showPassword ? 'Hide' : 'Show'"></span>
                        </button>
                    </div>
                    @error('password')
                        <p class="text-xs text-red-600 font-bold mt-1">{{ $message }}</p>
                    @enderror
                </div>

                <div>
                    <label for="password_confirmation" class="block text-xs font-black text-gray-800 uppercase tracking-wider mb-1.5">
                        Confirm New Password <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <input :type="showConfirm ? 'text' : 'password'"
                               id="password_confirmation"
                               name="password_confirmation"
                               required
                               placeholder="Re-enter new password"
                               class="w-full pl-4 pr-11 py-2.5 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-maroon-700 focus:outline-none">
                        <button type="button"
                                @click="showConfirm = !showConfirm"
                                :aria-label="showConfirm ? 'Hide confirm password' : 'Show confirm password'"
                                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-maroon-700">
                            <span class="text-xs font-bold" x-text="showConfirm ? 'Hide' : 'Show'"></span>
                        </button>
                    </div>
                </div>

                <div class="pt-2">
                    <button type="submit"
                            :disabled="loading"
                            class="w-full py-3.5 px-6 rounded-2xl bg-maroon-700 hover:bg-maroon-800 disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider shadow-lg transition">
                        <span x-show="!loading">Update Password & Sign In &rarr;</span>
                        <span x-show="loading" x-cloak>Updating Password...</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
