<?php

namespace App\Services;

use App\Models\Charger;
use Illuminate\Database\Eloquent\Collection;
use Carbon\Carbon;

class ChargerSearchService
{
    protected $pricingService;

    public function __construct(DynamicPricingService $pricingService)
    {
        $this->pricingService = $pricingService;
    }

    /**
     * Search chargers within radius with dynamic pricing
     */
    public function searchNearby(float $latitude, float $longitude, float $radiusKm = 10, ?array $filters = []): array
    {
        // Radius clamping
        $radiusKm = min($radiusKm, 50);

        // Calculate bounding box for optimization (MariaDB/MySQL friendly)
        $boundingBox = $this->calculateBoundingBox($latitude, $longitude, $radiusKm);

        // Build query
        $query = Charger::query()
            ->with([
                'host',
                'bookings' => function ($q) {
                    $q->where('start_time', '>', Carbon::now())
                        ->where('status', 'confirmed');
                }
            ])
            ->where('status', 'active')
            ->whereBetween('latitude', [$boundingBox['min_lat'], $boundingBox['max_lat']])
            ->whereBetween('longitude', [$boundingBox['min_lng'], $boundingBox['max_lng']]);

        // Availability Filter (Conflict Check)
        if (!empty($filters['start_time']) && !empty($filters['duration_hours'])) {
            $requestedStart = Carbon::parse($filters['start_time']);
            $requestedEnd = $requestedStart->copy()->addHours($filters['duration_hours']);

            $query->whereDoesntHave('bookings', function ($q) use ($requestedStart, $requestedEnd) {
                $q->where('status', 'confirmed')
                  ->where('start_time', '<', $requestedEnd)
                  ->where('end_time', '>', $requestedStart);
            });
        }

        // Apply filters
        if (!empty($filters['charger_type'])) {
            $query->whereIn('charger_type', (array) $filters['charger_type']);
        }

        if (!empty($filters['min_power'])) {
            $query->where('power_kw', '>=', $filters['min_power']);
        }

        if (!empty($filters['max_power'])) {
            $query->where('power_kw', '<=', $filters['max_power']);
        }

        if (!empty($filters['price_max'])) {
            // This is a post-query filter since price is calculated dynamically
        }

        // Get chargers with distance calculation
        $chargers = $query->get();

        // Calculate distance and filter by exact radius
        $results = [];
        foreach ($chargers as $charger) {
            $distance = $this->calculateDistance(
                $latitude,
                $longitude,
                $charger->latitude,
                $charger->longitude
            );

            if ($distance <= $radiusKm) {
                // Calculate dynamic pricing
                $pricing = $this->pricingService->calculatePrice($charger);

                // Check availability
                $availability = $this->checkAvailability($charger);

                $results[] = [
                    'charger' => $charger,
                    'distance' => round($distance, 2),
                    'pricing' => $pricing,
                    'availability' => $availability,
                    'display_name' => $this->formatChargerDisplay($charger, $distance, $pricing)
                ];
            }
        }

        // Sort by distance
        usort($results, function ($a, $b) {
            return $a['distance'] <=> $b['distance'];
        });

        // Filter by max price if specified
        if (!empty($filters['price_max'])) {
            $results = array_filter($results, function ($result) use ($filters) {
                return $result['pricing']['total_price'] <= $filters['price_max'];
            });
        }

        return [
            'chargers' => $results,
            'total_count' => count($results),
            'search_location' => ['lat' => $latitude, 'lng' => $longitude],
            'radius_km' => $radiusKm,
            'filters_applied' => $filters
        ];
    }

    /**
     * Calculate bounding box for SQL optimization
     */
    private function calculateBoundingBox(float $lat, float $lng, float $radiusKm): array
    {
        $latRad = deg2rad($lat);
        $lngRad = deg2rad($lng);
        $radiusDeg = $radiusKm / 111.0; // 1 degree ≈ 111 km

        $minLat = $lat - $radiusDeg;
        $maxLat = $lat + $radiusDeg;
        $minLng = $lng - $radiusDeg / cos($latRad);
        $maxLng = $lng + $radiusDeg / cos($latRad);

        return [
            'min_lat' => $minLat,
            'max_lat' => $maxLat,
            'min_lng' => $minLng,
            'max_lng' => $maxLng
        ];
    }

    /**
     * Calculate distance using Haversine formula
     */
    private function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // km

        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($lonDelta / 2) * sin($lonDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Check charger availability for next 24 hours
     */
    private function checkAvailability(Charger $charger): array
    {
        $now = Carbon::now();
        $bookings = $charger->bookings()
            ->where('start_time', '>=', $now)
            ->where('status', 'confirmed')
            ->get();

        $availableSlots = [];
        $currentTime = $now->copy();

        // Check next 24 hours in 30-minute slots
        for ($i = 0; $i < 48; $i++) {
            $slotStart = $currentTime->copy();
            $slotEnd = $currentTime->copy()->addMinutes(30);

            $isBooked = $bookings->contains(function ($booking) use ($slotStart, $slotEnd) {
                return ($slotStart < $booking->end_time && $slotEnd > $booking->start_time);
            });

            if (!$isBooked) {
                $availableSlots[] = [
                    'start' => $slotStart->toIso8601String(),
                    'end' => $slotEnd->toIso8601String(),
                    'display' => $slotStart->format('h:i A')
                ];
            }

            $currentTime->addMinutes(30);
        }

        return [
            'is_available' => count($availableSlots) > 0,
            'available_slots' => array_slice($availableSlots, 0, 10), // First 10 available slots
            'next_available' => $availableSlots[0]['display'] ?? 'Not available today'
        ];
    }

    /**
     * Format charger display information
     */
    private function formatChargerDisplay(Charger $charger, float $distance, array $pricing): array
    {
        return [
            'title' => "{$charger->label} - {$charger->power_kw}kW",
            'subtitle' => "{$charger->charger_type} • {$distance}km away",
            'price' => "₹{$pricing['price_per_hour']}/hour",
            'badge' => $this->getEfficiencyBadge($charger->power_kw)
        ];
    }

    /**
     * Get efficiency badge based on charger power
     */
    private function getEfficiencyBadge(float $powerKw): string
    {
        if ($powerKw >= 100)
            return '⚡ Ultra Fast';
        if ($powerKw >= 50)
            return '🔋 Fast DC';
        if ($powerKw >= 22)
            return '⚡ Fast AC';
        if ($powerKw >= 7)
            return '🔌 Standard';
        return '🐢 Slow';
    }
}