<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Event;
use App\Models\Seat;
use App\Models\TicketSeat;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeatBookingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_can_view_events_page(): void
    {
        $response = $this->get(route('events.index'));
        $response->assertStatus(200);
        $response->assertSee('Campus Theater');
        $response->assertSee('Hiyas ng Enverga 2026: Coronation Night');
    }

    public function test_can_view_seat_picker_page(): void
    {
        $event = Event::first();
        $response = $this->get(route('theater.seats', $event));
        $response->assertStatus(200);
        $response->assertSee($event->title);
        $response->assertSee('STAGE / SCREEN');
        $response->assertSee('VIP (Rows A-B)');
        $response->assertSee('Max 4 seats per student');
    }

    public function test_seats_are_grouped_and_occupied_seats_are_flagged(): void
    {
        $event = Event::first();
        $occupiedTickets = TicketSeat::where('event_id', $event->id)->get();

        $response = $this->get(route('theater.seats', $event));
        $response->assertStatus(200);
        $this->assertNotEmpty($occupiedTickets);
    }

    public function test_cannot_book_more_than_four_seats(): void
    {
        $event = Event::where('pricing_type', 'free')->first();
        $seats = Seat::whereNotIn('id', TicketSeat::where('event_id', $event->id)->pluck('seat_id'))
            ->take(5)
            ->pluck('id')
            ->toArray();

        $response = $this->post(route('theater.book', $event), [
            'seat_ids' => $seats,
            'student_name' => 'Test Student',
        ]);

        $response->assertSessionHasErrors('seat_ids');
    }

    public function test_can_book_free_event_without_gcash(): void
    {
        $event = Event::where('pricing_type', 'free')->first();
        $seats = Seat::whereNotIn('id', TicketSeat::where('event_id', $event->id)->pluck('seat_id'))
            ->take(2)
            ->pluck('id')
            ->toArray();

        $response = $this->post(route('theater.book', $event), [
            'seat_ids' => $seats,
            'student_name' => 'Maria Clara',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('bookings', [
            'event_id' => $event->id,
            'total_seats' => 2,
            'payment_status' => 'free',
            'total_amount' => 0.00,
        ]);
    }

    public function test_paid_event_requires_gcash_reference(): void
    {
        $event = Event::where('pricing_type', 'paid')->first();
        $seats = Seat::whereNotIn('id', TicketSeat::where('event_id', $event->id)->pluck('seat_id'))
            ->take(2)
            ->pluck('id')
            ->toArray();

        // Missing GCash
        $response = $this->post(route('theater.book', $event), [
            'seat_ids' => $seats,
            'student_name' => 'Crisostomo Ibarra',
        ]);
        $response->assertSessionHasErrors('gcash_reference');

        // With GCash
        $validResponse = $this->post(route('theater.book', $event), [
            'seat_ids' => $seats,
            'student_name' => 'Crisostomo Ibarra',
            'gcash_reference' => 'GCASH-12345678',
        ]);
        $validResponse->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'event_id' => $event->id,
            'total_seats' => 2,
            'payment_status' => 'paid',
            'gcash_reference' => 'GCASH-12345678',
        ]);
    }

    public function test_collision_prevention_cannot_double_book_seat(): void
    {
        $event = Event::where('pricing_type', 'free')->first();
        $seat = Seat::whereNotIn('id', TicketSeat::where('event_id', $event->id)->pluck('seat_id'))->first();

        // First user books seat
        $this->post(route('theater.book', $event), [
            'seat_ids' => [$seat->id],
            'student_name' => 'First Student',
        ]);

        // Second user tries to book the same seat
        $response = $this->post(route('theater.book', $event), [
            'seat_ids' => [$seat->id],
            'student_name' => 'Second Student',
        ]);

        $response->assertSessionHas('error');
    }

    public function test_marshal_can_validate_ticket(): void
    {
        $ticket = TicketSeat::where('is_checked_in', false)->first() ?? TicketSeat::first();
        $ticket->update(['is_checked_in' => false, 'checked_in_at' => null]);

        $response = $this->postJson(route('marshal.validate'), [
            'token' => $ticket->qr_token,
        ]);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'success']);

        // Second validation attempt should give warning
        $secondResponse = $this->postJson(route('marshal.validate'), [
            'token' => $ticket->qr_token,
        ]);
        $secondResponse->assertStatus(409);
        $secondResponse->assertJson(['status' => 'warning']);
    }

    public function test_marshal_can_validate_via_booking_reference(): void
    {
        $booking = Booking::with('tickets')->first();
        // Reset check-in state
        TicketSeat::where('booking_id', $booking->id)->update(['is_checked_in' => false, 'checked_in_at' => null]);

        $response = $this->postJson(route('marshal.validate'), [
            'token' => $booking->booking_reference,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'verification_type' => 'booking_reference',
            'booking_reference' => $booking->booking_reference,
        ]);

        // Check that database marks all seats as checked in
        $this->assertEquals(0, TicketSeat::where('booking_id', $booking->id)->where('is_checked_in', false)->count());

        // Second attempt with the same booking reference should return warning (already admitted)
        $secondResponse = $this->postJson(route('marshal.validate'), [
            'token' => strtolower($booking->booking_reference), // test case-insensitivity
        ]);

        $secondResponse->assertStatus(409);
        $secondResponse->assertJson([
            'status' => 'warning',
            'verification_type' => 'booking_reference',
        ]);
    }

    public function test_marshal_validation_fails_on_invalid_input(): void
    {
        $response = $this->postJson(route('marshal.validate'), [
            'token' => 'NON-EXISTENT-REF-12345',
        ]);

        $response->assertStatus(404);
        $response->assertJson([
            'status' => 'error',
        ]);
    }
}
