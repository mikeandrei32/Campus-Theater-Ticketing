@extends('layouts.admin', ['title' => 'Create Account • MSEUF Theater & Cinema Ticketing'])

@section('content')
<div class="py-6 sm:py-12 flex items-center justify-center">
    <div class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden"
         x-data="{
            name: '{{ old('name', '') }}',
            email: '{{ old('email', '') }}',
            studentNumber: '{{ old('student_number', '') }}',
            password: '',
            passwordConfirmation: '',
            showPassword: false,
            showConfirmPassword: false,
            loading: false,
            get passwordLongEnough() {
                return this.password.length >= 8;
            },
            get passwordsMatch() {
                return this.password.length > 0 && this.password === this.passwordConfirmation;
            }
         }">

        <!-- ========================================================================= -->
        <!-- LEFT PANEL: MSEUF COLLEGIATE BRANDING (Matches Home Hero)                -->
        <!-- ========================================================================= -->
        <div class="lg:col-span-5 relative overflow-hidden bg-gradient-to-br from-maroon-900 via-maroon-700 to-maroon-950 text-white p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-maroon-800">
            <!-- Decorative Glow Circles -->
            <div class="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-vipGold/15 rounded-full blur-2xl pointer-events-none"></div>

            <div class="relative z-10">
                <div class="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-extrabold uppercase tracking-wider mb-6">
                    <span class="w-2 h-2 rounded-full bg-vipGold animate-pulse"></span>
                    <span>Student Registration</span>
                </div>

                <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    Join MSEUF University Theater
                </h1>
                <p class="mt-3 text-maroon-100 text-xs sm:text-sm leading-relaxed">
                    Create your student or faculty account to book auditorium chairs, track your reservations, and access instant QR gate admission passes.
                </p>

                <!-- Benefits List -->
                <div class="mt-8 space-y-3 text-xs font-semibold text-maroon-100">
                    <div class="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/10">
                        <span class="w-8 h-8 rounded-xl bg-vipGold/20 border border-vipGold/40 text-vipGold flex items-center justify-center text-[11px] font-black shrink-0">01</span>
                        <div>
                            <div class="font-extrabold text-white">Reserve Up to 4 Seats</div>
                            <div class="text-[11px] text-maroon-200">Pick exact VIP front-row or Regular chairs</div>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/10">
                        <span class="w-8 h-8 rounded-xl bg-vipGold/20 border border-vipGold/40 text-vipGold flex items-center justify-center text-[11px] font-black shrink-0">02</span>
                        <div>
                            <div class="font-extrabold text-white">Website-Exclusive Account</div>
                            <div class="text-[11px] text-maroon-200">Accounts created on the website sign in exclusively on the web portal</div>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/10">
                        <span class="w-8 h-8 rounded-xl bg-vipGold/20 border border-vipGold/40 text-vipGold flex items-center justify-center text-[11px] font-black shrink-0">03</span>
                        <div>
                            <div class="font-extrabold text-white">Protected Ticket Stubs</div>
                            <div class="text-[11px] text-maroon-200">Anti-collision seat lock & verified QR tokens</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="relative z-10 mt-8 pt-6 border-t border-white/15 text-xs text-maroon-200">
                <span class="font-bold text-vipGold">Manuel S. Enverga University Foundation</span>
                <span class="block text-[11px] mt-0.5">Little Theater, AEC Building &bull; Lucena City</span>
            </div>
        </div>

        <!-- ========================================================================= -->
        <!-- RIGHT PANEL: SIGNUP FORM                                                  -->
        <!-- ========================================================================= -->
        <div class="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            <div class="max-w-md mx-auto w-full">

                <!-- Form Header -->
                <div class="mb-6">
                    <div class="flex items-center gap-2.5 mb-2">
                        <div class="w-9 h-9 rounded-full bg-maroon-700 text-white font-black text-xs flex items-center justify-center border-2 border-vipGold shadow-sm">
                            EU
                        </div>
                        <span class="text-xs font-extrabold uppercase tracking-wider text-maroon-700">
                            New Student / Attendee
                        </span>
                    </div>
                    <h2 class="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                        Create Your Account
                    </h2>
                    <p class="text-xs sm:text-sm text-gray-500 mt-1">
                        Complete the fields below to register for campus theater ticketing.
                    </p>
                </div>

                <form method="POST" action="{{ route('register.submit') }}" @submit="loading = true" class="space-y-4" novalidate>
                    @csrf

                    <!-- 1. Full Name -->
                    <div>
                        <label for="name" class="block text-xs font-black text-gray-800 uppercase tracking-wider mb-1.5">
                            Full Name <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </span>
                            <input type="text"
                                   id="name"
                                   name="name"
                                   x-model="name"
                                   autocomplete="name"
                                   required
                                   autofocus
                                   placeholder="e.g. Juan Dela Cruz"
                                   class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border @error('name') border-red-500 bg-red-50/30 @else border-gray-300 bg-gray-50/50 focus:bg-white @enderror focus:ring-2 focus:ring-maroon-700 focus:border-maroon-700 focus:outline-none transition">
                        </div>
                        @error('name')
                            <p class="text-xs text-red-600 font-bold mt-1 flex items-center gap-1" role="alert">
                                <span>{{ $message }}</span>
                            </p>
                        @enderror
                    </div>

                    <!-- 2. Email & Optional Student Number Grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
                        <div class="sm:col-span-7">
                            <label for="email" class="block text-xs font-black text-gray-800 uppercase tracking-wider mb-1.5">
                                Email Address <span class="text-red-500">*</span>
                            </label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </span>
                                <input type="email"
                                       id="email"
                                       name="email"
                                       x-model="email"
                                       autocomplete="email"
                                       required
                                       placeholder="juan@mseuf.edu.ph"
                                       class="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border @error('email') border-red-500 bg-red-50/30 @else border-gray-300 bg-gray-50/50 focus:bg-white @enderror focus:ring-2 focus:ring-maroon-700 focus:border-maroon-700 focus:outline-none transition">
                            </div>
                        </div>

                        <div class="sm:col-span-5">
                            <label for="student_number" class="block text-xs font-black text-gray-800 uppercase tracking-wider mb-1.5">
                                Student ID <span class="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <input type="text"
                                   id="student_number"
                                   name="student_number"
                                   x-model="studentNumber"
                                   placeholder="e.g. A23-00142"
                                   class="w-full px-3.5 py-2.5 text-sm font-mono uppercase rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-maroon-700 focus:border-maroon-700 focus:outline-none transition">
                        </div>
                    </div>
                    @error('email')
                        <p class="text-xs text-red-600 font-bold -mt-2 flex items-center gap-1" role="alert">
                            <span>{{ $message }}</span>
                        </p>
                    @enderror

                    <!-- 3. Password -->
                    <div>
                        <label for="password" class="block text-xs font-black text-gray-800 uppercase tracking-wider mb-1.5">
                            Password <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </span>
                            <input :type="showPassword ? 'text' : 'password'"
                                   id="password"
                                   name="password"
                                   x-model="password"
                                   autocomplete="new-password"
                                   required
                                   minlength="8"
                                   placeholder="Minimum 8 characters"
                                   class="w-full pl-10 pr-12 py-2.5 text-sm rounded-xl border @error('password') border-red-500 bg-red-50/30 @else border-gray-300 bg-gray-50/50 focus:bg-white @enderror focus:ring-2 focus:ring-maroon-700 focus:border-maroon-700 focus:outline-none transition">

                            <button type="button"
                                    @click="showPassword = !showPassword"
                                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                                    class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-maroon-700 focus:outline-none">
                                <svg x-show="!showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <svg x-show="showPassword" x-cloak class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            </button>
                        </div>
                        @error('password')
                            <p class="text-xs text-red-600 font-bold mt-1 flex items-center gap-1" role="alert">
                                <span>{{ $message }}</span>
                            </p>
                        @enderror
                    </div>

                    <!-- 4. Confirm Password -->
                    <div>
                        <label for="password_confirmation" class="block text-xs font-black text-gray-800 uppercase tracking-wider mb-1.5">
                            Confirm Password <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </span>
                            <input :type="showConfirmPassword ? 'text' : 'password'"
                                   id="password_confirmation"
                                   name="password_confirmation"
                                   x-model="passwordConfirmation"
                                   autocomplete="new-password"
                                   required
                                   placeholder="Re-enter your password"
                                   class="w-full pl-10 pr-12 py-2.5 text-sm rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-maroon-700 focus:border-maroon-700 focus:outline-none transition">

                            <button type="button"
                                    @click="showConfirmPassword = !showConfirmPassword"
                                    :aria-label="showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'"
                                    class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-maroon-700 focus:outline-none">
                                <svg x-show="!showConfirmPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <svg x-show="showConfirmPassword" x-cloak class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            </button>
                        </div>

                        <!-- Live Password Requirements Indicator -->
                        <div class="mt-2 flex items-center gap-4 text-[11px] font-bold">
                            <span class="flex items-center gap-1 transition-colors"
                                  :class="passwordLongEnough ? 'text-emerald-700' : 'text-gray-400'">
                                <span x-text="passwordLongEnough ? '✓' : '○'"></span>
                                <span>8+ characters</span>
                            </span>
                            <span class="flex items-center gap-1 transition-colors"
                                  :class="passwordsMatch ? 'text-emerald-700' : (passwordConfirmation.length > 0 ? 'text-red-600' : 'text-gray-400')">
                                <span x-text="passwordsMatch ? '✓' : (passwordConfirmation.length > 0 ? '✕' : '○')"></span>
                                <span x-text="passwordConfirmation.length > 0 && !passwordsMatch ? 'Passwords do not match' : 'Passwords match'"></span>
                            </span>
                        </div>
                    </div>

                    <!-- 5. Submit Button -->
                    <div class="pt-2">
                        <button type="submit"
                                :disabled="loading"
                                class="w-full py-3.5 px-6 rounded-2xl bg-maroon-700 hover:bg-maroon-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon-700">
                            <span x-show="!loading" class="flex items-center gap-2">
                                <span>Send Verification Code</span>
                                <span>&rarr;</span>
                            </span>
                            <span x-show="loading" x-cloak class="flex items-center gap-2">
                                <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                </svg>
                                <span>Sending Verification Code...</span>
                            </span>
                        </button>
                        <p class="text-[11px] text-gray-500 text-center mt-2">
                            We will send a 6-digit verification code to your email before creating your account.
                        </p>
                    </div>
                </form>

                <!-- Link to Login -->
                <div class="mt-6 pt-5 border-t border-gray-100 text-center">
                    <p class="text-xs text-gray-600 font-medium">
                        Already have an MSEUF Theater account?
                        <a href="{{ route('login') }}"
                           class="font-black text-maroon-700 hover:text-maroon-900 hover:underline ml-1 focus:outline-none focus:ring-2 focus:ring-maroon-700 rounded">
                            Sign In Here &rarr;
                        </a>
                    </p>
                </div>

            </div>
        </div>

    </div>
</div>
@endsection
