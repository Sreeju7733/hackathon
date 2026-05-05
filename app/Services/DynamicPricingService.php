<?php

namespace App\Services;

use App\Models\Charger;
use Carbon\Carbon;

class DynamicPricingService
{
    // Base pricing constants
    const BASE_RATE_PER_KW = 10; // ₹10 per kW per hour
    const PEAK_HOUR_MULTIPLIER = 1.5;
    const OFF_PEAK_MULTIPLIER = 0.8;
    const DEMAND_MULTIPLIER_MAX = 2.0;

    // Peak hours (5 PM - 9 PM)
    const PEAK_HOURS_START = 17;
    const PEAK_HOURS_END = 21;

    /**
     * Calculate dynamic price for a charger
     */
    public function calculatePrice(Charger $charger, ?Carbon $startTime = null, ?Carbon $endTime = null): array
    {
        $startTime = $startTime ?? Carbon::now();
        $endTime = $endTime ?? Carbon::now()->addHour();

        // Calculate duration in hours
        $durationHours = $endTime->diffInHours($startTime);
        if ($durationHours < 0.25)
            $durationHours = 0.25; // Minimum 15 minutes

        // Base price calculation (kW-based)
        $basePrice = $this->calculateBasePrice($charger, $durationHours);

        // Time multiplier (peak/off-peak)
        $timeMultiplier = $this->getTimeMultiplier($startTime);

        // Charger type multiplier
        $typeMultiplier = $this->getChargerTypeMultiplier($charger->charger_type);

        // Demand multiplier (based on nearby bookings)
        $demandMultiplier = $this->getDemandMultiplier($charger);

        // Calculate final price
        $finalPrice = $basePrice * $timeMultiplier * $typeMultiplier * $demandMultiplier;

        // Round to 2 decimal places
        $finalPrice = round($finalPrice, 2);

        return [
            'base_price' => round($basePrice, 2),
            'time_multiplier' => $timeMultiplier,
            'type_multiplier' => $typeMultiplier,
            'demand_multiplier' => $demandMultiplier,
            'total_price' => $finalPrice,
            'price_per_hour' => round($finalPrice / $durationHours, 2),
            'duration_hours' => $durationHours,
            'breakdown' => $this->getPriceBreakdown($charger, $basePrice, $timeMultiplier, $typeMultiplier, $demandMultiplier)
        ];
    }

    /**
     * Calculate base price based on charger power (kW)
     */
    private function calculateBasePrice(Charger $charger, float $durationHours): float
    {
        // Price = Charger kW × Base Rate × Duration
        $powerKw = floatval($charger->power_kw);
        $baseRate = self::BASE_RATE_PER_KW;

        // Different rates for different charger types
        $adjustedRate = $baseRate;

        if ($charger->charger_type === 'fast_dc') {
            $adjustedRate = $baseRate * 1.5; // Fast DC chargers cost 50% more
        } elseif ($charger->charger_type === 'ultra_fast') {
            $adjustedRate = $baseRate * 2.0; // Ultra fast chargers cost 100% more
        }

        return ($powerKw * $adjustedRate) * $durationHours;
    }

    /**
     * Get time-based multiplier (peak/off-peak)
     */
    private function getTimeMultiplier(Carbon $time): float
    {
        $hour = (int) $time->format('H');
        $isWeekend = $time->isWeekend();

        // Peak hours (5 PM - 9 PM)
        if ($hour >= self::PEAK_HOURS_START && $hour < self::PEAK_HOURS_END) {
            return self::PEAK_HOUR_MULTIPLIER;
        }

        // Late night discount (11 PM - 5 AM)
        if ($hour >= 23 || $hour < 5) {
            return 0.7;
        }

        // Weekend slightly higher
        if ($isWeekend) {
            return 1.2;
        }

        return self::OFF_PEAK_MULTIPLIER;
    }

    /**
     * Get multiplier based on charger type
     */
    private function getChargerTypeMultiplier(string $chargerType): float
    {
        return match ($chargerType) {
            'slow_ac' => 1.0,      // 3.7kW - 7kW
            'fast_ac' => 1.2,       // 11kW - 22kW
            'fast_dc' => 1.5,       // 25kW - 50kW
            'ultra_fast' => 2.0,    // 100kW - 350kW
            default => 1.0
        };
    }

    /**
     * Calculate demand multiplier based on nearby bookings
     */
    private function getDemandMultiplier(Charger $charger): float
    {
        // Count bookings in last 24 hours
        $recentBookings = $charger->bookings()
            ->where('start_time', '>=', Carbon::now()->subDay())
            ->count();

        // Calculate demand factor (0-1 scale)
        $demandFactor = min($recentBookings / 20, 1); // Max 20 bookings = 100% demand

        // Calculate multiplier (1.0 to 2.0)
        $multiplier = 1 + ($demandFactor * (self::DEMAND_MULTIPLIER_MAX - 1));

        return round($multiplier, 2);
    }

    /**
     * Get detailed price breakdown for UI display
     */
    private function getPriceBreakdown(Charger $charger, float $basePrice, float $timeMultiplier, float $typeMultiplier, float $demandMultiplier): array
    {
        return [
            [
                'component' => 'Base Price (kW × Rate)',
                'calculation' => "{$charger->power_kw}kW × ₹" . self::BASE_RATE_PER_KW . "/kW",
                'value' => $basePrice
            ],
            [
                'component' => 'Time Multiplier',
                'calculation' => $timeMultiplier > 1 ? 'Peak Hours' : ($timeMultiplier < 1 ? 'Off-Peak Discount' : 'Standard Time'),
                'value' => $timeMultiplier
            ],
            [
                'component' => 'Charger Type',
                'calculation' => ucfirst(str_replace('_', ' ', $charger->charger_type)),
                'value' => $typeMultiplier
            ],
            [
                'component' => 'Demand Factor',
                'calculation' => 'Based on recent usage',
                'value' => $demandMultiplier
            ]
        ];
    }

    /**
     * Calculate estimated charging time based on battery size
     */
    public function calculateChargingTime(float $batteryCapacityKWh, float $chargerPowerKw, float $currentSoc = 20, float $targetSoc = 80): float
    {
        $kwhNeeded = $batteryCapacityKWh * (($targetSoc - $currentSoc) / 100);
        $hoursNeeded = $kwhNeeded / $chargerPowerKw;

        return round($hoursNeeded, 2);
    }
}