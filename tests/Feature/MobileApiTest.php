<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Seat;
use App\Models\TicketSeat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MobileApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_can_fetch_events_list_api(): void
    {
        $response = $this->getJson(route('api.events.index'));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'venue',
                        'show_date',
                        'pricing_type',
                        'regular_price',
                        'vip_price',
                        'booked_seats_count',
                        'total_seats',
                        'available_seats_count',
                    ],
                ],
            ]);
    }

    public function test_can_fetch_seats_layout_api(): void
    {
        $event = Event::first();
        $response = $this->getJson(route('api.events.seats', $event));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'event',
                'seats_by_row' => [
                    'A', 'B', 'C', 'D', 'E', 'F',
                ],
                'occupied_seat_ids',
                'total_seats',
                'max_selection_limit',
            ]);
    }

    public function test_can_book_seats_via_api(): void
    {
        $event = Event::where('pricing_type', 'free')->first();
        $availableSeats = Seat::whereNotIn('id', TicketSeat::where('event_id', $event->id)->pluck('seat_id'))
            ->take(2)
            ->pluck('id')
            ->toArray();

        $response = $this->postJson(route('api.events.book', $event), [
            'seat_ids' => $availableSeats,
            'student_name' => 'Mobile Student Attendee',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Seats successfully reserved!',
            ])
            ->assertJsonPath('booking.total_seats', 2);
    }

    public function test_admin_can_login_and_manage_theater_on_mobile_api(): void
    {
        $loginRes = $this->postJson(route('api.auth.login'), [
            'email' => 'admin@mseuf.edu.ph',
            'password' => 'Password123!',
        ]);

        $loginRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonPath('user.is_admin', true)
            ->assertJsonPath('user.can_manage_theater', true);

        $token = $loginRes->json('token');

        // 1. Fetch Admin Dashboard
        $dashRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson(route('api.admin.dashboard'));
        $dashRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'stats' => ['total_events', 'total_bookings', 'total_seats_reserved', 'total_revenue', 'total_seats'],
                'events',
                'preset_posters',
            ]);

        // 2. Create Show via Mobile Admin API
        $createRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson(route('api.admin.events.store'), [
                'title' => 'Mobile Admin Published Play',
                'show_date' => '2026-12-20 18:00:00',
                'pricing_type' => 'paid',
                'regular_price' => 150,
                'vip_price' => 300,
            ]);
        $createRes->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('event.title', 'Mobile Admin Published Play');

        $eventId = $createRes->json('event.id');

        // 3. View Event Overview & 60-Seat Live Map
        $showRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson(route('api.admin.events.show', $eventId));
        $showRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('stats.total_seats', 60);

        // 4. Update Event via Mobile Admin API
        $updateRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson(route('api.admin.events.update', $eventId), [
                'title' => 'Updated Mobile Play Title',
                'show_date' => '2026-12-21 19:00:00',
                'pricing_type' => 'free',
            ]);
        $updateRes->assertStatus(200)
            ->assertJsonPath('event.title', 'Updated Mobile Play Title')
            ->assertJsonPath('event.pricing_type', 'free');

        // 5. Fetch Admin Bookings & Scanner
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson(route('api.admin.bookings.index'))
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson(route('api.admin.scanner'))
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        // 6. Delete Event
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson(route('api.admin.events.destroy', $eventId))
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }
}
