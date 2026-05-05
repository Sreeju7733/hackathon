@extends('layouts.app')

@section('title', 'Admin Overview')

@section('content')
<div class="row g-4">
    <!-- Admin Hero -->
    <div class="col-12">
        <div class="stat-card border-0 text-white" style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%);">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h2 class="fw-bold mb-2">System Control Center</h2>
                    <p class="opacity-75 mb-4">You are managing <strong>{{ $totalUsers }}</strong> users and <strong>{{ $totalChargers }}</strong> charging stations. Monthly system revenue is <strong>₹{{ number_format($systemRevenue, 0) }}</strong>.</p>
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary fw-bold px-4">Network Status</button>
                        <button class="btn btn-outline-light fw-bold px-4">Generate Reports</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Admin Stats -->
    <div class="col-md-3">
        <div class="stat-card h-100">
            <div class="stat-icon bg-primary bg-opacity-10 text-primary">
                <i class="fas fa-users"></i>
            </div>
            <div class="text-muted small fw-medium">Total Users</div>
            <div class="fs-2 fw-bold mt-1">{{ number_format($totalUsers) }}</div>
            <div class="mt-2 text-success small fw-medium">
                <i class="fas fa-arrow-up"></i> {{ $newUsersThisMonth }} <span class="text-muted fw-normal">new this month</span>
            </div>
        </div>
    </div>

    <div class="col-md-3">
        <div class="stat-card h-100">
            <div class="stat-icon bg-success bg-opacity-10 text-success">
                <i class="fas fa-bolt"></i>
            </div>
            <div class="text-muted small fw-medium">Active Chargers</div>
            <div class="fs-2 fw-bold mt-1">{{ $totalChargers }}</div>
            <div class="mt-2 text-muted small fw-medium">
                {{ $availableChargers }} currently available
            </div>
        </div>
    </div>

    <div class="col-md-3">
        <div class="stat-card h-100">
            <div class="stat-icon bg-warning bg-opacity-10 text-warning">
                <i class="fas fa-calendar-check"></i>
            </div>
            <div class="text-muted small fw-medium">Total Bookings</div>
            <div class="fs-2 fw-bold mt-1">{{ number_format($totalBookings) }}</div>
            <div class="mt-2 text-success small fw-medium">
                <i class="fas fa-check-circle"></i> {{ $completedBookings }} <span class="text-muted fw-normal">completed</span>
            </div>
        </div>
    </div>

    <div class="col-md-3">
        <div class="stat-card h-100">
            <div class="stat-icon bg-danger bg-opacity-10 text-danger">
                <i class="fas fa-sack-dollar"></i>
            </div>
            <div class="text-muted small fw-medium">System Revenue</div>
            <div class="fs-2 fw-bold mt-1">₹{{ number_format($systemRevenue, 0) }}</div>
            <div class="mt-2 text-danger small fw-medium">
                Gross Volume
            </div>
        </div>
    </div>

    <!-- Recent Users Table -->
    <div class="col-12">
        <div class="stat-card">
            <h4 class="fw-bold mb-4">Recently Joined Hosts</h4>
            <div class="table-responsive">
                <table class="table table-hover align-middle border-0">
                    <thead class="bg-light">
                        <tr>
                            <th class="border-0 rounded-start">Host Name</th>
                            <th class="border-0">Email</th>
                            <th class="border-0">Date Joined</th>
                            <th class="border-0">Status</th>
                            <th class="border-0 rounded-end text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($pendingHosts as $host)
                        <tr>
                            <td>{{ $host->name }}</td>
                            <td>{{ $host->email }}</td>
                            <td class="small">{{ $host->created_at->format('M d, Y') }}</td>
                            <td><span class="badge bg-success-subtle text-success">Active</span></td>
                            <td class="text-end">
                                <button class="btn btn-sm btn-outline-primary rounded-pill px-3">View Profile</button>
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="5" class="text-center py-4 text-muted">No recently joined hosts found.</td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
@endsection