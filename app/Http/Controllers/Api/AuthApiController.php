<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthApiController extends Controller
{
    /**
     * Register a new student account via Mobile / REST API.
     */
    public function register(Request $request): JsonResponse
    {
        $throttleKey = 'api-register|'.$request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 10)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return response()->json([
                'success' => false,
                'message' => "Too many registration attempts. Please try again in {$seconds} seconds.",
            ], 429);
        }

        $request->merge([
            'name' => trim((string) $request->input('name')),
            'email' => Str::lower(trim((string) $request->input('email'))),
            'student_number' => $request->filled('student_number')
                ? strtoupper(trim((string) $request->input('student_number')))
                : null,
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'student_number' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ]);

        RateLimiter::hit($throttleKey, 60);

        $plainToken = Str::random(60);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => 'student',
            'student_number' => $validated['student_number'] ?? null,
            'password' => Hash::make($validated['password']),
            'api_token' => hash('sha256', $plainToken),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Account created successfully!',
            'token' => $plainToken,
            'user' => $this->formatUser($user),
        ], 201);
    }

    /**
     * Authenticate a user via Mobile / REST API and return an API token.
     */
    public function login(Request $request): JsonResponse
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);

        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $throttleKey = Str::transliterate('api-login|'.$validated['email'].'|'.$request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return response()->json([
                'success' => false,
                'message' => "Too many login attempts. Please wait {$seconds} seconds.",
            ], 429);
        }

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            RateLimiter::hit($throttleKey, 60);

            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password.',
            ], 401);
        }

        RateLimiter::clear($throttleKey);

        $plainToken = Str::random(60);
        $user->update([
            'api_token' => hash('sha256', $plainToken),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Welcome back, {$user->name}!",
            'token' => $plainToken,
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Return the currently authenticated mobile/API user profile and bookings.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $bookings = Booking::with(['event', 'tickets.seat'])
            ->where('user_id', $user->id)
            ->latest()
            ->get()
            ->map(function (Booking $booking) {
                return [
                    'id' => $booking->id,
                    'booking_reference' => $booking->booking_reference,
                    'attendee_name' => $booking->user?->name,
                    'attendee_email' => $booking->user?->email,
                    'total_seats' => $booking->total_seats,
                    'total_amount' => (float) $booking->total_amount,
                    'payment_status' => $booking->payment_status,
                    'gcash_reference' => $booking->gcash_reference,
                    'status' => $booking->status,
                    'created_at' => $booking->created_at?->format('M d, Y h:i A'),
                    'event' => $booking->event ? [
                        'id' => $booking->event->id,
                        'title' => $booking->event->title,
                        'venue' => $booking->event->venue,
                        'formatted_date' => $booking->event->show_date?->format('l, F d, Y'),
                        'formatted_time' => $booking->event->show_date?->format('h:i A'),
                    ] : null,
                    'seats' => $booking->tickets->map(function ($ticket) {
                        return [
                            'seat_id' => $ticket->seat->id,
                            'row' => $ticket->seat->row_label,
                            'number' => $ticket->seat->seat_number,
                            'seat_code' => $ticket->seat->row_label.$ticket->seat->seat_number,
                            'tier' => $ticket->seat->tier,
                            'qr_token' => $ticket->qr_token,
                        ];
                    }),
                ];
            });

        return response()->json([
            'success' => true,
            'user' => $this->formatUser($user),
            'bookings' => $bookings,
        ]);
    }

    /**
     * Invalidate the user's API token.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);

        if ($user) {
            $user->update(['api_token' => null]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Signed out successfully.',
        ]);
    }

    /**
     * Resolve user from Bearer token or session guard.
     */
    public static function resolveUser(Request $request): ?User
    {
        $bearer = $request->bearerToken();
        if ($bearer) {
            $hashed = hash('sha256', $bearer);
            $user = User::where('api_token', $hashed)->first();
            if ($user) {
                return $user;
            }
        }

        return auth()->user();
    }

    protected function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ?? 'student',
            'student_number' => $user->student_number,
        ];
    }
}
