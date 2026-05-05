@extends('layouts.app')

@section('title', 'Help Center')

@section('content')
<div class="row g-4">
    <div class="col-12 text-center mb-5">
        <h1 class="fw-bold mb-2">How can we help you?</h1>
        <p class="text-muted fs-5">Find answers or contact our support team 24/7.</p>
    </div>

    <!-- Contact Cards -->
    <div class="col-md-4">
        <div class="stat-card text-center py-4 h-100">
            <div class="stat-icon bg-primary bg-opacity-10 text-primary mx-auto mb-3" style="width: 60px; height: 60px; font-size: 1.25rem;">
                <i class="fas fa-phone"></i>
            </div>
            <h5 class="fw-bold">Call Support</h5>
            <p class="small text-muted mb-3">Expert help 24/7</p>
            <div class="fw-bold text-primary">+91 1800-VOLT-HELP</div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="stat-card text-center py-4 h-100">
            <div class="stat-icon bg-success bg-opacity-10 text-success mx-auto mb-3" style="width: 60px; height: 60px; font-size: 1.25rem;">
                <i class="fas fa-envelope"></i>
            </div>
            <h5 class="fw-bold">Email Us</h5>
            <p class="small text-muted mb-3">Reply in 2 hours</p>
            <div class="fw-bold text-success">support@voltcharge.com</div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="stat-card text-center py-4 h-100">
            <div class="stat-icon bg-info bg-opacity-10 text-info mx-auto mb-3" style="width: 60px; height: 60px; font-size: 1.25rem;">
                <i class="fas fa-comments"></i>
            </div>
            <h5 class="fw-bold">Live Chat</h5>
            <p class="small text-muted mb-3">Instant messaging</p>
            <button class="btn btn-info text-white btn-sm rounded-pill px-4 fw-bold">Start Chat</button>
        </div>
    </div>

    <!-- FAQ Tabs -->
    <div class="col-lg-8 mt-5">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h3 class="fw-bold mb-0">Frequently Asked Questions</h3>
            <ul class="nav nav-pills bg-light p-1 rounded-pill" id="helpTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link rounded-pill px-4 {{ auth()->user()->isDriver() ? 'active' : '' }}" id="driver-tab" data-bs-toggle="pill" data-bs-target="#driver-faq" type="button" role="tab">For Drivers</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link rounded-pill px-4 {{ auth()->user()->isHost() ? 'active' : '' }}" id="host-tab" data-bs-toggle="pill" data-bs-target="#host-faq" type="button" role="tab">For Hosts</button>
                </li>
            </ul>
        </div>

        <div class="tab-content" id="helpTabsContent">
            <!-- Driver FAQ -->
            <div class="tab-pane fade {{ auth()->user()->isDriver() ? 'show active' : '' }}" id="driver-faq" role="tabpanel">
                <div class="accordion accordion-flush" id="driverAccordion">
                    <div class="stat-card mb-3 p-0 overflow-hidden border-0">
                        <div class="accordion-item border-0">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed fw-bold py-4 px-4" type="button" data-bs-toggle="collapse" data-bs-target="#d1">
                                    How do I find a charger near me?
                                </button>
                            </h2>
                            <div id="d1" class="accordion-collapse collapse" data-bs-parent="#driverAccordion">
                                <div class="accordion-body px-4 pb-4 pt-0 text-muted">
                                    Use the "Find Chargers" map in your dashboard. You can search by area, filter by charger type (Fast DC, Slow AC), and see real-time availability.
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-card mb-3 p-0 overflow-hidden border-0">
                        <div class="accordion-item border-0">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed fw-bold py-4 px-4" type="button" data-bs-toggle="collapse" data-bs-target="#d2">
                                    What is the "Battery Status" slider for?
                                </button>
                            </h2>
                            <div id="d2" class="accordion-collapse collapse" data-bs-parent="#driverAccordion">
                                <div class="accordion-body px-4 pb-4 pt-0 text-muted">
                                    The slider allows you to manually sync your car's real-time charge with our platform. This helps us recommend the best charging stops on your route.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Host FAQ -->
            <div class="tab-pane fade {{ auth()->user()->isHost() ? 'show active' : '' }}" id="host-faq" role="tabpanel">
                <div class="accordion accordion-flush" id="hostAccordion">
                    <div class="stat-card mb-3 p-0 overflow-hidden border-0">
                        <div class="accordion-item border-0">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed fw-bold py-4 px-4" type="button" data-bs-toggle="collapse" data-bs-target="#h1">
                                    How do I set my charging price?
                                </button>
                            </h2>
                            <div id="h1" class="accordion-collapse collapse" data-bs-parent="#hostAccordion">
                                <div class="accordion-body px-4 pb-4 pt-0 text-muted">
                                    When adding or editing a charger, look for the "Pricing (Per Hour)" field. You can set any rate you like, though we recommend ₹40-₹60 for standard AC charging.
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-card mb-3 p-0 overflow-hidden border-0">
                        <div class="accordion-item border-0">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed fw-bold py-4 px-4" type="button" data-bs-toggle="collapse" data-bs-target="#h2">
                                    Can I delete a station if I'm on vacation?
                                </button>
                            </h2>
                            <div id="h2" class="accordion-collapse collapse" data-bs-parent="#hostAccordion">
                                <div class="accordion-body px-4 pb-4 pt-0 text-muted">
                                    Instead of deleting, we recommend setting the station status to "Inactive" or "Maintenance" in the Edit menu. This keeps your reviews but stops new bookings.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Sidebar Tools -->
    <div class="col-lg-4 mt-5">
        <h3 class="fw-bold mb-4">Support Tools</h3>
        <div class="stat-card">
            <div class="p-3 bg-light rounded-3 mb-3 d-flex align-items-center gap-3">
                <div class="bg-white p-2 rounded shadow-sm text-primary"><i class="fas fa-file-invoice"></i></div>
                <div class="fw-bold small">Download Tax Invoices</div>
            </div>
            <div class="p-3 bg-light rounded-3 mb-3 d-flex align-items-center gap-3">
                <div class="bg-white p-2 rounded shadow-sm text-success"><i class="fas fa-shield-halved"></i></div>
                <div class="fw-bold small">Privacy & Safety Center</div>
            </div>
            <div class="p-3 bg-light rounded-3 d-flex align-items-center gap-3">
                <div class="bg-white p-2 rounded shadow-sm text-warning"><i class="fas fa-bug"></i></div>
                <div class="fw-bold small">Report a Technical Bug</div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('styles')
<style>
    .nav-pills .nav-link.active {
        background-color: var(--primary);
        color: white;
        box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
    }
    .nav-pills .nav-link {
        color: #64748b;
        font-weight: 600;
        font-size: 0.875rem;
    }
    .accordion-button:not(.collapsed) {
        background-color: transparent;
        color: var(--primary);
        box-shadow: none;
    }
    .accordion-button:focus {
        box-shadow: none;
    }
</style>
@endpush
