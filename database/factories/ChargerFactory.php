<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Charger>
 */
class ChargerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'host_id' => User::where('role', 'host')->inRandomOrder()->first()?->id ?? User::factory(),
            'label' => $this->faker->words(2, true) . ' Charger',
            'charger_type' => $this->faker->randomElement(['Type 2', 'CCS', 'Tesla', 'GB/T']),
            'power_kw' => $this->faker->randomElement([7.4, 11, 22, 50, 120]),
            'model' => $this->faker->company . ' ' . $this->faker->word,
            'address' => $this->faker->address,
            'landmark' => $this->faker->sentence(3),
            'latitude' => $this->faker->latitude(8, 37), // India range roughly
            'longitude' => $this->faker->longitude(68, 97),
            'base_price_per_hour' => $this->faker->randomFloat(2, 50, 500),
            'availability_schedule' => [
                'mon' => ['09:00', '18:00'],
                'tue' => ['09:00', '18:00'],
                'wed' => ['09:00', '18:00'],
                'thu' => ['09:00', '18:00'],
                'fri' => ['09:00', '18:00'],
            ],
            'metadata' => [
                'plug_count' => $this->faker->numberBetween(1, 4),
                'notes' => $this->faker->sentence,
            ],
            'status' => 'active',
        ];
    }
}
