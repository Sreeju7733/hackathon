@extends('layouts.app')

@section('title', 'Host Dashboard')

@section('content')
<div class="row g-4">
    <!-- Host Welcome -->
    <div class="col-12">
        <div class="stat-card border-0 text-white" style="background: linear-gradient(135deg, #059669 0%, #065f46 100%);">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h2 class="fw-bold mb-2">Welcome back, Host! 🏨</h2>
                    <p class="opacity-75 mb-4">Your chargers have earned ₹12,450 this month. 2 new bookings were made in the last 24 hours.</p>
                    <button class="btn btn-light text-success fw-bold px-4 py-2" style="border-radius: 10px;">
                        <i class="fas fa-plus me-2"></i> Add New Charger
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Host Stats -->
    <div class="col-md-4">
        <div class="stat-card">
            <div class="stat-icon bg-success bg-opacity-10 text-success">
                <i class="fas fa-sack-dollar"></i>
            </div>
            <div class="text-muted small fw-medium">Monthly Earnings</div>
            <div class="fs-2 fw-bold mt-1">₹12,450</div>
            <div class="mt-2 text-success small fw-medium">
                <i class="fas fa-arrow-up"></i> 18% <span class="text-muted fw-normal">since last month</span>
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="stat-card">
            <div class="stat-icon bg-primary bg-opacity-10 text-primary">
                <i class="fas fa-plug-circle-check"></i>
            </div>
            <div class="text-muted small fw-medium">Charger Occupancy</div>
            <div class="fs-2 fw-bold mt-1">64%</div>
            <div class="mt-2 text-muted small fw-medium">
                Peak: 5 PM - 9 PM
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="stat-card">
            <div class="stat-icon bg-warning bg-opacity-10 text-warning">
                <i class="fas fa-star"></i>
            </div>
            <div class="text-muted small fw-medium">Host Rating</div>
            <div class="fs-2 fw-bold mt-1">4.9 <span class="fs-6 text-muted fw-normal">/ 5.0</span></div>
            <div class="mt-2 text-muted small fw-medium">
                Based on 124 reviews
            </div>
        </div>
    </div>

    <!-- Active Reservations -->
    <div class="col-lg-12">
        <div class="stat-card">
            <h4 class="fw-bold mb-4">Upcoming Reservations</h4>
            <div class="table-responsive">
                <table class="table table-hover align-middle border-0">
                    <thead class="bg-light">
                        <tr>
                            <th class="border-0">Driver</th>
                            <th class="border-0">Charger</th>
                            <th class="border-0">Time</th>
                            <th class="border-0">Duration</th>
                            <th class="border-0 text-end">Est. Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <img src="https://ui-avatars.com/api/?name=Alex+Doe&background=random" class="rounded-circle" width="32">
                                    <div class="fw-bold small">Alex Doe</div>
                                </div>
                            </td>
                            <td class="small">MG Road Fast DC</td>
                            <td class="small">Today, 04:30 PM</td>
                            <td class="small">2 Hours</td>
                            <td class="text-end fw-bold">₹1,300</td>
                        </tr>
                        <tr>
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <img src="https://ui-avatars.com/api/?name=Sarah+Lee&background=random" class="rounded-circle" width="32">
                                    <div class="fw-bold small">Sarah Lee</div>
                                </div>
                            </td>
                            <td class="small">Indiranagar AC</td>
                            <td class="small">Tomorrow, 09:00 AM</td>
                            <td class="small">4 Hours</td>
                            <td class="text-end fw-bold">₹960</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
@endsection
