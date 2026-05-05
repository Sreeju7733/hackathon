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
        Schema::create('chargers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('host_id')->constrained('users')->cascadeOnDelete(); // 👤 Who listed it

            $table->string('label'); // Custom name (e.g., "My Garage Charger")
            $table->string('charger_type'); // Type 2, CCS, Tesla, GB/T, etc.
            $table->decimal('power_kw', 5, 2); // Output rating (e.g., 7.40, 11.00, 22.00)
            $table->string('model')->nullable(); // Brand/Model (e.g., "Wallbox Pulsar Plus")

            $table->string('address'); // Auto-deduced from coords later via geocoding API
            $table->string('landmark')->nullable(); // e.g., "Next to Blue Pharmacy, Gate 3"

            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);

            $table->decimal('base_price_per_hour', 8, 2);
            $table->json('availability_schedule')->nullable(); // Flexible: {"mon": ["09:00","18:00"], "tue": ["10:00","20:00"]}
            $table->json('metadata')->nullable(); // Future-proofing (images, notes, plug_count, etc.)

            $table->enum('status', ['active', 'inactive', 'maintenance'])->default('active');
            $table->timestamps();

            // Indexes for fast search & filtering
            $table->index(['latitude', 'longitude']);
            $table->index(['status', 'host_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chargers');
    }
};
