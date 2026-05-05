<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('charger_id')->constrained('chargers')->cascadeOnDelete();
            $table->foreignId('driver_id')->constrained('users')->cascadeOnDelete(); // 👤 Who booked it

            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->decimal('total_price', 8, 2);

            $table->enum('status', ['pending', 'confirmed', 'completed', 'cancelled'])->default('confirmed');
            $table->timestamps();

            // Critical for conflict-resolution queries
            $table->index(['charger_id', 'status']);
            $table->index(['start_time', 'end_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking');
    }
};
