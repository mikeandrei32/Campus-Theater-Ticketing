@extends('layouts.admin', ['title' => 'Verify Email Address • MSEUF Theater & Cinema Ticketing'])

@section('content')
<div class="py-10 sm:py-16 flex items-center justify-center">
    <div class="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden"
         x-data="{
            code: '',
            loading: false,
            resending: false,
            fillCode(val) {
                this.code = val;
            }
         }">

        <!-- Top Maroon Banner -->
        <div class="bg-gradient-to-r from-maroon-900 via-maroon-700 to-maroon-900 p-6 sm:p-8 text-white text-center relative overflow-hidden border-b-2 border-vipGold">
            <div class="w-12 h-12 rounded-full bg-white text-maroon-700 font-black text-base flex items-center justify-center mx-auto border-2 border-vipGold shadow-md mb-3">
                EU
            </div>
            <span class="inline-block text-[10px] font-extrabold uppercase tracking-widest bg-white/15 px-3 py-1 rounded-full mb-2">
                Step 2 of 2 • Email Verification
            </span>
            <h1 class="text-xl sm:text-2xl font-black tracking-tight">Verify Your Email</h1>
            <p class="text-xs text-maroon-100 mt-1">
                We sent a 6-digit verification code to <strong class="text-vipGold">{{ $email }}</strong>
            </p>
        </div>

        <div class="p-6 sm:p-8">
            @if(session('status'))
                <div class="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold">
                    {{ session('status') }}
                </div>
            @endif

            @if(!empty($demoCode))
                <div class="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs">
                    <div class="flex items-center justify-between gap-2">
                        <div>
                            <span class="block text-[10px] font-black uppercase tracking-wider text-amber-800">Local Mailer Preview</span>
                            <span class="text-xs text-amber-900">Verification Code: <strong class="font-mono text-sm tracking-widest">{{ $demoCode }}</strong></span>
                        </div>
                        <button type="button"
                                @click="fillCode('{{ $demoCode }}')"
                                class="px-3 py-1.5 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-black text-[11px] transition">
                            Auto-Fill
                        </button>
                    </div>
                </div>
            @endif

            <form method="POST" action="{{ route('register.verify.submit') }}" @submit="loading = true" class="space-y-5" novalidate>
                @csrf
                <input type="hidden" name="email" value="{{ $email }}">

                <div>
                    <label for="code" class="block text-xs font-black text-gray-800 uppercase tracking-wider mb-2">
                        6-Digit Verification Code <span class="text-red-500">*</span>
                    </label>
                    <input type="text"
                           id="code"
                           name="code"
                           x-model="code"
                           inputmode="numeric"
                           maxlength="6"
                           required
                           autofocus
                           placeholder="000000"
                           class="w-full px-4 py-3.5 text-center text-2xl font-mono font-black tracking-[0.5em] rounded-xl border @error('code') border-red-500 bg-red-50/30 @else border-gray-300 bg-gray-50/50 focus:bg-white @enderror focus:ring-2 focus:ring-maroon-700 focus:border-maroon-700 focus:outline-none transition">
                    @error('code')
                        <p class="text-xs text-red-600 font-bold mt-1.5" role="alert">
                            {{ $message }}
                        </p>
                    @enderror
                    <p class="text-[11px] text-gray-500 mt-2 text-center">
                        Your account will be created immediately once the code is verified.
                    </p>
                </div>

                <button type="submit"
                        :disabled="loading"
                        class="w-full py-3.5 px-6 rounded-2xl bg-maroon-700 hover:bg-maroon-800 disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2">
                    <span x-show="!loading">Verify & Create Account &rarr;</span>
                    <span x-show="loading" x-cloak>Verifying & Creating Account...</span>
                </button>
            </form>

            <!-- Resend Code & Back to Registration -->
            <div class="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs">
                <form method="POST" action="{{ route('register.resend') }}" @submit="resending = true">
                    @csrf
                    <input type="hidden" name="email" value="{{ $email }}">
                    <button type="submit"
                            :disabled="resending"
                            class="font-black text-maroon-700 hover:text-maroon-900 hover:underline disabled:opacity-50">
                        <span x-show="!resending">Resend Verification Code</span>
                        <span x-show="resending" x-cloak>Sending...</span>
                    </button>
                </form>

                <a href="{{ route('register') }}" class="font-bold text-gray-500 hover:text-gray-800 hover:underline">
                    Change Email
                </a>
            </div>
        </div>
    </div>
</div>
@endsection
