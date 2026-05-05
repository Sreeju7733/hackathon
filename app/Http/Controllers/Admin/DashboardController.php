<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Charger;
use App\Models\User;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // 1. Total Users
        $totalUsers = User::count();
        $newUsersThisMonth = User::whereMonth('created_at', Carbon::now()->month)->count();

        // 2. Active Chargers
        $totalChargers = Charger::count();
        $availableChargers = Charger::where('is_available', true)->count();

        // 3. Total Bookings
        $totalBookings = Booking::count();
        $completedBookings = Booking::where('status', 'completed')->count();

        // 4. System Revenue (This Month)
        $systemRevenue = Booking::whereIn('status', ['confirmed', 'completed'])
            ->whereMonth('created_at', Carbon::now()->month)
            ->sum('total_price');

        // 5. Pending Host Approvals (Simulated: Users with role 'host' and no chargers yet?)
        // Actually I'll just fetch latest hosts
        $pendingHosts = User::where('role', 'host')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return view('dashboard.admin', compact(
            'totalUsers',
            'newUsersThisMonth',
            'totalChargers',
            'availableChargers',
            'totalBookings',
            'completedBookings',
            'systemRevenue',
            'pendingHosts'
        ));
    }

    public function users()
    {
        $users = User::orderBy('created_at', 'desc')->paginate(20);
        return view('admin.users.index', compact('users'));
    }
}
