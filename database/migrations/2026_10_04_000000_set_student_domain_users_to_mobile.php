<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'registered_via')) {
            DB::table('users')
                ->whereRaw('LOWER(email) LIKE ?', ['%@student.mseuf.edu.ph'])
                ->update([
                    'registered_via' => 'mobile',
                    'role' => 'student',
                ]);
        }

        if (Schema::hasTable('pending_registrations') && Schema::hasColumn('pending_registrations', 'registered_via')) {
            DB::table('pending_registrations')
                ->whereRaw('LOWER(email) LIKE ?', ['%@student.mseuf.edu.ph'])
                ->update([
                    'registered_via' => 'mobile',
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op: retain platform assignments
    }
};
