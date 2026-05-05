@extends('layouts.app')

@section('title', 'Overview')

@section('content')
<div class="row g-4">
    <!-- Welcome Card -->
    <div class="col-12">
        <div class="stat-card border-0 text-white" style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h2 class="fw-bold mb-2">Welcome back, {{ explode(' ', auth()->user()->name)[0] }}! 👋</h2>
                    @if($nextBooking)
                        <p class="opacity-75 mb-4">Your next charging session is scheduled at <strong>{{ $nextBooking->start_time->format('h:i A') }}</strong> at {{ $nextBooking->charger->label }}.</p>
                    @else
                        <p class="opacity-75 mb-4">Your EV is ready for the next adventure. You have several chargers nearby waiting for you.</p>
                    @endif
                    <a href="{{ route('driver.search') }}" class="btn btn-light text-primary fw-bold px-4 py-2" style="border-radius: 10px;">
                        <i class="fas fa-search-location me-2"></i> Find a Charger
                    </a>
                </div>
                <div class="col-md-4 d-none d-md-block text-end">
                    <i class="fas fa-car-side opacity-25" style="font-size: 8rem; transform: rotate(-10deg);"></i>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Stats -->
    <div class="col-md-4">
        <div class="stat-card h-100">
            <div class="stat-icon bg-primary bg-opacity-10 text-primary">
                <i class="fas fa-bolt"></i>
            </div>
            <div class="text-muted small fw-medium">Total Energy Used</div>
            <div class="fs-2 fw-bold mt-1">{{ number_format($totalEnergy, 1) }} <span class="fs-6 text-muted fw-normal">kWh</span></div>
            <div class="mt-2 text-success small fw-medium">
                <i class="fas fa-leaf"></i> Eco-friendly <span class="text-muted fw-normal">driving</span>
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="stat-card h-100">
            <div class="stat-icon bg-success bg-opacity-10 text-success">
                <i class="fas fa-wallet"></i>
            </div>
            <div class="text-muted small fw-medium">Spending This Month</div>
            <div class="fs-2 fw-bold mt-1">₹{{ number_format($monthlySpending, 0) }}</div>
            <div class="mt-2 text-muted small fw-medium">
                From {{ $recentActivity->whereIn('status', ['confirmed', 'completed'])->count() }} active sessions
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="stat-card h-100">
            <div class="stat-icon bg-warning bg-opacity-10 text-warning">
                <i class="fas fa-clock"></i>
            </div>
            <div class="text-muted small fw-medium">Active Bookings</div>
            <div class="fs-2 fw-bold mt-1">{{ str_pad($activeBookingsCount, 2, '0', STR_PAD_LEFT) }}</div>
            <div class="mt-2 text-muted small fw-medium">
                @if($nextBooking)
                    Next in <span class="text-warning fw-bold">{{ $nextBooking->start_time->diffForHumans(now(), true) }}</span>
                @else
                    No upcoming sessions
                @endif
            </div>
        </div>
    </div>

    <!-- Recent Activity Table -->
    <div class="col-lg-8">
        <div class="stat-card h-100">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="fw-bold mb-0">Recent Activity</h4>
                <a href="#" class="text-primary text-decoration-none small fw-bold">View All</a>
            </div>
            
            <div class="table-responsive">
                <table class="table table-hover align-middle border-0">
                    <thead class="bg-light">
                        <tr>
                            <th class="border-0 rounded-start">Charger</th>
                            <th class="border-0">Date</th>
                            <th class="border-0">Status</th>
                            <th class="border-0 rounded-end text-end">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($recentActivity as $activity)
                        <tr>
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <div class="rounded-circle bg-primary bg-opacity-10 p-2 text-primary">
                                        <i class="fas fa-bolt"></i>
                                    </div>
                                    <div>
                                        <div class="fw-bold small">{{ $activity->charger->label }}</div>
                                        <div class="text-muted" style="font-size: 0.7rem;">{{ $activity->charger->power_kw }}kW • {{ strtoupper($activity->charger->charger_type) }}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="small">{{ $activity->created_at->format('M d, Y') }}</td>
                            <td>
                                <span class="badge border-0 px-2 py-1 text-capitalize 
                                    {{ $activity->status === 'confirmed' ? 'bg-primary-subtle text-primary' : '' }}
                                    {{ $activity->status === 'completed' ? 'bg-success-subtle text-success' : '' }}
                                    {{ $activity->status === 'cancelled' ? 'bg-danger-subtle text-danger' : '' }}
                                    {{ $activity->status === 'pending' ? 'bg-warning-subtle text-warning' : '' }}" 
                                    style="font-size: 0.65rem;">
                                    {{ $activity->status }}
                                </span>
                            </td>
                            <td class="text-end fw-bold">₹{{ number_format($activity->total_price, 0) }}</td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="4" class="text-center py-4 text-muted">No recent activity found.</td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- My Vehicle Section -->
    <div class="col-lg-4">
        <div class="stat-card h-100">
            <h4 class="fw-bold mb-4">My Vehicle</h4>
            
            @if($vehicle)
            <div class="text-center py-4 mb-4 position-relative" style="background: #f8fafc; border-radius: 20px;">
                <div class="position-absolute top-0 end-0 p-3">
                    <span class="badge bg-primary rounded-pill" style="font-size: 0.6rem;">Primary</span>
                </div>
                <i class="fas fa-car-side text-primary mb-3" style="font-size: 4rem;"></i>
                <h5 class="fw-bold mb-1">{{ $vehicle->make }} {{ $vehicle->model }}</h5>
                <div class="text-muted small fw-bold">{{ $vehicle->license_plate }}</div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="text-muted small fw-medium">Battery Status</span>
                <span class="fw-bold {{ $vehicle->current_soc_percent < 20 ? 'text-danger' : 'text-success' }}" id="soc-value">{{ $vehicle->current_soc_percent }}%</span>
            </div>
            
            <input type="range" class="form-range mb-3" id="soc-slider" min="0" max="100" value="{{ $vehicle->current_soc_percent }}">

            <div class="progress mb-4" style="height: 10px; border-radius: 10px;">
                <div class="progress-bar {{ $vehicle->current_soc_percent < 20 ? 'bg-danger' : 'bg-success' }}" 
                     id="soc-progress"
                     role="progressbar" style="width: {{ $vehicle->current_soc_percent }}%; border-radius: 10px;"></div>
            </div>

            <div class="row g-2">
                <div class="col-6">
                    <div class="p-3 text-center bg-light rounded-3">
                        <div class="text-muted small mb-1">Capacity</div>
                        <div class="fw-bold">{{ $vehicle->battery_capacity_kwh }} <span class="small fw-normal">kWh</span></div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="p-3 text-center bg-light rounded-3">
                        <div class="text-muted small mb-1">Year</div>
                        <div class="fw-bold">{{ $vehicle->year }}</div>
                    </div>
                </div>
            </div>

            <button class="btn btn-outline-primary w-100 mt-4 py-2 fw-bold" style="border-radius: 10px;">
                <i class="fas fa-cog me-2"></i> Vehicle Settings
            </button>
            @else
            <div class="text-center py-5">
                <i class="fas fa-car-on text-muted opacity-25 mb-3" style="font-size: 3rem;"></i>
                <p class="text-muted small">No vehicle registered yet.</p>
                <button class="btn btn-primary btn-sm rounded-pill px-3 mt-2">Add Vehicle</button>
            </div>
            @endif
        </div>
    </div>
</div>

@push('scripts')
<script>
    if (document.getElementById('soc-slider')) {
        document.getElementById('soc-slider').addEventListener('input', function(e) {
            const val = e.target.value;
            const display = document.getElementById('soc-value');
            const progress = document.getElementById('soc-progress');
            
            display.textContent = val + '%';
            progress.style.width = val + '%';
            
            if (val < 20) {
                display.className = 'fw-bold text-danger';
                progress.className = 'progress-bar bg-danger';
            } else {
                display.className = 'fw-bold text-success';
                progress.className = 'progress-bar bg-success';
            }
        });

        document.getElementById('soc-slider').addEventListener('change', function(e) {
            const val = e.target.value;
            fetch('{{ route("profile.vehicle.soc", [], false) }}', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ soc: val })
            });
        });
    }
</script>
@endpush
@endsection