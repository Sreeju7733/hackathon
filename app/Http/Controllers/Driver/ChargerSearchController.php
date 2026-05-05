<?php

namespace App\Http\Controllers\Driver;

use App\Http\Controllers\Controller;
use App\Services\ChargerSearchService;
use App\Services\DynamicPricingService;
use Illuminate\Http\Request;

class ChargerSearchController extends Controller
{
    protected $searchService;
    protected $pricingService;

    public function __construct(ChargerSearchService $searchService, DynamicPricingService $pricingService)
    {
        $this->searchService = $searchService;
        $this->pricingService = $pricingService;
    }

    /**
     * Show search page
     */
    public function index()
    {
        return view('driver.search');
    }

    /**
     * API endpoint for searching chargers
     */
    public function search(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius' => 'nullable|numeric|min:1|max:50',
            'charger_type' => 'nullable|array',
            'charger_type.*' => 'in:slow_ac,fast_ac,fast_dc,ultra_fast',
            'min_power' => 'nullable|numeric|min:0|max:350',
            'max_power' => 'nullable|numeric|min:0|max:350',
            'price_max' => 'nullable|numeric|min:0',
        ]);

        try {
            $results = $this->searchService->searchNearby(
                $request->latitude,
                $request->longitude,
                $request->radius ?? 10,
                $request->only(['charger_type', 'min_power', 'max_power', 'price_max'])
            );

            return response()->json([
                'success' => true,
                'data' => $results
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Search failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get price estimate for a specific charger
     */
    public function estimatePrice(Request $request, $chargerId)
    {
        $request->validate([
            'start_time' => 'nullable|date|after:now',
            'duration_hours' => 'nullable|numeric|min:0.25|max:24'
        ]);

        $charger = \App\Models\Charger::findOrFail($chargerId);

        $startTime = $request->start_time ? \Carbon\Carbon::parse($request->start_time) : null;
        $duration = $request->duration_hours ?? 1;
        $endTime = $startTime ? $startTime->copy()->addHours($duration) : null;

        $pricing = $this->pricingService->calculatePrice($charger, $startTime, $endTime);

        return response()->json([
            'success' => true,
            'pricing' => $pricing,
            'charger' => [
                'id' => $charger->id,
                'label' => $charger->label,
                'power_kw' => $charger->power_kw,
                'charger_type' => $charger->charger_type
            ]
        ]);
    }
}