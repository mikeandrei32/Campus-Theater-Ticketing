<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Event;
use App\Models\Seat;
use App\Models\TicketSeat;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        // Default Student User
        $user = User::firstOrCreate(
            ['email' => 'student@mseuf.edu.ph'],
            [
                'name' => 'Mike Enverga',
                'password' => Hash::make('password'),
            ]
        );

        $events = [
            [
                'title' => 'Hiyas ng Enverga 2026: Coronation Night',
                'venue' => 'MSEUF University Theater',
                'show_date' => Carbon::now()->addDays(3)->setTime(18, 0),
                'pricing_type' => 'paid',
                'regular_price' => 150.00,
                'vip_price' => 250.00,
                'banner_image' => 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'title' => 'Enverga University Cultural Night',
                'venue' => 'MSEUF University Theater',
                'show_date' => Carbon::now()->addDays(5)->setTime(19, 30),
                'pricing_type' => 'free',
                'regular_price' => 0.00,
                'vip_price' => 0.00,
                'banner_image' => 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'title' => 'CCMS Drama Fest: The Digital Odyssey',
                'venue' => 'MSEUF University Theater',
                'show_date' => Carbon::now()->addDays(7)->setTime(17, 0),
                'pricing_type' => 'free',
                'regular_price' => 0.00,
                'vip_price' => 0.00,
                'banner_image' => 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'title' => 'MSEUF Symphony & Theater Guild Showcase',
                'venue' => 'MSEUF University Theater',
                'show_date' => Carbon::now()->addDays(12)->setTime(20, 0),
                'pricing_type' => 'paid',
                'regular_price' => 180.00,
                'vip_price' => 300.00,
                'banner_image' => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
            ],
        ];

        foreach ($events as $eventData) {
            $event = Event::firstOrCreate(
                ['title' => $eventData['title']],
                $eventData
            );

            // Seed a few pre-occupied seats for realism on the first event
            if ($event->title === 'Hiyas ng Enverga 2026: Coronation Night') {
                $occupiedSeats = Seat::whereIn('row_label', ['A', 'C', 'D'])
                    ->whereIn('seat_number', [4, 5, 6])
                    ->get();

                if ($occupiedSeats->isNotEmpty() && TicketSeat::where('event_id', $event->id)->count() === 0) {
                    $total = 0;
                    foreach ($occupiedSeats as $seat) {
                        $total += ($seat->tier === 'vip') ? $event->vip_price : $event->regular_price;
                    }

                    $demoBooking = Booking::create([
                        'user_id' => $user->id,
                        'event_id' => $event->id,
                        'booking_reference' => 'ENVERGA-DEMO01',
                        'total_seats' => $occupiedSeats->count(),
                        'total_amount' => $total,
                        'payment_status' => 'paid',
                        'gcash_reference' => 'GCASH-984712',
                        'status' => 'confirmed',
                    ]);

                    foreach ($occupiedSeats as $seat) {
                        TicketSeat::create([
                            'booking_id' => $demoBooking->id,
                            'event_id' => $event->id,
                            'seat_id' => $seat->id,
                            'qr_token' => (string) Str::uuid(),
                            'is_checked_in' => false,
                        ]);
                    }
                }
            }
        }
    }
}
