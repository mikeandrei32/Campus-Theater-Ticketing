<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ $title ?? 'Admin Portal • MSEUF Theater & Cinema Ticketing' }}</title>

    <!-- Google Fonts: Plus Jakarta Sans (Modern & Clean) -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700,800,900&display=swap" rel="stylesheet" />

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                    },
                    colors: {
                        maroon: {
                            50: '#FBF0F0',
                            100: '#F5DCDC',
                            200: '#E5C4C4',
                            300: '#D49B9B',
                            400: '#B85E5E',
                            500: '#A30000',
                            600: '#900000',
                            700: '#800000', // Main MSEUF Maroon
                            800: '#6E0000',
                            900: '#5A0000', // Dark Maroon
                            950: '#3D0000',
                        },
                        vipGold: {
                            light: '#FEF3C7',
                            border: '#FCD34D',
                            DEFAULT: '#D97706',
                            dark: '#92400E',
                        }
                    }
                }
            }
        }
    </script>

    <!-- Alpine.js (Lightweight interactivity) -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/cdn.min.js"></script>

    <style>
        [x-cloak] { display: none !important; }
    </style>
</head>
<body class="bg-[#F8FAFC] text-gray-900 font-sans antialiased min-h-screen flex flex-col selection:bg-maroon-700 selection:text-white" x-data="{ mobileMenu: false }">

    <!-- ========================================================================= -->
    <!-- 1. MSEUF ADMIN HEADER (Identical Color Scheme to Mobile App)             -->
    <!-- ========================================================================= -->
    <header class="bg-gradient-to-r from-maroon-900 via-maroon-700 to-maroon-900 text-white shadow-lg border-b-[3px] border-vipGold sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-20">
                
                <!-- Brand / Logo (Matches Mobile App Header) -->
                <a href="{{ auth()->check() ? route('admin.events.index') : route('login') }}" class="flex items-center gap-3.5 group">
                    <!-- EU Crest Circle -->
                    <div class="w-11 h-11 rounded-full bg-white text-maroon-700 flex items-center justify-center font-black text-lg border-2 border-vipGold shadow-md group-hover:scale-105 transition-transform">
                        EU
                    </div>
                    <div>
                        <div class="font-black text-xs sm:text-sm tracking-wider text-white uppercase flex items-center gap-2">
                            <span>MANUEL S. ENVERGA UNIVERSITY</span>
                            <span class="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-vipGold text-maroon-950 font-extrabold tracking-tight">ADMIN PORTAL</span>
                        </div>
                        <div class="text-[11px] sm:text-xs font-bold text-vipGold tracking-wide">
                            UNIVERSITY THEATER & ARTS • SHOW POSTING & SEATS
                        </div>
                    </div>
                </a>

                <!-- Desktop Navigation Links -->
                <nav class="hidden md:flex items-center gap-1.5 lg:gap-2 text-xs font-bold">
                    @auth
                        <a href="{{ route('admin.events.index') }}" 
                           class="px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 {{ request()->routeIs('admin.events.index') || request()->is('/') ? 'bg-white/20 text-white border border-white/30 shadow-inner' : 'text-maroon-100 hover:bg-white/10 hover:text-white' }}">
                            <span>Shows & Plays</span>
                        </a>

                        @if(auth()->user()?->canManageTheater())
                            <a href="{{ route('admin.events.create') }}" 
                               class="px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 {{ request()->routeIs('admin.events.create') ? 'bg-vipGold text-maroon-950 font-black shadow-md' : 'bg-vipGold/90 hover:bg-vipGold text-maroon-950 font-extrabold shadow-sm' }}">
                                <span>+ Post Show</span>
                            </a>

                            <a href="{{ route('admin.bookings.index') }}" 
                               class="px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 {{ request()->routeIs('admin.bookings.index') ? 'bg-white/20 text-white border border-white/30 shadow-inner' : 'text-maroon-100 hover:bg-white/10 hover:text-white' }}">
                                <span>Reservations</span>
                            </a>

                            <a href="{{ route('admin.scanner') }}" 
                               class="px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 {{ request()->routeIs('admin.scanner') || request()->is('marshal/*') ? 'bg-white/20 text-white border border-white/30 shadow-inner' : 'text-maroon-100 hover:bg-white/10 hover:text-white' }}">
                                <span>Gate Scanner</span>
                            </a>
                        @endif

                        <div class="h-6 w-px bg-white/20 mx-1"></div>

                        <a href="{{ route('tickets.my-tickets') }}"
                           class="px-3 py-2 rounded-xl transition flex items-center gap-1.5 {{ request()->routeIs('tickets.my-tickets') || request()->routeIs('bookings.my') ? 'bg-white/20 text-white border border-white/30' : 'text-maroon-100 hover:bg-white/10 hover:text-white' }}">
                            <span>My Passes</span>
                        </a>

                        <div class="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-black/25 border border-white/15">
                            <div class="w-7 h-7 rounded-full bg-vipGold text-maroon-950 font-black text-[11px] flex items-center justify-center uppercase">
                                {{ substr(auth()->user()->name, 0, 1) }}
                            </div>
                            <div class="text-left leading-tight max-w-[110px]">
                                <div class="text-[11px] font-extrabold text-white truncate">{{ auth()->user()->name }}</div>
                                <div class="text-[9px] font-bold text-vipGold uppercase tracking-wider">{{ auth()->user()->role ?? 'student' }}</div>
                            </div>
                            <form method="POST" action="{{ route('logout') }}" class="inline">
                                @csrf
                                <button type="submit"
                                        title="Sign Out"
                                        class="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-red-600/80 text-white text-[11px] font-extrabold transition">
                                    Sign Out
                                </button>
                            </form>
                        </div>
                    @else
                        <a href="{{ route('login') }}"
                           class="px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 {{ request()->routeIs('login') ? 'bg-vipGold text-maroon-950 font-black shadow-md' : 'text-white hover:bg-white/15 border border-white/25' }}">
                            <span>Sign In</span>
                        </a>

                        <a href="{{ route('register') }}"
                           class="px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 {{ request()->routeIs('register') || request()->routeIs('signup') ? 'bg-vipGold text-maroon-950 font-black shadow-md' : 'bg-white text-maroon-800 hover:bg-maroon-50 font-extrabold shadow-sm' }}">
                            <span>Create Account</span>
                        </a>
                    @endauth
                </nav>

                <!-- Mobile Hamburger Button -->
                <button @click="mobileMenu = !mobileMenu" aria-label="Toggle navigation menu" class="md:hidden p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 focus:outline-none">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path x-show="!mobileMenu" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" />
                        <path x-show="mobileMenu" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Mobile Navigation Menu -->
        <div x-show="mobileMenu" x-cloak class="md:hidden border-t border-maroon-800 bg-maroon-900 px-4 py-4 space-y-2">
            @auth
                <a href="{{ route('admin.events.index') }}" class="block px-3 py-2 rounded-lg text-sm font-bold text-white bg-maroon-800">
                    Shows & Plays Catalog
                </a>
                <a href="{{ route('admin.events.create') }}" class="block px-3 py-2 rounded-lg text-sm font-black text-maroon-950 bg-vipGold">
                    + Post New Play / Cine Show
                </a>
                <a href="{{ route('admin.bookings.index') }}" class="block px-3 py-2 rounded-lg text-sm font-bold text-maroon-100 hover:text-white">
                    Student Reservations
                </a>
                <a href="{{ route('admin.scanner') }}" class="block px-3 py-2 rounded-lg text-sm font-bold text-maroon-100 hover:text-white">
                    Gate Marshal Scanner
                </a>

                <div class="pt-2 mt-2 border-t border-maroon-800 space-y-2">
                    <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-maroon-950/60">
                        <div>
                            <div class="text-xs font-black text-white">{{ auth()->user()->name }}</div>
                            <div class="text-[10px] text-vipGold font-bold uppercase">{{ auth()->user()->email }}</div>
                        </div>
                        <a href="{{ route('tickets.my-tickets') }}" class="px-2.5 py-1 rounded bg-white/15 text-white text-xs font-bold">
                            My Passes
                        </a>
                    </div>
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <button type="submit" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-red-200 hover:bg-red-900/40">
                            Sign Out
                        </button>
                    </form>
                </div>
            @else
                <div class="grid grid-cols-2 gap-2">
                    <a href="{{ route('login') }}" class="text-center px-3 py-2.5 rounded-lg text-xs font-black {{ request()->routeIs('login') ? 'bg-vipGold text-maroon-950' : 'text-white border border-white/30 bg-white/10' }}">
                        Sign In
                    </a>
                    <a href="{{ route('register') }}" class="text-center px-3 py-2.5 rounded-lg text-xs font-black {{ request()->routeIs('register') || request()->routeIs('signup') ? 'bg-vipGold text-maroon-950' : 'text-maroon-950 bg-white' }}">
                        Create Account
                    </a>
                </div>
            @endauth
        </div>
    </header>

    <!-- ========================================================================= -->
    <!-- 2. CAMPUS TAGLINE BANNER (Identical to Mobile App Tagline)                -->
    <!-- ========================================================================= -->
    <div class="bg-[#FBF0F0] border-b border-[#E5C4C4] py-2 px-4 text-center">
        <p class="text-xs font-extrabold text-maroon-700 tracking-wide uppercase flex items-center justify-center gap-2">
            <span>MSEUF CAMPUS THEATER ADMIN & PLAY PUBLISHER • POST SHOWS FOR STUDENT MOBILE APP</span>
        </p>
    </div>

    <!-- ========================================================================= -->
    <!-- 3. FLASH NOTIFICATIONS (Success / Error alerts)                           -->
    <!-- ========================================================================= -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        @if(session('success'))
            <div x-data="{ show: true }" x-show="show" class="flex items-center justify-between p-4 mb-4 text-sm text-emerald-900 bg-emerald-100 border-2 border-emerald-400 rounded-2xl shadow-sm">
                <div class="flex items-center gap-3">
                    <span class="font-bold">{{ session('success') }}</span>
                </div>
                <button @click="show = false" class="text-emerald-700 hover:text-emerald-900 text-lg font-black">&times;</button>
            </div>
        @endif

        @if(session('error'))
            <div x-data="{ show: true }" x-show="show" class="flex items-center justify-between p-4 mb-4 text-sm text-red-900 bg-red-100 border-2 border-red-400 rounded-2xl shadow-sm">
                <div class="flex items-center gap-3">
                    <span class="font-bold">{{ session('error') }}</span>
                </div>
                <button @click="show = false" class="text-red-700 hover:text-red-900 text-lg font-black">&times;</button>
            </div>
        @endif

        @if($errors->any())
            <div class="p-4 mb-4 text-sm text-red-900 bg-red-50 border-2 border-red-300 rounded-2xl shadow-sm">
                <p class="font-black mb-1 flex items-center gap-2">
                    Please fix the following errors:
                </p>
                <ul class="list-disc list-inside text-xs space-y-0.5 text-red-800">
                    @foreach($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif
    </div>

    <!-- ========================================================================= -->
    <!-- 4. MAIN ADMIN CONTENT SLOT                                                -->
    <!-- ========================================================================= -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        @yield('content')
    </main>

    <!-- ========================================================================= -->
    <!-- 5. UNIVERSITY FOOTER                                                      -->
    <!-- ========================================================================= -->
    <footer class="border-t border-gray-200 bg-white py-8 text-center text-xs text-gray-500 mt-12">
        <div class="max-w-7xl mx-auto px-4">
            <div class="flex items-center justify-center gap-2 mb-2">
                <span class="w-6 h-6 rounded-full bg-maroon-700 text-white font-black text-[10px] flex items-center justify-center">EU</span>
                <span class="font-black text-maroon-900 tracking-wide">Manuel S. Enverga University Foundation</span>
            </div>
            <p class="font-medium text-gray-600">College of Computing & Multimedia Studies &bull; Admin Theater Ticketing Portal</p>
            <p class="text-[11px] text-gray-400 mt-1">&copy; {{ date('Y') }} MSEUF Cinema-Style Theater Management System</p>
        </div>
    </footer>

</body>
</html>
