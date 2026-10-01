<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ $title ?? 'MSEUF Cinema-Style Theater Ticketing' }}</title>

    <!-- Google Fonts: Plus Jakarta Sans -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700,800&display=swap" rel="stylesheet" />

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
                            50: '#fdf2f2',
                            100: '#fde2e2',
                            200: '#fbc9c9',
                            300: '#f7a4a4',
                            400: '#f07171',
                            500: '#e34242',
                            600: '#c52323',
                            700: '#9b1616',
                            800: '#800000',
                            900: '#680505',
                            950: '#400000',
                        },
                        gold: {
                            400: '#fbbf24',
                            500: '#f59e0b',
                            600: '#d97706',
                        }
                    }
                }
            }
        }
    </script>

    <!-- Alpine.js -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/cdn.min.js"></script>

    <style>
        [x-cloak] { display: none !important; }
    </style>
</head>
<body class="bg-gray-50 text-gray-900 font-sans antialiased min-h-screen flex flex-col selection:bg-maroon-800 selection:text-white">

    <!-- University Header (Maroon & White) -->
    <header class="border-b border-maroon-900 bg-maroon-800 text-white shadow-md sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="{{ route('events.index') }}" class="flex items-center gap-3 group">
                <div class="w-10 h-10 rounded-xl bg-white text-maroon-800 flex items-center justify-center shadow-md font-black text-xl group-hover:scale-105 transition-transform">
                    EU
                </div>
                <div>
                    <div class="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
                        <span>Enverga Theater</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 uppercase tracking-wider font-bold">Cinema Ticketing</span>
                    </div>
                    <p class="text-xs text-maroon-200">Manuel S. Enverga University Foundation</p>
                </div>
            </a>

            <nav class="flex items-center gap-2 text-sm font-semibold">
                <a href="{{ route('events.index') }}" class="px-4 py-2 rounded-lg text-white bg-maroon-900 font-bold shadow-inner hover:bg-maroon-950 transition">
                    Browse Shows
                </a>
            </nav>
        </div>
    </header>

    <!-- Main Content Slot -->
    <main class="flex-1">
        {{ $slot ?? '' }}
        @yield('content')
    </main>

    <!-- University Footer (Maroon & White) -->
    <footer class="border-t border-gray-200 bg-white py-8 text-center text-xs text-gray-500">
        <div class="max-w-7xl mx-auto px-4">
            <p class="font-bold text-maroon-800">&copy; 2026 Manuel S. Enverga University Foundation</p>
            <p class="mt-1 text-gray-500">College of Computing & Multimedia Studies &bull; Theater Ticketing System</p>
        </div>
    </footer>
</body>
</html>
