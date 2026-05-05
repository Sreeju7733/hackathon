<?php

namespace App\Http\Controllers\Driver;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Ensure user has at least one vehicle for demo purposes
        if ($user->role === 'driver' && $user->vehicles()->count() === 0) {
            Vehicle::create([
                'user_id' => $user->id,
                'make' => 'Tesla',
                'model' => 'Model 3',
                'year' => 2024,
                'license_plate' => 'KA-01-EV-' . rand(1000, 9999),
                'battery_capacity_kwh' => 75.0,
                'current_soc_percent' => rand(40, 95),
                'is_primary' => true
            ]);
        }

        $vehicle = $user->vehicles()->where('is_primary', true)->first();

        // 1. Total Energy Used
        $completedBookings = Booking::where('driver_id', $user->id)
            ->where('status', 'completed')
            ->with('charger')
            ->get();

        $totalEnergy = $completedBookings->sum(function($booking) {
            $durationHours = Carbon::parse($booking->start_time)->diffInHours($booking->end_time);
            return $booking->charger->power_kw * $durationHours;
        });

        // 2. Spending This Month
        $monthlySpending = Booking::where('driver_id', $user->id)
            ->whereIn('status', ['confirmed', 'completed'])
            ->whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->sum('total_price');

        // 3. Active Bookings Count
        $activeBookingsCount = Booking::where('driver_id', $user->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->count();

        // 4. Recent Activity
        $recentActivity = Booking::where('driver_id', $user->id)
            ->with('charger')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // 5. Next Booking Info
        $nextBooking = Booking::where('driver_id', $user->id)
            ->where('status', 'confirmed')
            ->where('start_time', '>', Carbon::now())
            ->orderBy('start_time', 'asc')
            ->first();

        return view('dashboard.driver', compact(
            'totalEnergy',
            'monthlySpending',
            'activeBookingsCount',
            'recentActivity',
            'nextBooking',
            'vehicle'
        ));
    }
}
