@extends('layouts.app')

@section('title', 'Secure Payment')

@push('styles')
<style>
    .payment-card {
        background: white;
        border-radius: 30px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.05);
        overflow: hidden;
        border: 1px solid #f1f5f9;
    }

    .payment-header {
        background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
        padding: 3rem 2rem;
        color: white;
        text-align: center;
    }

    .checkout-summary {
        background: #f8fafc;
        border-radius: 20px;
        padding: 1.5rem;
    }

    .method-card {
        border: 2px solid #f1f5f9;
        border-radius: 20px;
        padding: 1.25rem;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .method-card:hover {
        border-color: var(--primary-light);
        background: #f8faff;
    }

    .method-card.selected {
        border-color: var(--primary);
        background: #f5f3ff;
    }

    .method-card input {
        display: none;
    }

    .method-icon {
        width: 48px;
        height: 48px;
        background: white;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }

    /* Credit Card Mockup */
    .credit-card {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-radius: 20px;
        padding: 1.5rem;
        color: white;
        position: relative;
        margin-bottom: 2rem;
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        display: none; /* Shown when card is selected */
    }

    .card-chip {
        width: 40px;
        height: 30px;
        background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
        border-radius: 4px;
        margin-bottom: 1.5rem;
    }

    .card-number {
        font-family: 'Courier New', monospace;
        font-size: 1.25rem;
        letter-spacing: 2px;
        margin-bottom: 1.5rem;
    }
</style>
@endpush

@section('content')
<div class="row justify-content-center">
    <div class="col-xl-10">
        <div class="payment-card">
            <div class="row g-0">
                <!-- Right Side: Header & Info (Modern Layout) -->
                <div class="col-lg-5 payment-header d-flex flex-column justify-content-center">
                    <div class="mb-4">
                        <i class="fas fa-shield-check fa-4x mb-3 opacity-75"></i>
                        <h1 class="fw-bold h2">Secure Checkout</h1>
                        <p class="opacity-75">Transaction ID: #VC-{{ str_pad($booking->id, 6, '0', STR_PAD_LEFT) }}</p>
                    </div>

                    <div class="checkout-summary text-start text-dark mt-4">
                        <h5 class="fw-bold mb-3 border-bottom pb-2">Order Summary</h5>
                        <div class="d-flex justify-content-between mb-2 small">
                            <span class="text-muted">Charger</span>
                            <span class="fw-bold">{{ $booking->charger->label }}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2 small">
                            <span class="text-muted">Duration</span>
                            <span class="fw-bold">{{ $booking->start_time->diffInHours($booking->end_time) }} Hours</span>
                        </div>
                        <div class="d-flex justify-content-between mb-3 small">
                            <span class="text-muted">Schedule</span>
                            <span class="fw-bold text-end">{{ $booking->start_time->format('M d, h:i A') }}</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center border-top pt-3 mt-2">
                            <span class="fw-bold">Total to Pay</span>
                            <span class="h3 mb-0 fw-extrabold text-primary">₹{{ number_format($booking->total_price, 2) }}</span>
                        </div>
                    </div>

                    <div class="mt-auto pt-5 small opacity-50">
                        <i class="fas fa-lock me-1"></i> End-to-end encrypted
                    </div>
                </div>

                <!-- Left Side: Payment Selection -->
                <div class="col-lg-7 p-4 p-md-5">
                    <h4 class="fw-bold mb-4">Choose Payment Method</h4>
                    
                    <form action="{{ route('driver.payment.process', $booking->id) }}" method="POST" id="paymentForm">
                        @csrf
                        
                        <div class="method-card selected" onclick="selectMethod(this, 'upi')">
                            <input type="radio" name="method" value="upi" checked>
                            <div class="method-icon text-primary">
                                <i class="fas fa-mobile-button"></i>
                            </div>
                            <div class="flex-grow-1">
                                <div class="fw-bold">UPI / Instant Pay</div>
                                <div class="text-muted small">Pay using GPay, PhonePe or any UPI app</div>
                            </div>
                            <i class="fas fa-circle-check text-primary"></i>
                        </div>

                        <div class="method-card" onclick="selectMethod(this, 'card')">
                            <input type="radio" name="method" value="card">
                            <div class="method-icon text-success">
                                <i class="fas fa-credit-card"></i>
                            </div>
                            <div class="flex-grow-1">
                                <div class="fw-bold">Credit / Debit Card</div>
                                <div class="text-muted small">Visa, Mastercard, RuPay</div>
                            </div>
                            <i class="fas fa-circle-check text-muted opacity-25"></i>
                        </div>

                        <!-- Card Mockup (Shows when card selected) -->
                        <div class="credit-card" id="cardMockup">
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="card-chip"></div>
                                <i class="fab fa-cc-visa fa-2x"></i>
                            </div>
                            <div class="card-number">**** **** **** 4242</div>
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="text-muted small" style="font-size: 0.6rem; text-transform: uppercase;">Card Holder</div>
                                    <div class="small fw-bold">{{ auth()->user()->name }}</div>
                                </div>
                                <div>
                                    <div class="text-muted small" style="font-size: 0.6rem; text-transform: uppercase;">Expires</div>
                                    <div class="small fw-bold">12/28</div>
                                </div>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary w-100 py-3 rounded-pill fw-bold fs-5 mt-4 shadow-lg" id="payBtn">
                            Pay ₹{{ number_format($booking->total_price, 2) }}
                        </button>
                    </form>

                    <div class="text-center mt-4">
                        <img src="https://help.payu.in/wp-content/uploads/2019/04/pci-dss-logo.png" height="30" class="opacity-25 grayscale">
                        <p class="text-muted small mt-2">Your payment is processed securely by VoltPay</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
    function selectMethod(el, type) {
        // Remove selection from all
        document.querySelectorAll('.method-card').forEach(card => {
            card.classList.remove('selected');
            card.querySelector('.fa-circle-check').className = 'fas fa-circle-check text-muted opacity-25';
        });

        // Select current
        el.classList.add('selected');
        el.querySelector('input').checked = true;
        el.querySelector('.fa-circle-check').className = 'fas fa-circle-check text-primary';

        // Toggle card mockup
        const cardMockup = document.getElementById('cardMockup');
        if (type === 'card') {
            cardMockup.style.display = 'block';
            cardMockup.classList.add('animate__animated', 'animate__fadeIn');
        } else {
            cardMockup.style.display = 'none';
        }
    }

    document.getElementById('paymentForm').addEventListener('submit', function(e) {
        const btn = document.getElementById('payBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Processing...';
    });
</script>
@endpush
