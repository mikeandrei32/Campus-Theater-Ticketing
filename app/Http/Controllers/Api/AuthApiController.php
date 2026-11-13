<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\RegistrationVerificationMail;
use App\Models\Booking;
use App\Models\PendingRegistration;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthApiController extends Controller
{
    /**
     * Step 1: Validate registration inputs and send a 6-digit verification code to the user's email
     * before creating the account.
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
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (! User::isStudentDomainEmail((string) $value)) {
                        $fail('Mobile registration is restricted to MSEUF student emails ending in @student.mseuf.edu.ph.');
                    }
                },
            ],
            'student_number' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ]);

        RateLimiter::hit($throttleKey, 60);

        $plainCode = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        PendingRegistration::updateOrCreate(
            ['email' => $validated['email']],
            [
                'name' => $validated['name'],
                'student_number' => $validated['student_number'] ?? null,
                'registered_via' => 'mobile',
                'password' => Hash::make($validated['password']),
                'verification_code' => Hash::make($plainCode),
                'expires_at' => Carbon::now()->addMinutes(15),
            ]
        );

        Mail::to($validated['email'])->send(new RegistrationVerificationMail(
            recipientName: $validated['name'],
            code: $plainCode,
            expiresInMinutes: 15
        ));

        $payload = [
            'success' => true,
            'requires_verification' => true,
            'email' => $validated['email'],
            'message' => "A 6-digit verification code has been sent to {$validated['email']}. Please verify your email to create your account.",
        ];

        if (in_array(config('mail.default'), ['log', 'array'], true)) {
            $payload['demo_otp'] = $plainCode;
        }

        return response()->json($payload, 200);
    }

    /**
     * Step 2: Verify the 6-digit email OTP code and create the user account.
     */
    public function verifyRegistration(Request $request): JsonResponse
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->input('email'))),
            'code' => preg_replace('/\s+/', '', (string) $request->input('code')),
        ]);

        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'code' => ['required', 'string', 'digits:6'],
        ]);

        if (! User::isStudentDomainEmail($validated['email'])) {
            return response()->json([
                'success' => false,
                'message' => 'Mobile registration is restricted to MSEUF student emails ending in @student.mseuf.edu.ph.',
            ], 422);
        }

        $throttleKey = 'api-verify-register|'.$validated['email'].'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return response()->json([
                'success' => false,
                'message' => "Too many verification attempts. Please wait {$seconds} seconds.",
            ], 429);
        }

        $pending = PendingRegistration::where('email', $validated['email'])->first();

        if (! $pending) {
            return response()->json([
                'success' => false,
                'message' => 'No pending registration found for this email address.',
            ], 404);
        }

        if (! User::isStudentDomainEmail($pending->email) && ($pending->registered_via ?? 'mobile') !== 'mobile') {
            return response()->json([
                'success' => false,
                'message' => 'This registration was started on the website. Please verify your account on the website.',
            ], 403);
        }

        if ($pending->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'Verification code has expired. Please request a new code.',
            ], 422);
        }

        if (! Hash::check($validated['code'], $pending->verification_code)) {
            RateLimiter::hit($throttleKey, 60);

            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code. Please check your email and try again.',
            ], 422);
        }

        RateLimiter::clear($throttleKey);

        if (User::where('email', $pending->email)->exists()) {
            $pending->delete();

            return response()->json([
                'success' => false,
                'message' => 'An account with this email address already exists.',
            ], 409);
        }

        $plainToken = Str::random(60);

        $user = User::create([
            'name' => $pending->name,
            'email' => $pending->email,
            'role' => 'student',
            'registered_via' => 'mobile',
            'student_number' => $pending->student_number,
            'password' => $pending->password,
            'api_token' => hash('sha256', $plainToken),
            'email_verified_at' => Carbon::now(),
        ]);

        $pending->delete();

        return response()->json([
            'success' => true,
            'message' => 'Email verified and account created successfully!',
            'token' => $plainToken,
            'user' => $this->formatUser($user),
        ], 201);
    }

    /**
     * Resend a 6-digit verification code to a pending registration email via API.
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);

        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        $throttleKey = 'api-resend-register|'.$validated['email'].'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return response()->json([
                'success' => false,
                'message' => "Please wait {$seconds} seconds before requesting another code.",
            ], 429);
        }

        $pending = PendingRegistration::where('email', $validated['email'])->first();

        if (! $pending) {
            return response()->json([
                'success' => false,
                'message' => 'No pending registration found for this email address.',
            ], 404);
        }

        RateLimiter::hit($throttleKey, 60);

        $plainCode = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        $pending->update([
            'verification_code' => Hash::make($plainCode),
            'expires_at' => Carbon::now()->addMinutes(15),
        ]);

        Mail::to($pending->email)->send(new RegistrationVerificationMail(
            recipientName: $pending->name,
            code: $plainCode,
            expiresInMinutes: 15
        ));

        $payload = [
            'success' => true,
            'email' => $pending->email,
            'message' => "A new 6-digit verification code has been sent to {$pending->email}.",
        ];

        if (in_array(config('mail.default'), ['log', 'array'], true)) {
            $payload['demo_otp'] = $plainCode;
        }

        return response()->json($payload, 200);
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

        if ($user && $user->isWebAccount()) {
            RateLimiter::hit($throttleKey, 60);

            return response()->json([
                'success' => false,
                'message' => 'This account was created on the website and can only be logged in on the website.',
            ], 403);
        }

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
            if ($user && $user->isMobileAccount()) {
                return $user;
            }
        }

        $sessionUser = auth()->user();

        return ($sessionUser && $sessionUser->isMobileAccount()) ? $sessionUser : null;
    }

    protected function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ?? 'student',
            'registered_via' => $user->registered_via ?? 'mobile',
            'student_number' => $user->student_number,
        ];
    }
}
