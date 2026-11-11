<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Seat;
use App\Models\TicketSeat;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
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
        $response = $this->post(route('register.submit'), [
            'name' => 'Gabriela Silang',
            'email' => 'Gabriela.Silang@mseuf.edu.ph',
            'student_number' => 'a24-10293',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ]);

        $response->assertRedirect(route('admin.events.index'));
        $this->assertAuthenticated();

        $user = User::where('email', 'gabriela.silang@mseuf.edu.ph')->first();
        $this->assertNotNull($user);
        $this->assertEquals('Gabriela Silang', $user->name);
        $this->assertEquals('A24-10293', $user->student_number);
        $this->assertEquals('student', $user->role);
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
        // 1. Register via API
        $regResponse = $this->postJson(route('api.auth.register'), [
            'name' => 'Mobile Envergan',
            'email' => 'mobile.user@mseuf.edu.ph',
            'student_number' => 'A25-00999',
            'password' => 'MobilePass123',
            'password_confirmation' => 'MobilePass123',
        ]);

        $regResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.email', 'mobile.user@mseuf.edu.ph');

        $token = $regResponse->json('token');
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
            ->assertJsonPath('booking.attendee_email', 'mobile.user@mseuf.edu.ph');

        // 4. Logout via API invalidates token
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson(route('api.auth.logout'))
            ->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'email' => 'mobile.user@mseuf.edu.ph',
            'api_token' => null,
        ]);
    }
}
