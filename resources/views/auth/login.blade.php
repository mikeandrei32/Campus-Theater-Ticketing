@extends('layouts.admin', ['title' => 'Sign In • MSEUF Theater & Cinema Ticketing'])

@section('content')
<div class="py-6 sm:py-12 flex items-center justify-center">
    <div class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden"
         x-data="{
            email: '{{ old('email', '') }}',
            password: '',
            showPassword: false,
            loading: false,
            fillDemo(demoEmail, demoPass) {
                this.email = demoEmail;
                this.password = demoPass;
            }
         }">

        <!-- ========================================================================= -->
        <!-- LEFT PANEL: MSEUF COLLEGIATE THEATER BRANDING (Matches Home Hero)         -->
        <!-- ========================================================================= -->
        <div class="lg:col-span-5 relative overflow-hidden bg-gradient-to-br from-maroon-900 via-maroon-700 to-maroon-950 text-white p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-maroon-800">
            <!-- Decorative Glow Circles -->
            <div class="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-vipGold/15 rounded-full blur-2xl pointer-events-none"></div>

            <div class="relative z-10">
                <!-- University Crest Badge -->
                <div class="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-extrabold uppercase tracking-wider mb-6">
                    <span class="w-2 h-2 rounded-full bg-vipGold animate-pulse"></span>
                    <span>MSEUF University Portal</span>
                </div>

                <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    Welcome Back to Campus Theater
                </h1>
                <p class="mt-3 text-maroon-100 text-xs sm:text-sm leading-relaxed">
                    Sign in to reserve auditorium seats, view your digital QR passes, or manage Manuel S. Enverga University Foundation stage productions.
                </p>

                <!-- Feature Highlights -->
                <div class="mt-8 space-y-3 text-xs font-semibold text-maroon-100">
                    <div class="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/10">
                        <span class="w-8 h-8 rounded-xl bg-vipGold/20 border border-vipGold/40 text-vipGold flex items-center justify-center text-sm shrink-0">🎭</span>
                        <div>
                            <div class="font-extrabold text-white">Interactive 60-Seat Grid</div>
                            <div class="text-[11px] text-maroon-200">Real-time VIP & Regular row selection</div>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/10">
                        <span class="w-8 h-8 rounded-xl bg-vipGold/20 border border-vipGold/40 text-vipGold flex items-center justify-center text-sm shrink-0">🎟️</span>
                        <div>
                            <div class="font-extrabold text-white">Instant Digital QR Stubs</div>
                            <div class="text-[11px] text-maroon-200">Fast gate verification & pass management</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Demo Account Selector -->
            <div class="relative z-10 mt-8 pt-6 border-t border-white/15">
                <p class="text-[10px] font-black uppercase tracking-wider text-vipGold mb-2.5">
                    ⚡ Quick Demo Credentials
                </p>
                <div class="grid grid-cols-2 gap-2">
                    <button type="button"
                            @click="fillDemo('student@mseuf.edu.ph', 'password')"
                            class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-left transition focus:outline-none focus:ring-2 focus:ring-vipGold">
                        <span class="block text-[11px] font-black text-white">🎓 Student Demo</span>
                        <span class="block text-[10px] text-maroon-200 truncate">student@mseuf.edu.ph</span>
                    </button>

                    <button type="button"
                            @click="fillDemo('admin@mseuf.edu.ph', 'password')"
                            class="px-3 py-2 rounded-xl bg-vipGold/20 hover:bg-vipGold/30 border border-vipGold/40 text-left transition focus:outline-none focus:ring-2 focus:ring-vipGold">
                        <span class="block text-[11px] font-black text-vipGold-light">🔑 Admin Demo</span>
                        <span class="block text-[10px] text-maroon-100 truncate">admin@mseuf.edu.ph</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- ========================================================================= -->
        <!-- RIGHT PANEL: LOGIN FORM                                                   -->
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
                            Account Authentication
                        </span>
                    </div>
                    <h2 class="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                        Sign In to Your Account
                    </h2>
                    <p class="text-xs sm:text-sm text-gray-500 mt-1">
                        Enter your university email and password below to continue.
                    </p>
                </div>

                @if(session('status'))
                    <div class="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2.5">
                        <span>✅</span>
                        <span>{{ session('status') }}</span>
                    </div>
                @endif

                <form method="POST" action="{{ route('login.submit') }}" @submit="loading = true" class="space-y-5" novalidate>
                    @csrf

                    <!-- 1. Email Address -->
                    <div>
                        <label for="email" class="block text-xs font-black text-gray-800 uppercase tracking-wider mb-2">
                            University Email Address <span class="text-red-500">*</span>
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
                                   autofocus
                                   placeholder="student@mseuf.edu.ph"
                                   class="w-full pl-10 pr-4 py-3 text-sm rounded-xl border @error('email') border-red-500 bg-red-50/30 @else border-gray-300 bg-gray-50/50 focus:bg-white @enderror focus:ring-2 focus:ring-maroon-700 focus:border-maroon-700 focus:outline-none transition">
                        </div>
                        @error('email')
                            <p class="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1" role="alert">
                                <span>⚠️</span>
                                <span>{{ $message }}</span>
                            </p>
                        @enderror
                    </div>

                    <!-- 2. Password with Show/Hide Toggle -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label for="password" class="block text-xs font-black text-gray-800 uppercase tracking-wider">
                                Password <span class="text-red-500">*</span>
                            </label>
                            <a href="{{ route('password.request') }}"
                               class="text-xs font-bold text-maroon-700 hover:text-maroon-900 hover:underline focus:outline-none focus:ring-2 focus:ring-maroon-700 rounded">
                                Forgot Password?
                            </a>
                        </div>

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
                                   autocomplete="current-password"
                                   required
                                   placeholder="Enter your password"
                                   class="w-full pl-10 pr-12 py-3 text-sm rounded-xl border @error('password') border-red-500 bg-red-50/30 @else border-gray-300 bg-gray-50/50 focus:bg-white @enderror focus:ring-2 focus:ring-maroon-700 focus:border-maroon-700 focus:outline-none transition">

                            <!-- Show / Hide Password Toggle Button -->
                            <button type="button"
                                    @click="showPassword = !showPassword"
                                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                                    :aria-pressed="showPassword.toString()"
                                    class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-maroon-700 focus:outline-none focus:text-maroon-700 transition">
                                <!-- Eye Icon (Show) -->
                                <svg x-show="!showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <!-- Eye-Off Icon (Hide) -->
                                <svg x-show="showPassword" x-cloak class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            </button>
                        </div>
                        @error('password')
                            <p class="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1" role="alert">
                                <span>⚠️</span>
                                <span>{{ $message }}</span>
                            </p>
                        @enderror
                    </div>

                    <!-- 3. Remember Me Checkbox -->
                    <div class="flex items-center justify-between">
                        <label for="remember" class="inline-flex items-center gap-2.5 cursor-pointer select-none">
                            <input type="checkbox"
                                   id="remember"
                                   name="remember"
                                   value="1"
                                   {{ old('remember') ? 'checked' : '' }}
                                   class="w-4 h-4 rounded border-gray-300 text-maroon-700 focus:ring-maroon-700">
                            <span class="text-xs font-bold text-gray-700">Remember me on this device</span>
                        </label>
                    </div>

                    <!-- 4. Submit Button with Loading State -->
                    <div class="pt-1">
                        <button type="submit"
                                :disabled="loading"
                                class="w-full py-3.5 px-6 rounded-2xl bg-maroon-700 hover:bg-maroon-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon-700">
                            <span x-show="!loading" class="flex items-center gap-2">
                                <span>Sign In to Portal</span>
                                <span>&rarr;</span>
                            </span>
                            <span x-show="loading" x-cloak class="flex items-center gap-2">
                                <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                </svg>
                                <span>Signing In...</span>
                            </span>
                        </button>
                    </div>
                </form>

                <!-- Divider & Link to Signup -->
                <div class="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p class="text-xs text-gray-600 font-medium">
                        Don't have a university theater account yet?
                        <a href="{{ route('register') }}"
                           class="font-black text-maroon-700 hover:text-maroon-900 hover:underline ml-1 focus:outline-none focus:ring-2 focus:ring-maroon-700 rounded">
                            Create Student Account &rarr;
                        </a>
                    </p>
                </div>

            </div>
        </div>

    </div>
</div>
@endsection
