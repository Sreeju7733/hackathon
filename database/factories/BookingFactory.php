<?php

namespace Database\Factories;

use App\Models\Charger;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Booking>
 */
class BookingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startTime = $this->faker->dateTimeBetween('now', '+1 month');
        $endTime = (clone $startTime)->modify('+' . $this->faker->numberBetween(1, 4) . ' hours');

        return [
            'charger_id' => Charger::inRandomOrder()->first()?->id ?? Charger::factory(),
            'driver_id' => User::where('role', 'driver')->inRandomOrder()->first()?->id ?? User::factory(),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'total_price' => $this->faker->randomFloat(2, 100, 2000),
            'status' => $this->faker->randomElement(['pending', 'confirmed', 'completed', 'cancelled']),
        ];
    }
}
