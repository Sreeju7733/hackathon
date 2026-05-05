@extends('layouts.app')

@section('title', 'Book Charger')

@push('styles')
<style>
    .booking-card {
        background: white;
        border-radius: 30px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.05);
        overflow: hidden;
        border: 1px solid #f1f5f9;
    }
    .booking-hero {
        background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
        padding: 3rem 2rem;
        color: white;
        text-align: center;
        border-radius: 0 0 40px 40px;
        margin-bottom: -40px;
        position: relative;
        z-index: 1;
    }
    .booking-form-container {
        position: relative;
        z-index: 2;
        padding: 0 2rem 2rem 2rem;
    }
    .form-box {
        background: white;
        border-radius: 24px;
        padding: 2.5rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }
</style>
@endpush

@section('content')
<div class="row justify-content-center">
    <div class="col-lg-8">
        <div class="booking-card">
            <div class="booking-hero">
                <i class="fas fa-charging-station fa-3x mb-3 opacity-75"></i>
                <h1 class="fw-bold h2">Ready to Charge?</h1>
                <p class="opacity-75">Configure your session for {{ $charger->label }}</p>
            </div>

            <div class="booking-form-container">
                <div class="form-box">
                    <div class="row g-4 mb-4">
                        <div class="col-md-6">
                            <div class="p-3 bg-light rounded-4">
                                <div class="text-muted small mb-1"><i class="fas fa-bolt text-primary me-2"></i>Charger Power</div>
                                <div class="fw-bold h5 mb-0">{{ $charger->power_kw }} kW</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="p-3 bg-light rounded-4">
                                <div class="text-muted small mb-1"><i class="fas fa-location-dot text-danger me-2"></i>Location</div>
                                <div class="fw-bold h5 mb-0 text-truncate">{{ $charger->address }}</div>
                            </div>
                        </div>
                    </div>

                    <form action="{{ route('driver.book.store') }}" method="POST">
                        @csrf
                        <input type="hidden" name="charger_id" value="{{ $charger->id }}">

                        <div class="row g-4 mb-4">
                            <div class="col-md-7">
                                <label class="form-label fw-bold small text-muted text-uppercase">Select Start Time</label>
                                <div class="input-group input-group-lg">
                                    <span class="input-group-text bg-white border-end-0"><i class="fas fa-calendar-alt text-primary"></i></span>
                                    <input type="datetime-local" name="start_time" class="form-control border-start-0" required 
                                           min="{{ now()->format('Y-m-d\TH:i') }}" value="{{ now()->addMinutes(15)->format('Y-m-d\TH:i') }}">
                                </div>
                            </div>
                            <div class="col-md-5">
                                <label class="form-label fw-bold small text-muted text-uppercase">Select Duration</label>
                                <div class="input-group input-group-lg">
                                    <span class="input-group-text bg-white border-end-0"><i class="fas fa-clock text-primary"></i></span>
                                    <select name="duration" class="form-select border-start-0" required>
                                        <option value="0.5">30 Mins</option>
                                        <option value="1" selected>1 Hour</option>
                                        <option value="2">2 Hours</option>
                                        <option value="3">3 Hours</option>
                                        <option value="4">4 Hours</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="stat-card bg-primary bg-opacity-5 border-0 mb-4 p-4">
                            <div class="d-flex align-items-center gap-3">
                                <div class="stat-icon bg-white text-primary mb-0 shadow-sm">
                                    <i class="fas fa-info-circle"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="fw-bold">Dynamic Pricing Active</div>
                                    <div class="text-muted small">Final price includes base rate (₹10/kW/hr) + time of day & demand multipliers.</div>
                                </div>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary w-100 py-3 rounded-pill fw-bold fs-5 shadow-lg">
                            Continue to Secure Payment <i class="fas fa-arrow-right ms-2"></i>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
