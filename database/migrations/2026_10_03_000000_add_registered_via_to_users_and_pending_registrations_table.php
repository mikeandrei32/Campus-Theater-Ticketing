<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'registered_via')) {
                $table->string('registered_via', 20)->default('web')->after('role');
            }
        });

        Schema::table('pending_registrations', function (Blueprint $table) {
            if (! Schema::hasColumn('pending_registrations', 'registered_via')) {
                $table->string('registered_via', 20)->default('web')->after('student_number');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'registered_via')) {
                $table->dropColumn('registered_via');
            }
        });

        Schema::table('pending_registrations', function (Blueprint $table) {
            if (Schema::hasColumn('pending_registrations', 'registered_via')) {
                $table->dropColumn('registered_via');
            }
        });
    }
};
