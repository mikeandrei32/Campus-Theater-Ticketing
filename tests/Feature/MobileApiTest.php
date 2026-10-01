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
                    'A', 'B', 'C', 'D', 'E', 'F'
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
}
