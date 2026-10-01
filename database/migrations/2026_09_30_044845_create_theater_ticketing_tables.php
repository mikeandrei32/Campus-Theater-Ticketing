<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('venue')->default('MSEUF University Theater');
            $table->dateTime('show_date');
            $table->enum('pricing_type', ['free', 'paid'])->default('free');
            $table->decimal('regular_price', 8, 2)->default(0.00);
            $table->decimal('vip_price', 8, 2)->default(0.00);
            $table->string('banner_image')->nullable();
            $table->timestamps();
        });

        Schema::create('seats', function (Blueprint $table) {
            $table->id();
            $table->string('row_label', 2); // 'A', 'B', etc.
            $table->unsignedTinyInteger('seat_number'); // 1, 2, ...
            $table->enum('tier', ['vip', 'regular'])->default('regular');
            $table->timestamps();
            $table->unique(['row_label', 'seat_number']);
        });

        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('booking_reference')->unique();
            $table->unsignedInteger('total_seats');
            $table->decimal('total_amount', 8, 2)->default(0.00);
            $table->enum('payment_status', ['free', 'paid'])->default('free');
            $table->string('gcash_reference')->nullable();
            $table->string('status')->default('confirmed');
            $table->timestamps();
        });

        Schema::create('ticket_seats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('seat_id')->constrained()->cascadeOnDelete();
            $table->uuid('qr_token')->unique();
            $table->boolean('is_checked_in')->default(false);
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamps();

            // Prevents the same seat from being booked twice for the same event
            $table->unique(['event_id', 'seat_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_seats');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('seats');
        Schema::dropIfExists('events');
    }
};
