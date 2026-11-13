<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\RegistrationVerificationMail;
use App\Models\PendingRegistration;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class AuthController extends Controller
{
    /**
     * Display the MSEUF Theater Login page.
     */
    public function showLogin(): View
    {
        return view('auth.login');
    }

    /**
     * Handle an incoming authentication request with rate limiting and session regeneration.
     */
    public function login(Request $request): RedirectResponse
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);

        $credentials = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string'],
        ], [
            'email.required' => 'Please enter your email address.',
            'email.email' => 'Please enter a valid email address.',
            'password.required' => 'Please enter your password.',
        ]);

        $throttleKey = Str::transliterate($credentials['email'].'|'.$request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages([
                'email' => "Too many login attempts. Please try again in {$seconds} seconds.",
            ]);
        }

        $remember = $request->boolean('remember');

        $existingUser = User::where('email', $credentials['email'])->first();

        if (($existingUser && $existingUser->isMobileAccount()) || User::isStudentDomainEmail($credentials['email'])) {
            RateLimiter::hit($throttleKey, 60);

            throw ValidationException::withMessages([
                'email' => User::isStudentDomainEmail($credentials['email'])
                    ? 'Accounts with @student.mseuf.edu.ph are student accounts and can only log in through the mobile app.'
                    : 'This account was created in the mobile app and can only be logged in using the mobile app.',
            ]);
        }

        if (! Auth::attempt($credentials, $remember)) {
            RateLimiter::hit($throttleKey, 60);

            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our university records.',
            ]);
        }

        RateLimiter::clear($throttleKey);
        $request->session()->regenerate();

        $user = Auth::user();

        return redirect()
            ->intended(route('admin.events.index'))
            ->with('success', "Welcome back, {$user->name}!");
    }

    /**
     * Display the MSEUF Theater Signup / Registration page.
     */
    public function showRegister(): View
    {
        return view('auth.register');
    }

    /**
     * Step 1 of Registration: Validate details, store pending registration, and send 6-digit email verification code.
     */
    public function register(Request $request): RedirectResponse
    {
        $throttleKey = 'register|'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 10)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages([
                'email' => "Too many registration attempts. Please wait {$seconds} seconds before trying again.",
            ]);
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
        ], [
            'name.required' => 'Please enter your full name.',
            'name.min' => 'Your name must be at least 2 characters.',
            'email.required' => 'Please enter your email address.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'An account with this email address already exists.',
            'password.required' => 'Please create a password.',
            'password.confirmed' => 'The password confirmation does not match.',
            'password.min' => 'Your password must be at least 8 characters long.',
        ]);

        RateLimiter::hit($throttleKey, 60);

        $plainCode = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        PendingRegistration::updateOrCreate(
            ['email' => $validated['email']],
            [
                'name' => $validated['name'],
                'student_number' => $validated['student_number'] ?? null,
                'registered_via' => User::isStudentDomainEmail($validated['email']) ? 'mobile' : 'web',
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

        $request->session()->put('pending_registration_email', $validated['email']);

        if (in_array(config('mail.default'), ['log', 'array'], true)) {
            $request->session()->put('demo_verification_code', $plainCode);
        } else {
            $request->session()->forget('demo_verification_code');
        }

        return redirect()
            ->route('register.verify')
            ->with('status', "A 6-digit verification code has been sent to {$validated['email']}. Enter the code below to verify your email and create your account.");
    }

    /**
     * Display the Step 2 Email Verification page before creating the account.
     */
    public function showVerifyRegistration(Request $request): View|RedirectResponse
    {
        $email = Str::lower(trim((string) $request->session()->get('pending_registration_email', $request->query('email', ''))));

        if (! $email) {
            return redirect()
                ->route('register')
                ->with('error', 'Please fill out the registration form first to receive a verification code.');
        }

        $pending = PendingRegistration::where('email', $email)->first();

        if (! $pending) {
            return redirect()
                ->route('register')
                ->with('error', 'No pending registration was found for that email address. Please register again.');
        }

        return view('auth.verify-registration', [
            'email' => $pending->email,
            'name' => $pending->name,
            'demoCode' => $request->session()->get('demo_verification_code'),
        ]);
    }

    /**
     * Step 2 of Registration: Verify the 6-digit email OTP code and create the User account.
     */
    public function verifyRegistration(Request $request): RedirectResponse
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->input('email', $request->session()->get('pending_registration_email', '')))),
            'code' => preg_replace('/\s+/', '', (string) $request->input('code')),
        ]);

        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'code' => ['required', 'string', 'digits:6'],
        ], [
            'code.required' => 'Please enter the 6-digit verification code sent to your email.',
            'code.digits' => 'The verification code must be exactly 6 digits.',
        ]);

        $throttleKey = 'verify-register|'.$validated['email'].'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages([
                'code' => "Too many verification attempts. Please wait {$seconds} seconds before trying again.",
            ]);
        }

        $pending = PendingRegistration::where('email', $validated['email'])->first();

        if (! $pending) {
            throw ValidationException::withMessages([
                'code' => 'No pending registration found for this email. Please start registration again.',
            ]);
        }

        $isStudentDomain = User::isStudentDomainEmail($pending->email);

        if (! $isStudentDomain && ($pending->registered_via ?? 'web') !== 'web') {
            throw ValidationException::withMessages([
                'code' => 'This registration was started in the mobile app. Please verify your account in the mobile app.',
            ]);
        }

        if ($pending->isExpired()) {
            throw ValidationException::withMessages([
                'code' => 'Your verification code has expired. Please click Resend Code to get a new one.',
            ]);
        }

        if (! Hash::check($validated['code'], $pending->verification_code)) {
            RateLimiter::hit($throttleKey, 60);

            throw ValidationException::withMessages([
                'code' => 'Invalid verification code. Please check your email and try again.',
            ]);
        }

        RateLimiter::clear($throttleKey);

        if (User::where('email', $pending->email)->exists()) {
            $pending->delete();

            return redirect()
                ->route('login')
                ->with('error', 'An account with this email already exists. Please sign in.');
        }

        $user = User::create([
            'name' => $pending->name,
            'email' => $pending->email,
            'role' => 'student',
            'registered_via' => $isStudentDomain ? 'mobile' : 'web',
            'student_number' => $pending->student_number,
            'password' => $pending->password,
            'email_verified_at' => Carbon::now(),
        ]);

        $pending->delete();
        $request->session()->forget(['pending_registration_email', 'demo_verification_code']);

        if ($user->isMobileAccount()) {
            return redirect()
                ->route('login')
                ->with('status', "Account created for {$user->email}! Student accounts (@student.mseuf.edu.ph) can only log in through the mobile app.");
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()
            ->intended(route('admin.events.index'))
            ->with('success', "Email verified and account created! Welcome to MSEUF Theater Ticketing, {$user->name}.");
    }

    /**
     * Resend a fresh 6-digit verification code to a pending registration email.
     */
    public function resendVerificationCode(Request $request): RedirectResponse
    {
        $email = Str::lower(trim((string) $request->input('email', $request->session()->get('pending_registration_email', ''))));

        if (! $email) {
            return redirect()->route('register');
        }

        $throttleKey = 'resend-register|'.$email.'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages([
                'code' => "Please wait {$seconds} seconds before requesting another verification code.",
            ]);
        }

        $pending = PendingRegistration::where('email', $email)->first();

        if (! $pending) {
            return redirect()
                ->route('register')
                ->with('error', 'Pending registration not found. Please fill out the registration form again.');
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

        $request->session()->put('pending_registration_email', $pending->email);

        if (in_array(config('mail.default'), ['log', 'array'], true)) {
            $request->session()->put('demo_verification_code', $plainCode);
        }

        return redirect()
            ->route('register.verify')
            ->with('status', "A new 6-digit verification code has been sent to {$pending->email}.");
    }

    /**
     * Log the user out of the application and invalidate their session.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()
            ->route('login')
            ->with('success', 'You have been signed out safely.');
    }

    /**
     * Display the Forgot Password recovery request form.
     */
    public function showForgotPassword(): View
    {
        return view('auth.forgot-password');
    }

    /**
     * Generate a password reset token and provide the recovery flow.
     */
    public function sendResetLink(Request $request): RedirectResponse
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);

        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
        ], [
            'email.required' => 'Please enter your registered email address.',
            'email.email' => 'Please enter a valid email address.',
        ]);

        $throttleKey = 'forgot-password|'.$validated['email'].'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages([
                'email' => "Please wait {$seconds} seconds before requesting another password reset.",
            ]);
        }

        RateLimiter::hit($throttleKey, 60);

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => 'We could not find an account with that email address.',
            ]);
        }

        $plainToken = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => Hash::make($plainToken),
                'created_at' => Carbon::now(),
            ]
        );

        $resetUrl = route('password.reset', [
            'token' => $plainToken,
            'email' => $user->email,
        ]);

        return back()
            ->with('status', 'A password recovery link has been generated for your account.')
            ->with('reset_url', $resetUrl);
    }

    /**
     * Display the Reset Password form.
     */
    public function showResetPassword(Request $request, string $token): View
    {
        return view('auth.reset-password', [
            'token' => $token,
            'email' => $request->query('email', ''),
        ]);
    }

    /**
     * Process the password reset and update the user's password in the database.
     */
    public function resetPassword(Request $request): RedirectResponse
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);

        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ], [
            'password.confirmed' => 'The password confirmation does not match.',
            'password.min' => 'Your new password must be at least 8 characters long.',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (! $record || ! Hash::check($validated['token'], $record->token)) {
            throw ValidationException::withMessages([
                'email' => 'This password reset token is invalid or has already been used.',
            ]);
        }

        if (Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

            throw ValidationException::withMessages([
                'email' => 'This password reset token has expired. Please request a new one.',
            ]);
        }

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => 'We could not find a user with that email address.',
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($validated['password']),
            'remember_token' => Str::random(60),
        ])->save();

        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        return redirect()
            ->route('login')
            ->with('success', 'Your password has been reset successfully! You may now sign in.');
    }
}
