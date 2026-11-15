<?php

namespace Tests\Feature;

use App\Mail\RegistrationVerificationMail;
use App\Models\Event;
use App\Models\PendingRegistration;
use App\Models\Seat;
use App\Models\TicketSeat;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_opening_root_redirects_to_login_first_and_login_and_register_are_separate_pages(): void
    {
        // Opening '/' when unauthenticated redirects to Sign In (/login) first
        $rootResponse = $this->get('/');
        $rootResponse->assertRedirect(route('login'));

        // Dedicated Login page (/login)
        $loginResponse = $this->get(route('login'));
        $loginResponse->assertStatus(200);
        $loginResponse->assertSee('Sign In to Your Account');
        $loginResponse->assertDontSee('Join MSEUF University Theater');
        $loginResponse->assertSee('MANUEL S. ENVERGA UNIVERSITY');
        $loginResponse->assertSee('showPassword', false);
        $loginResponse->assertSee(route('register'), false);
        $loginResponse->assertSee(route('password.request'), false);

        // Dedicated Register page (/register)
        $registerResponse = $this->get(route('register'));
        $registerResponse->assertStatus(200);
        $registerResponse->assertSee('Create Your Account');
        $registerResponse->assertSee('Join MSEUF University Theater');
        $registerResponse->assertDontSee('Sign In to Your Account');
        $registerResponse->assertSee('showPassword', false);
        $registerResponse->assertSee(route('login'), false);

        // /signup alias also renders the separate registration page
        $signupAliasResponse = $this->get(route('signup'));
        $signupAliasResponse->assertStatus(200);
        $signupAliasResponse->assertSee('Create Your Account');
    }

    public function test_user_can_register_with_valid_inputs(): void
    {
        Mail::fake();

        // Step 1: Submit registration form -> creates pending registration & sends verification email, does NOT create User yet
        $response = $this->post(route('register.submit'), [
            'name' => 'Gabriela Silang',
            'email' => 'Gabriela.Silang@mseuf.edu.ph',
            'student_number' => 'a24-10293',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ]);

        $response->assertRedirect(route('register.verify'));
        $this->assertGuest();
        $this->assertNull(User::where('email', 'gabriela.silang@mseuf.edu.ph')->first());

        $pending = PendingRegistration::where('email', 'gabriela.silang@mseuf.edu.ph')->first();
        $this->assertNotNull($pending);
        $this->assertEquals('Gabriela Silang', $pending->name);
        $this->assertEquals('A24-10293', $pending->student_number);

        $sentCode = null;
        Mail::assertSent(RegistrationVerificationMail::class, function (RegistrationVerificationMail $mail) use (&$sentCode) {
            $sentCode = $mail->code;

            return $mail->hasTo('gabriela.silang@mseuf.edu.ph');
        });
        $this->assertNotNull($sentCode);
        $this->assertEquals(6, strlen($sentCode));

        // Verification page renders properly
        $verifyPage = $this->get(route('register.verify'));
        $verifyPage->assertStatus(200);
        $verifyPage->assertSee('gabriela.silang@mseuf.edu.ph');

        // Rejects wrong verification code and still does not create the account
        $wrongCodeResponse = $this->post(route('register.verify.submit'), [
            'code' => '000000',
        ]);
        $wrongCodeResponse->assertSessionHasErrors('code');
        $this->assertGuest();
        $this->assertNull(User::where('email', 'gabriela.silang@mseuf.edu.ph')->first());

        // Step 2: Submit valid 6-digit verification code -> creates User account, marks email verified, logs in
        $verifyResponse = $this->post(route('register.verify.submit'), [
            'code' => $sentCode,
        ]);

        $verifyResponse->assertRedirect(route('admin.events.index'));
        $this->assertAuthenticated();
        $this->assertDatabaseMissing('pending_registrations', [
            'email' => 'gabriela.silang@mseuf.edu.ph',
        ]);

        $user = User::where('email', 'gabriela.silang@mseuf.edu.ph')->first();
        $this->assertNotNull($user);
        $this->assertEquals('Gabriela Silang', $user->name);
        $this->assertEquals('A24-10293', $user->student_number);
        $this->assertEquals('student', $user->role);
        $this->assertNotNull($user->email_verified_at);
        $this->assertTrue(Hash::check('SecurePass123!', $user->password));
    }

    public function test_duplicate_account_registration_is_prevented(): void
    {
        $response = $this->post(route('register.submit'), [
            'name' => 'Duplicate Student',
            'email' => 'STUDENT@mseuf.edu.ph', // already seeded as student@mseuf.edu.ph
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_invalid_signup_inputs_are_rejected(): void
    {
        $response = $this->post(route('register.submit'), [
            'name' => 'A', // too short
            'email' => 'not-an-email',
            'password' => 'short', // < 8 chars
            'password_confirmation' => 'mismatch',
        ]);

        $response->assertSessionHasErrors(['name', 'email', 'password']);
        $this->assertGuest();
    }

    public function test_user_can_login_with_correct_credentials_and_remember_me(): void
    {
        $admin = User::where('email', 'admin@mseuf.edu.ph')->first();
        $this->assertNotNull($admin);
        $this->assertTrue($admin->isAdmin());
        $this->assertTrue($admin->canManageTheater());

        $adminLogin = $this->post(route('login.submit'), [
            'email' => 'admin@mseuf.edu.ph',
            'password' => 'Password123!',
            'remember' => '1',
        ]);
        $adminLogin->assertRedirect(route('admin.events.index'));
        $this->assertAuthenticatedAs($admin);

        $this->post(route('logout'));

        $user = User::where('email', 'student@mseuf.edu.ph')->first();

        $response = $this->post(route('login.submit'), [
            'email' => 'student@mseuf.edu.ph',
            'password' => 'password',
            'remember' => '1',
        ]);

        $response->assertRedirect(route('admin.events.index'));
        $this->assertAuthenticatedAs($user);
    }

    public function test_user_cannot_login_with_incorrect_credentials(): void
    {
        $response = $this->post(route('login.submit'), [
            'email' => 'student@mseuf.edu.ph',
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_login_is_rate_limited_after_five_failed_attempts(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post(route('login.submit'), [
                'email' => 'student@mseuf.edu.ph',
                'password' => 'wrong-password',
            ]);
        }

        $response = $this->post(route('login.submit'), [
            'email' => 'student@mseuf.edu.ph',
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors('email');
        $errors = session('errors')->get('email');
        $this->assertStringContainsString('Too many login attempts', $errors[0]);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::where('email', 'student@mseuf.edu.ph')->first();
        $this->actingAs($user);

        $response = $this->post(route('logout'));

        $response->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_protected_routes_require_authentication(): void
    {
        // Guest trying to access protected routes is redirected to /login
        $this->get(route('tickets.my-tickets'))->assertRedirect(route('login'));
        $this->get(route('admin.events.create'))->assertRedirect(route('login'));
        $this->get(route('admin.bookings.index'))->assertRedirect(route('login'));

        // Authenticated user can access them
        $newUser = User::factory()->create([
            'name' => 'New Student With No Bookings',
            'email' => 'newstudent@mseuf.edu.ph',
        ]);

        $this->actingAs($newUser)
            ->get(route('tickets.my-tickets'))
            ->assertStatus(200)
            ->assertSee('No Theater Passes Yet');

        $this->actingAs($newUser)
            ->get(route('admin.events.create'))
            ->assertStatus(200)
            ->assertSee('Post Campus Play or Cine Show');
    }

    public function test_password_recovery_flow_works_end_to_end(): void
    {
        $this->get(route('password.request'))->assertStatus(200);

        $response = $this->post(route('password.email'), [
            'email' => 'student@mseuf.edu.ph',
        ]);

        $response->assertSessionHas('status');
        $response->assertSessionHas('reset_url');

        // Extract token from reset_url
        $resetUrl = session('reset_url');
        $parsedPath = parse_url($resetUrl, PHP_URL_PATH);
        $segments = explode('/', trim($parsedPath, '/'));
        $token = end($segments);

        $resetResponse = $this->post(route('password.update'), [
            'token' => $token,
            'email' => 'student@mseuf.edu.ph',
            'password' => 'NewPassword789!',
            'password_confirmation' => 'NewPassword789!',
        ]);

        $resetResponse->assertRedirect(route('login'));

        $user = User::where('email', 'student@mseuf.edu.ph')->first();
        $this->assertTrue(Hash::check('NewPassword789!', $user->password));
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'student@mseuf.edu.ph',
        ]);
    }

    public function test_mobile_api_authentication_and_authenticated_booking(): void
    {
        Mail::fake();

        // 0. Any valid email domain (e.g. @outlook.com, @mseuf.edu.ph, @student.mseuf.edu.ph) is accepted on mobile registration
        $anyDomainResponse = $this->postJson(route('api.auth.register'), [
            'name' => 'Outlook Attendee',
            'email' => 'attendee.user@outlook.com',
            'student_number' => 'A25-00998',
            'password' => 'MobilePass123',
            'password_confirmation' => 'MobilePass123',
        ]);
        $anyDomainResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('requires_verification', true)
            ->assertJsonPath('email', 'attendee.user@outlook.com');

        // 1a. Initiate registration via API -> sends verification email, does not create user yet
        $regResponse = $this->postJson(route('api.auth.register'), [
            'name' => 'Mobile Envergan',
            'email' => 'mobile.user@student.mseuf.edu.ph',
            'student_number' => 'A25-00999',
            'password' => 'MobilePass123',
            'password_confirmation' => 'MobilePass123',
        ]);

        $regResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('requires_verification', true)
            ->assertJsonPath('email', 'mobile.user@student.mseuf.edu.ph');

        $this->assertNull(User::where('email', 'mobile.user@student.mseuf.edu.ph')->first());

        $sentCode = null;
        Mail::assertSent(RegistrationVerificationMail::class, function (RegistrationVerificationMail $mail) use (&$sentCode) {
            $sentCode = $mail->code;

            return $mail->hasTo('mobile.user@student.mseuf.edu.ph');
        });
        $this->assertNotNull($sentCode);

        // 1b. Verify registration code via API -> creates user and returns Bearer token
        $verifyResponse = $this->postJson(route('api.auth.verify'), [
            'email' => 'mobile.user@student.mseuf.edu.ph',
            'code' => $sentCode,
        ]);

        $verifyResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.email', 'mobile.user@student.mseuf.edu.ph');

        $token = $verifyResponse->json('token');
        $this->assertNotEmpty($token);

        // 2. Fetch /api/auth/me with Bearer token
        $meResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson(route('api.auth.me'));

        $meResponse->assertStatus(200)
            ->assertJsonPath('user.name', 'Mobile Envergan');

        // 3. Book seats via API while authenticated
        $event = Event::where('pricing_type', 'free')->first();
        $seat = Seat::whereNotIn('id', TicketSeat::where('event_id', $event->id)->pluck('seat_id'))->first();

        $bookResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson(route('api.events.book', $event), [
                'seat_ids' => [$seat->id],
            ]);

        $bookResponse->assertStatus(201)
            ->assertJsonPath('booking.attendee_email', 'mobile.user@student.mseuf.edu.ph');

        // 4. Logout via API invalidates token
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson(route('api.auth.logout'))
            ->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'email' => 'mobile.user@student.mseuf.edu.ph',
            'registered_via' => 'mobile',
            'api_token' => null,
        ]);
    }

    public function test_mobile_account_can_only_login_on_mobile_and_web_account_can_only_login_on_web(): void
    {
        Mail::fake();

        // 1. Create a Mobile account via Mobile API
        $this->postJson(route('api.auth.register'), [
            'name' => 'Mobile Only Student',
            'email' => 'mobile.only@student.mseuf.edu.ph',
            'student_number' => 'A26-11111',
            'password' => 'MobilePass123!',
            'password_confirmation' => 'MobilePass123!',
        ])->assertStatus(200);

        $mobileOtp = null;
        Mail::assertSent(RegistrationVerificationMail::class, function (RegistrationVerificationMail $mail) use (&$mobileOtp) {
            if ($mail->hasTo('mobile.only@student.mseuf.edu.ph')) {
                $mobileOtp = $mail->code;

                return true;
            }

            return false;
        });

        $this->postJson(route('api.auth.verify'), [
            'email' => 'mobile.only@student.mseuf.edu.ph',
            'code' => $mobileOtp,
        ])->assertStatus(201);

        // Mobile account CAN log in via Mobile API
        $mobileLoginOnMobile = $this->postJson(route('api.auth.login'), [
            'email' => 'mobile.only@student.mseuf.edu.ph',
            'password' => 'MobilePass123!',
        ]);
        $mobileLoginOnMobile->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.registered_via', 'mobile');

        // Mobile account CANNOT log in on the Website
        $mobileLoginOnWeb = $this->post(route('login.submit'), [
            'email' => 'mobile.only@student.mseuf.edu.ph',
            'password' => 'MobilePass123!',
        ]);
        $mobileLoginOnWeb->assertSessionHasErrors('email');
        $this->assertGuest();

        // 2. Web account (e.g. seeded student@mseuf.edu.ph or newly registered on website) CANNOT log in via Mobile API
        $webLoginOnMobile = $this->postJson(route('api.auth.login'), [
            'email' => 'student@mseuf.edu.ph',
            'password' => 'password',
        ]);
        $webLoginOnMobile->assertStatus(403)
            ->assertJsonPath('success', false);

        // Web account CAN log in on the Website
        $webLoginOnWeb = $this->post(route('login.submit'), [
            'email' => 'student@mseuf.edu.ph',
            'password' => 'password',
        ]);
        $webLoginOnWeb->assertRedirect(route('admin.events.index'));
        $this->assertAuthenticated();
    }

    public function test_student_domain_account_can_only_login_on_mobile_and_cannot_edit_like_admin(): void
    {
        Mail::fake();

        // Register a @student.mseuf.edu.ph account (even if submitted from web registration form)
        $this->post(route('register.submit'), [
            'name' => 'Mike Andrei Gomez',
            'email' => 'a23-36954@student.mseuf.edu.ph',
            'student_number' => 'A23-36954',
            'password' => 'StudentPass123!',
            'password_confirmation' => 'StudentPass123!',
        ])->assertRedirect(route('register.verify'));

        $otp = null;
        Mail::assertSent(RegistrationVerificationMail::class, function (RegistrationVerificationMail $mail) use (&$otp) {
            if ($mail->hasTo('a23-36954@student.mseuf.edu.ph')) {
                $otp = $mail->code;

                return true;
            }

            return false;
        });

        // Verifying on web creates the user as mobile-only and does NOT log them into the website
        $verifyRes = $this->post(route('register.verify.submit'), [
            'code' => $otp,
        ]);
        $verifyRes->assertRedirect(route('login'));
        $this->assertGuest();

        $studentUser = User::where('email', 'a23-36954@student.mseuf.edu.ph')->first();
        $this->assertNotNull($studentUser);
        $this->assertTrue($studentUser->isMobileAccount());
        $this->assertFalse($studentUser->canManageTheater());

        // Cannot log in on the website
        $this->post(route('login.submit'), [
            'email' => 'a23-36954@student.mseuf.edu.ph',
            'password' => 'StudentPass123!',
        ])->assertSessionHasErrors('email');
        $this->assertGuest();

        // Cannot edit, create, or delete shows on the website even if actingAs session existed
        $event = Event::first();
        $this->actingAs($studentUser)
            ->get(route('admin.events.edit', $event))
            ->assertRedirect(route('login'));
        $this->assertGuest();

        // CAN log in through the mobile app API
        $this->postJson(route('api.auth.login'), [
            'email' => 'a23-36954@student.mseuf.edu.ph',
            'password' => 'StudentPass123!',
        ])->assertStatus(200)
            ->assertJsonPath('success', true);
    }
}
