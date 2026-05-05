@extends('layouts.app')

@section('title', 'My Chargers')

@section('content')
<div class="row g-4">
    <div class="col-12 d-flex justify-content-between align-items-center mb-2">
        <div>
            <h2 class="fw-bold mb-1">My Chargers</h2>
            <p class="text-muted mb-0">Manage and monitor your charging stations</p>
        </div>
        <a href="{{ route('host.chargers.create') }}" class="btn btn-primary rounded-pill px-4 fw-bold">
            <i class="fas fa-plus me-2"></i> Add New Charger
        </a>
    </div>

    @foreach($chargers as $charger)
    <div class="col-md-6 col-xl-4">
        <div class="stat-card h-100">
            <div class="d-flex justify-content-between align-items-start mb-4">
                <div class="stat-icon bg-primary bg-opacity-10 text-primary mb-0">
                    <i class="fas fa-charging-station"></i>
                </div>
                <div class="badge {{ $charger->status === 'active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger' }} border-0 px-3 py-2">
                    {{ ucfirst($charger->status) }}
                </div>
            </div>

            <h4 class="fw-bold mb-1">{{ $charger->label }}</h4>
            <p class="text-muted small mb-4"><i class="fas fa-location-dot me-1"></i> {{ $charger->address }}</p>

            <div class="row g-3 mb-4">
                <div class="col-6">
                    <div class="p-2 bg-light rounded-3 text-center">
                        <div class="text-muted small mb-1">Power</div>
                        <div class="fw-bold">{{ $charger->power_kw }}kW</div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="p-2 bg-light rounded-3 text-center">
                        <div class="text-muted small mb-1">Type</div>
                        <div class="fw-bold text-capitalize">{{ str_replace('_', ' ', $charger->charger_type) }}</div>
                    </div>
                </div>
            </div>

            <div class="d-flex gap-2">
                <a href="{{ route('host.chargers.edit', $charger->id) }}" class="btn btn-outline-primary flex-grow-1 fw-bold">Edit</a>
                <button type="button" class="btn btn-outline-dark px-3" onclick="showQRCode({{ $charger->id }}, '{{ $charger->label }}')" title="Generate QR Code">
                    <i class="fas fa-qrcode"></i>
                </button>
                <form action="{{ route('host.chargers.destroy', $charger->id) }}" method="POST" onsubmit="return confirm('Are you sure you want to delete this charger?')">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="btn btn-outline-danger px-3"><i class="fas fa-trash"></i></button>
                </form>
            </div>
        </div>
    </div>
    @endforeach

    @if($chargers->isEmpty())
    <div class="col-12 text-center py-5">
        <div class="opacity-25 mb-4">
            <i class="fas fa-plug-circle-xmark" style="font-size: 5rem;"></i>
        </div>
        <h4 class="fw-bold text-muted">No chargers listed yet</h4>
        <p class="text-muted mb-4">Start earning by listing your charging station on the platform.</p>
        <a href="{{ route('host.chargers.create') }}" class="btn btn-primary px-5 rounded-pill fw-bold">Add Your First Charger</a>
    </div>
    @endif
</div>

<!-- QR Code Modal -->
<div class="modal fade" id="qrModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 24px;">
            <div class="modal-header border-0 pb-0">
                <h5 class="modal-title fw-bold" id="qrModalLabel">Station QR Code</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-center py-5">
                <div id="qrPrintArea" class="p-4 bg-white d-inline-block rounded-4 shadow-sm border mb-4">
                    <img id="qrImage" src="" alt="QR Code" class="img-fluid" style="width: 250px; height: 250px;">
                    <div class="mt-3 fw-bold text-primary" id="qrStationName"></div>
                    <div class="small text-muted">Scan to Book Charging</div>
                </div>
                <div class="d-grid gap-2 px-4">
                    <button class="btn btn-primary rounded-pill py-3 fw-bold" onclick="window.print()">
                        <i class="fas fa-print me-2"></i> Print QR Code
                    </button>
                    <a id="qrDownloadLink" href="#" download="charger-qr.png" class="btn btn-outline-primary rounded-pill py-3 fw-bold">
                        <i class="fas fa-download me-2"></i> Download Image
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
    function showQRCode(id, name) {
        const bookingUrl = window.location.origin + '/driver/book/' + id;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(bookingUrl)}`;
        
        document.getElementById('qrImage').src = qrUrl;
        document.getElementById('qrStationName').textContent = name;
        document.getElementById('qrDownloadLink').href = qrUrl;
        
        const modal = new bootstrap.Modal(document.getElementById('qrModal'));
        modal.show();
    }
</script>
<style>
    @media print {
        body * {
            visibility: hidden;
        }
        #qrPrintArea, #qrPrintArea * {
            visibility: visible;
        }
        #qrPrintArea {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            text-align: center;
            border: none !important;
            box-shadow: none !important;
        }
        .modal-header, .modal-footer, .btn, .btn-close {
            display: none !important;
        }
    }
</style>
@endpush
@endsection
