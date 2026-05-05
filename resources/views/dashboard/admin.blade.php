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
                    <p class="opacity-75 mb-4">Monitor network health, approve new hosts, and manage system-wide pricing policies.</p>
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
        <div class="stat-card">
            <div class="stat-icon bg-primary bg-opacity-10 text-primary">
                <i class="fas fa-users"></i>
            </div>
            <div class="text-muted small fw-medium">Total Users</div>
            <div class="fs-2 fw-bold mt-1">2,840</div>
            <div class="mt-2 text-success small fw-medium">
                <i class="fas fa-arrow-up"></i> 14% <span class="text-muted fw-normal">this month</span>
            </div>
        </div>
    </div>

    <div class="col-md-3">
        <div class="stat-card">
            <div class="stat-icon bg-success bg-opacity-10 text-success">
                <i class="fas fa-bolt"></i>
            </div>
            <div class="text-muted small fw-medium">Active Chargers</div>
            <div class="fs-2 fw-bold mt-1">156</div>
            <div class="mt-2 text-muted small fw-medium">
                98% Online
            </div>
        </div>
    </div>

    <div class="col-md-3">
        <div class="stat-card">
            <div class="stat-icon bg-warning bg-opacity-10 text-warning">
                <i class="fas fa-calendar-check"></i>
            </div>
            <div class="text-muted small fw-medium">Total Bookings</div>
            <div class="fs-2 fw-bold mt-1">12,450</div>
            <div class="mt-2 text-success small fw-medium">
                <i class="fas fa-arrow-up"></i> 22% <span class="text-muted fw-normal">growth</span>
            </div>
        </div>
    </div>

    <div class="col-md-3">
        <div class="stat-card">
            <div class="stat-icon bg-danger bg-opacity-10 text-danger">
                <i class="fas fa-triangle-exclamation"></i>
            </div>
            <div class="text-muted small fw-medium">Issues Found</div>
            <div class="fs-2 fw-bold mt-1">03</div>
            <div class="mt-2 text-danger small fw-medium">
                Requires Attention
            </div>
        </div>
    </div>

    <!-- Recent Users Table -->
    <div class="col-12">
        <div class="stat-card">
            <h4 class="fw-bold mb-4">Pending Approvals</h4>
            <div class="table-responsive">
                <table class="table table-hover align-middle border-0">
                    <thead class="bg-light">
                        <tr>
                            <th class="border-0">Host Name</th>
                            <th class="border-0">Property</th>
                            <th class="border-0">Location</th>
                            <th class="border-0">Date Applied</th>
                            <th class="border-0 text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>John Smith</td>
                            <td>City Mall Parking</td>
                            <td>Bangalore, IN</td>
                            <td>May 04, 2026</td>
                            <td class="text-end">
                                <button class="btn btn-sm btn-success rounded-pill px-3">Approve</button>
                                <button class="btn btn-sm btn-outline-danger rounded-pill px-3">Reject</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
@endsection