@extends('layouts.app')

@section('title', 'Profile Settings')

@section('content')
<div class="row g-4">
    <div class="col-12">
        <h2 class="fw-bold mb-4">Account Settings</h2>
    </div>

    @if(session('success'))
        <div class="col-12">
            <div class="alert alert-success border-0 shadow-sm" style="border-radius: 12px;">
                <i class="fas fa-check-circle me-2"></i> {{ session('success') }}
            </div>
        </div>
    @endif

    <!-- Personal Information -->
    <div class="col-lg-7">
        <div class="stat-card h-100">
            <h4 class="fw-bold mb-4"><i class="fas fa-user-circle text-primary me-2"></i>Personal Information</h4>
            
            <form action="{{ route('profile.update') }}" method="POST">
                @csrf
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label small fw-bold text-muted text-uppercase">Full Name</label>
                        <input type="text" name="name" class="form-control form-control-lg" value="{{ old('name', $user->name) }}" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small fw-bold text-muted text-uppercase">Email Address</label>
                        <input type="email" name="email" class="form-control form-control-lg" value="{{ old('email', $user->email) }}" required>
                    </div>

                    <div class="col-12 mt-4">
                        <hr class="opacity-50">
                        <h5 class="fw-bold mb-3 mt-4">Change Password</h5>
                        <p class="text-muted small mb-4">Leave these fields empty if you don't want to change your password.</p>
                    </div>

                    <div class="col-12">
                        <label class="form-label small fw-bold text-muted text-uppercase">Current Password</label>
                        <input type="password" name="current_password" class="form-control">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small fw-bold text-muted text-uppercase">New Password</label>
                        <input type="password" name="new_password" class="form-control">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small fw-bold text-muted text-uppercase">Confirm New Password</label>
                        <input type="password" name="new_password_confirmation" class="form-control">
                    </div>

                    <div class="col-12 mt-4">
                        <button type="submit" class="btn btn-primary px-5 py-2 fw-bold" style="border-radius: 10px;">
                            Save Changes
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <!-- Vehicle Settings (Driver Only) -->
    @if($user->isDriver())
    <div class="col-lg-5">
        <div class="stat-card h-100">
            <h4 class="fw-bold mb-4"><i class="fas fa-car text-primary me-2"></i>Vehicle Settings</h4>
            
            <form action="{{ route('profile.vehicle.update') }}" method="POST">
                @csrf
                <div class="row g-3">
                    <div class="col-6">
                        <label class="form-label small fw-bold text-muted text-uppercase">Make</label>
                        <input type="text" name="make" class="form-control" value="{{ old('make', $vehicle->make ?? '') }}" placeholder="e.g. Tesla" required>
                    </div>
                    <div class="col-6">
                        <label class="form-label small fw-bold text-muted text-uppercase">Model</label>
                        <input type="text" name="model" class="form-control" value="{{ old('model', $vehicle->model ?? '') }}" placeholder="e.g. Model 3" required>
                    </div>
                    <div class="col-12">
                        <label class="form-label small fw-bold text-muted text-uppercase">License Plate</label>
                        <input type="text" name="license_plate" class="form-control" value="{{ old('license_plate', $vehicle->license_plate ?? '') }}" placeholder="KA-01-..." required>
                    </div>
                    <div class="col-12">
                        <label class="form-label small fw-bold text-muted text-uppercase">Battery Capacity (kWh)</label>
                        <div class="input-group">
                            <input type="number" step="0.1" name="battery_capacity_kwh" class="form-control" value="{{ old('battery_capacity_kwh', $vehicle->battery_capacity_kwh ?? '') }}" required>
                            <span class="input-group-text bg-light border-start-0">kWh</span>
                        </div>
                    </div>

                    <div class="col-12 mt-4">
                        <div class="stat-card bg-primary bg-opacity-5 border-0 p-3 mb-0">
                            <div class="d-flex align-items-center gap-2 small">
                                <i class="fas fa-info-circle text-primary"></i>
                                <span class="text-muted">Accurate vehicle info helps us estimate your charging time better.</span>
                            </div>
                        </div>
                    </div>

                    <div class="col-12 mt-4">
                        <button type="submit" class="btn btn-outline-primary w-100 py-2 fw-bold" style="border-radius: 10px;">
                            Update Vehicle
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
    @endif
</div>
@endsection
