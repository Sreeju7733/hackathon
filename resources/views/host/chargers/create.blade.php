@extends('layouts.app')

@section('title', 'Add New Charger')

@push('styles')
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        #map {
            height: 350px;
            border-radius: 16px;
            margin-bottom: 1rem;
            box-shadow: var(--card-shadow);
        }
        .form-section {
            background: white;
            border-radius: 24px;
            padding: 2.5rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .step-badge {
            width: 32px;
            height: 32px;
            background: var(--primary);
            color: white;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            margin-right: 10px;
        }
    </style>
@endpush

@section('content')
<div class="row justify-content-center">
    <div class="col-lg-10">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold mb-0">Add New Charging Station</h2>
            <a href="{{ route('host.dashboard') }}" class="btn btn-outline-secondary rounded-pill px-4">Cancel</a>
        </div>

        <form action="{{ route('host.chargers.store') }}" method="POST">
            @csrf
            <div class="row g-4">
                <!-- Location Panel -->
                <div class="col-md-7">
                    <div class="form-section h-100">
                        <h4 class="fw-bold mb-4"><span class="step-badge">1</span>Pinpoint Location</h4>
                        
                        <div id="map"></div>
                        
                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label small fw-bold text-muted text-uppercase">Physical Address</label>
                                <textarea name="address" id="address" class="form-control" rows="3" placeholder="Enter full address or move pin on map" required>{{ old('address') }}</textarea>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-bold text-muted text-uppercase">Latitude</label>
                                <input type="text" name="latitude" id="latitude" class="form-control" value="{{ old('latitude') }}" readonly required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-bold text-muted text-uppercase">Longitude</label>
                                <input type="text" name="longitude" id="longitude" class="form-control" value="{{ old('longitude') }}" readonly required>
                            </div>
                        </div>

                        <div class="mt-4">
                            <button type="button" class="btn btn-light w-100 py-3 fw-bold border" id="autoLocateBtn">
                                <i class="fas fa-location-crosshairs me-2"></i> Auto-detect My Location
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Specs Panel -->
                <div class="col-md-5">
                    <div class="form-section h-100">
                        <h4 class="fw-bold mb-4"><span class="step-badge">2</span>Charger Specs</h4>
                        
                        <div class="mb-4">
                            <label class="form-label small fw-bold text-muted text-uppercase">Station Name</label>
                            <input type="text" name="label" class="form-control form-control-lg" placeholder="e.g. MG Road Fast DC" value="{{ old('label') }}" required>
                        </div>

                        <div class="mb-4">
                            <label class="form-label small fw-bold text-muted text-uppercase">Charger Type</label>
                            <select name="charger_type" class="form-select form-select-lg" required>
                                <option value="slow_ac">Slow AC (3-7kW)</option>
                                <option value="fast_ac">Fast AC (11-22kW)</option>
                                <option value="fast_dc">Fast DC (25-50kW)</option>
                                <option value="ultra_fast">Ultra Fast (100-350kW)</option>
                            </select>
                        </div>

                        <div class="mb-4">
                            <label class="form-label small fw-bold text-muted text-uppercase">Max Power Output</label>
                            <div class="input-group input-group-lg">
                                <input type="number" name="power_kw" class="form-control" placeholder="50" value="{{ old('power_kw') }}" required>
                                <span class="input-group-text bg-white border-start-0">kW</span>
                            </div>
                        </div>

                        <div class="mb-4">
                            <label class="form-label small fw-bold text-muted text-uppercase">Pricing (Per Hour)</label>
                            <div class="input-group input-group-lg">
                                <span class="input-group-text bg-white border-end-0">₹</span>
                                <input type="number" name="base_price_per_hour" class="form-control" placeholder="50" value="{{ old('base_price_per_hour', 50) }}" required>
                            </div>
                        </div>

                        <div class="stat-card bg-primary bg-opacity-5 border-0 p-3 mb-4">
                            <div class="d-flex align-items-center gap-2 small">
                                <i class="fas fa-circle-info text-primary"></i>
                                <span class="text-muted">Once added, your charger will be visible to all nearby EV drivers.</span>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary w-100 py-3 rounded-pill fw-bold fs-5 shadow-lg">
                            List My Charger <i class="fas fa-plus ms-2"></i>
                        </button>
                    </div>
                </div>
            </div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        let map, marker;

        function initMap() {
            // Default center: Bangalore
            const defaultLat = 12.9716;
            const defaultLng = 77.5946;

            map = L.map('map').setView([defaultLat, defaultLng], 13);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '©OpenStreetMap'
            }).addTo(map);

            marker = L.marker([defaultLat, defaultLng], {
                draggable: true
            }).addTo(map);

            updateInputs(defaultLat, defaultLng);

            marker.on('dragend', function(e) {
                const pos = e.target.getLatLng();
                updateInputs(pos.lat, pos.lng);
                reverseGeocode(pos.lat, pos.lng);
            });

            map.on('click', function(e) {
                marker.setLatLng(e.latlng);
                updateInputs(e.latlng.lat, e.latlng.lng);
                reverseGeocode(e.latlng.lat, e.latlng.lng);
            });
        }

        function updateInputs(lat, lng) {
            document.getElementById('latitude').value = lat.toFixed(6);
            document.getElementById('longitude').value = lng.toFixed(6);
        }

        async function reverseGeocode(lat, lng) {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await response.json();
                if (data.display_name) {
                    document.getElementById('address').value = data.display_name;
                }
            } catch (error) {
                console.error('Reverse geocoding failed', error);
            }
        }

        document.getElementById('autoLocateBtn').addEventListener('click', function() {
            if (navigator.geolocation) {
                const btn = this;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Detecting...';

                navigator.geolocation.getCurrentPosition(function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    const newLatLng = new L.LatLng(lat, lng);
                    marker.setLatLng(newLatLng);
                    map.setView(newLatLng, 16);
                    updateInputs(lat, lng);
                    reverseGeocode(lat, lng);

                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-check me-2"></i> Location Detected';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-location-crosshairs me-2"></i> Auto-detect My Location';
                    }, 2000);
                }, function(error) {
                    alert('Error: ' + error.message);
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-location-crosshairs me-2"></i> Auto-detect My Location';
                });
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        });

        window.addEventListener('load', initMap);
    </script>
@endpush
