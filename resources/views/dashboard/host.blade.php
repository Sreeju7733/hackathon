@extends('layouts.app')

@section('title', 'Host Dashboard')

@section('content')
<div class="row g-4">
    <!-- Host Welcome -->
    <div class="col-12">
        <div class="stat-card border-0 text-white" style="background: linear-gradient(135deg, #059669 0%, #065f46 100%);">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h2 class="fw-bold mb-2">Welcome back, {{ explode(' ', $user->name)[0] }}! 🏨</h2>
                    <p class="opacity-75 mb-4">Your chargers have earned <strong>₹{{ number_format($monthlyEarnings, 0) }}</strong> this month. You have {{ $upcomingReservations->count() }} upcoming reservations.</p>
                    <div class="d-flex gap-2">
                        <a href="{{ route('host.chargers.create') }}" class="btn btn-light text-success fw-bold px-4 py-2" style="border-radius: 10px;">
                            <i class="fas fa-plus me-2"></i> Add New Charger
                        </a>
                        <a href="{{ route('host.reservations.index') }}" class="btn btn-success border-white border-opacity-25 fw-bold px-4 py-2" style="border-radius: 10px; background: rgba(255,255,255,0.1);">
                            <i class="fas fa-list-check me-2"></i> Manage Bookings
                        </a>
                    </div>
                </div>
                <div class="col-md-4 d-none d-md-block text-end">
                    <i class="fas fa-house-circle-check opacity-25" style="font-size: 8rem; transform: rotate(-10deg);"></i>
                </div>
            </div>
        </div>
    </div>

    <!-- Host Stats -->
    <div class="col-md-3">
        <div class="stat-card h-100">
            <div class="stat-icon bg-success bg-opacity-10 text-success">
                <i class="fas fa-sack-dollar"></i>
            </div>
            <div class="text-muted small fw-medium">Monthly Earnings</div>
            <div class="fs-2 fw-bold mt-1">₹{{ number_format($monthlyEarnings, 0) }}</div>
            <div class="mt-2 {{ $growthRate >= 0 ? 'text-success' : 'text-danger' }} small fw-medium">
                <i class="fas fa-arrow-{{ $growthRate >= 0 ? 'up' : 'down' }}"></i> {{ number_format(abs($growthRate), 1) }}% <span class="text-muted fw-normal">vs last month</span>
            </div>
        </div>
    </div>

    <div class="col-md-3">
        <div class="stat-card h-100">
            <div class="stat-icon bg-primary bg-opacity-10 text-primary">
                <i class="fas fa-plug-circle-check"></i>
            </div>
            <div class="text-muted small fw-medium">Monthly Sessions</div>
            <div class="fs-2 fw-bold mt-1">{{ $monthlySessions }}</div>
            <div class="mt-2 text-muted small fw-medium">
                Across all your chargers
            </div>
        </div>
    </div>

    <div class="col-md-3">
        <div class="stat-card h-100 border-{{ $inUseChargersCount > 0 ? 'success' : '' }}">
            <div class="stat-icon {{ $inUseChargersCount > 0 ? 'bg-success' : 'bg-warning' }} bg-opacity-10 {{ $inUseChargersCount > 0 ? 'text-success' : 'text-warning' }}">
                <i class="fas fa-plug-circle-bolt"></i>
            </div>
            <div class="text-muted small fw-medium">Currently In Use</div>
            <div class="fs-2 fw-bold mt-1 text-{{ $inUseChargersCount > 0 ? 'success' : '' }}">{{ $inUseChargersCount }}</div>
            <div class="mt-2 text-muted small fw-medium">
                {{ $upcomingReservations->count() }} more today
            </div>
        </div>
    </div>

    <div class="col-md-3">
        <div class="stat-card h-100">
            <div class="stat-icon bg-info bg-opacity-10 text-info">
                <i class="fas fa-award"></i>
            </div>
            <div class="text-muted small fw-medium">Top Charger</div>
            <div class="fw-bold mt-2 text-truncate">{{ $topCharger->label ?? 'None' }}</div>
            <div class="mt-2 text-muted small fw-medium">
                @if($topCharger)
                    {{ $topCharger->bookings_count }} completed sessions
                @else
                    Add a charger to start
                @endif
            </div>
        </div>
    </div>

    <!-- Upcoming Reservations -->
    <div class="col-lg-8">
        <div class="stat-card h-100">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="fw-bold mb-0">Upcoming Reservations</h4>
                <a href="{{ route('host.reservations.index') }}" class="text-primary text-decoration-none small fw-bold">View All</a>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle border-0">
                    <thead class="bg-light">
                        <tr>
                            <th class="border-0 rounded-start">Driver</th>
                            <th class="border-0">Charger</th>
                            <th class="border-0">Time</th>
                            <th class="border-0 rounded-end text-end">Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($upcomingReservations as $reservation)
                        <tr>
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <div class="rounded-circle bg-secondary bg-opacity-10 p-2 text-secondary fw-bold small" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                                        {{ substr($reservation->driver->name, 0, 1) }}
                                    </div>
                                    <div class="fw-bold small">{{ $reservation->driver->name }}</div>
                                </div>
                            </td>
                            <td class="small">{{ $reservation->charger->label }}</td>
                            <td class="small text-primary fw-bold">{{ $reservation->start_time->format('M d, h:i A') }}</td>
                            <td class="text-end fw-bold">₹{{ number_format($reservation->total_price, 0) }}</td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="4" class="text-center py-5 text-muted">No upcoming reservations found.</td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Quick Insights -->
    <div class="col-lg-4">
        <div class="stat-card h-100">
            <h4 class="fw-bold mb-4">Host Insights</h4>
            
            <div class="p-3 bg-light rounded-3 mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center gap-3">
                        <div class="bg-white p-2 rounded shadow-sm {{ $growthRate >= 0 ? 'text-success' : 'text-danger' }}">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="fw-bold">Growth Rate</div>
                    </div>
                    <span class="small fw-bold {{ $growthRate >= 0 ? 'text-success' : 'text-danger' }}">{{ number_format($growthRate, 1) }}%</span>
                </div>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar {{ $growthRate >= 0 ? 'bg-success' : 'bg-danger' }}" style="width: {{ min(abs($growthRate), 100) }}%;"></div>
                </div>
                <div class="text-muted small mt-2">Comparison to last month</div>
            </div>

            <div class="p-3 bg-light rounded-3 mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center gap-3">
                        <div class="bg-white p-2 rounded shadow-sm {{ $healthPercentage >= 90 ? 'text-primary' : 'text-warning' }}">
                            <i class="fas fa-plug-circle-bolt"></i>
                        </div>
                        <div class="fw-bold">Station Health</div>
                    </div>
                    <span class="small fw-bold text-primary">{{ number_format($healthPercentage, 0) }}%</span>
                </div>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar bg-primary" style="width: {{ $healthPercentage }}%;"></div>
                </div>
                <div class="text-muted small mt-2">Based on active status</div>
            </div>

            <div class="mt-4">
                <h5 class="fw-bold mb-3 small text-muted text-uppercase">Performance Tip</h5>
                <div class="stat-card bg-primary bg-opacity-5 border-0 p-3 mb-0">
                    <p class="small text-muted mb-0">{{ $performanceTip }}</p>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
