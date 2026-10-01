<?php

namespace Database\Seeders;

use App\Models\Seat;
use Illuminate\Database\Seeder;

class TheaterSeatSeeder extends Seeder
{
    public function run(): void
    {
        $rows = ['A', 'B', 'C', 'D', 'E', 'F']; // 6 Rows
        $seatsPerRow = 10; // 10 Seats per row (60 total)

        foreach ($rows as $row) {
            for ($num = 1; $num <= $seatsPerRow; $num++) {
                Seat::firstOrCreate([
                    'row_label' => $row,
                    'seat_number' => $num,
                ], [
                    // Rows A and B are VIP front-row
                    'tier' => in_array($row, ['A', 'B']) ? 'vip' : 'regular',
                ]);
            }
        }
    }
}
