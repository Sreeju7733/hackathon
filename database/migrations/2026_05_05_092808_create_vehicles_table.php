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
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('make'); // e.g. Tesla, Tata, MG
            $table->string('model'); // e.g. Model 3, Nexon EV
            $table->integer('year');
            $table->string('license_plate')->unique();
            $table->decimal('battery_capacity_kwh', 8, 2);
            $table->integer('current_soc_percent')->default(100); // State of Charge
            $table->string('image_url')->nullable();
            $table->boolean('is_primary')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
