@extends('layouts.app')

@section('title', 'Charger Map View')

@push('styles')
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        #chargers-map {
            height: calc(100vh - 200px);
            border-radius: 24px;
            box-shadow: var(--card-shadow);
            border: 1px solid rgba(0,0,0,0.05);
            z-index: 1;
        }
        .map-card {
            width: 250px;
            padding: 5px;
        }
        .leaflet-popup-content-wrapper {
            border-radius: 16px;
            padding: 8px;
        }
    </style>
@endpush

@section('content')
<div class="row g-4">
    <div class="col-12 d-flex justify-content-between align-items-center mb-2">
        <div>
            <h2 class="fw-bold mb-1">Network Visualization</h2>
            <p class="text-muted mb-0">Live geographic status of your charging stations</p>
        </div>
        <div class="d-flex gap-2">
            <a href="{{ route('host.chargers.index') }}" class="btn btn-outline-primary rounded-pill px-4 fw-bold">
                <i class="fas fa-list me-2"></i> List View
            </a>
            <a href="{{ route('host.chargers.create') }}" class="btn btn-primary rounded-pill px-4 fw-bold">
                <i class="fas fa-plus me-2"></i> Add Charger
            </a>
        </div>
    </div>

    <div class="col-12">
        <div id="chargers-map"></div>
    </div>
</div>
@endsection

@push('scripts')
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const chargers = @json($chargers);
            
            if (chargers.length === 0) {
                // Default to Bangalore if no chargers
                const map = L.map('chargers-map').setView([12.9716, 77.5946], 12);
                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    attribution: '©OpenStreetMap'
                }).addTo(map);
                return;
            }

            // Center map on the first charger
            const map = L.map('chargers-map').setView([chargers[0].latitude, chargers[0].longitude], 13);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '©OpenStreetMap'
            }).addTo(map);

            const bounds = [];

            chargers.forEach(charger => {
                const marker = L.marker([charger.latitude, charger.longitude]).addTo(map);
                bounds.push([charger.latitude, charger.longitude]);

                const popupContent = `
                    <div class="map-card">
                        <h6 class="fw-bold mb-1">${charger.label}</h6>
                        <p class="text-muted small mb-2">${charger.address}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge ${charger.status === 'active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} border-0 px-2">
                                ${charger.status.toUpperCase()}
                            </span>
                            <span class="fw-bold text-primary">${charger.power_kw}kW</span>
                        </div>
                        <hr class="my-2">
                        <a href="/host/chargers/${charger.id}/edit" class="btn btn-primary btn-sm w-100 rounded-pill">Manage Station</a>
                    </div>
                `;

                marker.bindPopup(popupContent);
            });

            if (bounds.length > 1) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        });
    </script>
@endpush
