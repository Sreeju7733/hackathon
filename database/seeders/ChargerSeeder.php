<?php

namespace Database\Seeders;

use App\Models\Charger;
use Illuminate\Database\Seeder;

class ChargerSeeder extends Seeder
{
    public function run()
    {
        $chargers = [
            [
                'host_id' => 1,
                'label' => 'MG Road Fast Charger',
                'charger_type' => 'fast_dc',
                'power_kw' => 50,
                'model' => 'Delta DC Wallbox',
                'address' => 'MG Road, Bangalore',
                'landmark' => 'Near Metro Station',
                'latitude' => 12.9756,
                'longitude' => 77.6067,
                'base_price_per_hour' => 150,
                'status' => 'active'
            ],
            [
                'host_id' => 1,
                'label' => 'Indiranagar Ultra Fast',
                'charger_type' => 'ultra_fast',
                'power_kw' => 150,
                'model' => 'Terra HP',
                'address' => '100ft Road, Indiranagar',
                'landmark' => 'Near Toit',
                'latitude' => 12.9719,
                'longitude' => 77.6412,
                'base_price_per_hour' => 350,
                'status' => 'active'
            ],
            [
                'host_id' => 2,
                'label' => 'Koramangala Hub',
                'charger_type' => 'fast_ac',
                'power_kw' => 22,
                'model' => 'ABB Terra AC',
                'address' => '80ft Road, Koramangala',
                'landmark' => 'Near Sony Signal',
                'latitude' => 12.9345,
                'longitude' => 77.6101,
                'base_price_per_hour' => 100,
                'status' => 'active'
            ],
            [
                'host_id' => 2,
                'label' => 'HSR Layout Charger',
                'charger_type' => 'slow_ac',
                'power_kw' => 7,
                'model' => 'ChargePoint Home',
                'address' => 'Sector 7, HSR Layout',
                'landmark' => 'Near BDA Complex',
                'latitude' => 12.9100,
                'longitude' => 77.6450,
                'base_price_per_hour' => 40,
                'status' => 'active'
            ],
            [
                'host_id' => 3,
                'label' => 'Jayanagar Shopping DC',
                'charger_type' => 'fast_dc',
                'power_kw' => 100,
                'model' => 'BTC Power DC',
                'address' => '4th Block, Jayanagar',
                'landmark' => 'Near Cool Joint',
                'latitude' => 12.9250,
                'longitude' => 77.5850,
                'base_price_per_hour' => 250,
                'status' => 'active'
            ]
        ];

        foreach ($chargers as $charger) {
            Charger::create($charger);
        }
    }
}