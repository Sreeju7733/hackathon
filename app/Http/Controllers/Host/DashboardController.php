<?php

namespace App\Http\Controllers\Host;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Charger;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $chargerIds = Charger::where('host_id', $user->id)->pluck('id');

        // Auto-complete expired bookings
        Booking::whereIn('charger_id', $chargerIds)
            ->where('status', 'confirmed')
            ->where('end_time', '<', Carbon::now())
            ->update(['status' => 'completed']);

        // 1. Monthly Earnings (Current Month)
        $monthlyEarnings = Booking::whereIn('charger_id', $chargerIds)
            ->whereIn('status', ['confirmed', 'completed'])
            ->whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->sum('total_price');

        // 2. Growth Rate (vs Last Month)
        $lastMonthEarnings = Booking::whereIn('charger_id', $chargerIds)
            ->whereIn('status', ['confirmed', 'completed'])
            ->whereMonth('created_at', Carbon::now()->subMonth()->month)
            ->whereYear('created_at', Carbon::now()->subMonth()->year)
            ->sum('total_price');

        $growthRate = 0;
        if ($lastMonthEarnings > 0) {
            $growthRate = (($monthlyEarnings - $lastMonthEarnings) / $lastMonthEarnings) * 100;
        } elseif ($monthlyEarnings > 0) {
            $growthRate = 100; // First month growth
        }

        // 3. Charger Occupancy (Total sessions this month)
        $monthlySessions = Booking::whereIn('charger_id', $chargerIds)
            ->whereMonth('created_at', Carbon::now()->month)
            ->count();

        // 4. Upcoming Reservations
        $upcomingReservations = Booking::whereIn('charger_id', $chargerIds)
            ->where('status', 'confirmed')
            ->where('start_time', '>', Carbon::now())
            ->with(['charger', 'driver'])
            ->orderBy('start_time', 'asc')
            ->limit(5)
            ->get();

        // 5. Top Performing Charger
        $topCharger = Charger::where('host_id', $user->id)
            ->withCount(['bookings' => function($q) {
                $q->where('status', 'completed');
            }])
            ->orderBy('bookings_count', 'desc')
            ->first();

        // 6. Chargers Currently In Use
        $inUseChargersCount = Booking::whereIn('charger_id', $chargerIds)
            ->where('status', 'confirmed')
            ->where('start_time', '<=', Carbon::now())
            ->where('end_time', '>=', Carbon::now())
            ->distinct('charger_id')
            ->count();

        // 7. Station Health
        $totalHostChargers = $chargerIds->count();
        $activeHostChargers = Charger::whereIn('id', $chargerIds)->where('status', 'active')->count();
        $healthPercentage = $totalHostChargers > 0 ? ($activeHostChargers / $totalHostChargers) * 100 : 100;

        // 8. Performance Tip
        $hasFastDC = Charger::whereIn('id', $chargerIds)->where('charger_type', 'fast_dc')->exists();
        $performanceTip = $hasFastDC 
            ? "Your Fast DC charger is popular! Consider adding another to handle peak weekend traffic."
            : "Hosts who upgrade to 'Fast DC' charging typically see a 40% increase in weekend bookings.";

        $data = [
            'monthlyEarnings' => $monthlyEarnings,
            'monthlySessions' => $monthlySessions,
            'upcomingReservations' => $upcomingReservations,
            'topCharger' => $topCharger,
            'user' => $user,
            'inUseChargersCount' => $inUseChargersCount,
            'growthRate' => $growthRate,
            'healthPercentage' => $healthPercentage,
            'performanceTip' => $performanceTip,
        ];

        return view('dashboard.host', $data);
    }

    public function reservations()
    {
        $user = Auth::user();
        $chargerIds = Charger::where('host_id', $user->id)->pluck('id');
        
        $reservations = Booking::whereIn('charger_id', $chargerIds)
            ->with(['charger', 'driver'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return view('host.reservations.index', compact('reservations'));
    }

    public function updateReservationStatus(Request $request, $id)
    {
        $user = Auth::user();
        $chargerIds = Charger::where('host_id', $user->id)->pluck('id');
        
        $reservation = Booking::whereIn('charger_id', $chargerIds)->findOrFail($id);
        
        $request->validate([
            'status' => 'required|in:completed,cancelled,confirmed'
        ]);

        $reservation->update(['status' => $request->status]);

        return back()->with('success', 'Reservation status updated!');
    }
}
