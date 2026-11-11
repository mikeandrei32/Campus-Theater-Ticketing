<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@mseuf.edu.ph'],
            [
                'name' => 'MSEUF Theater Admin',
                'role' => 'admin',
                'student_number' => 'ADMIN-001',
                'password' => Hash::make('password'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'student@mseuf.edu.ph'],
            [
                'name' => 'Mike Enverga',
                'role' => 'student',
                'student_number' => 'A23-00142',
                'password' => Hash::make('password'),
            ]
        );

        $this->call([
            TheaterSeatSeeder::class,
            EventSeeder::class,
        ]);
    }
}
