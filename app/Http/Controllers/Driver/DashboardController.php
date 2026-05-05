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
        $now = Carbon::now();

        // Auto-complete expired bookings
        Booking::where('status', 'confirmed')
            ->where('end_time', '<', $now)
            ->update(['status' => 'completed']);

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

        // 1. Total Energy Used (Completed + Ongoing)
        $allBookings = Booking::where('driver_id', $user->id)
            ->whereIn('status', ['confirmed', 'completed'])
            ->with('charger')
            ->get();

        $totalEnergy = $allBookings->sum(function($booking) use ($now) {
            $start = Carbon::parse($booking->start_time);
            $end = Carbon::parse($booking->end_time);
            
            // If it's a completed session, use the full duration
            if ($booking->status === 'completed') {
                $durationMinutes = $start->diffInMinutes($end);
            } else {
                // If it's an ongoing session, calculate energy used up to NOW
                if ($start->isPast()) {
                    $effectiveEnd = $now->isBefore($end) ? $now : $end;
                    $durationMinutes = $start->diffInMinutes($effectiveEnd);
                } else {
                    $durationMinutes = 0; // Hasn't started yet
                }
            }
            
            return ($booking->charger->power_kw / 60) * $durationMinutes;
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
