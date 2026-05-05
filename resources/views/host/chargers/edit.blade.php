@extends('layouts.app')

@section('title', 'Edit Charger')

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
    </style>
@endpush

@section('content')
<div class="row justify-content-center">
    <div class="col-lg-10">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold mb-0">Edit Charging Station</h2>
            <a href="{{ route('host.chargers.index') }}" class="btn btn-outline-secondary rounded-pill px-4">Cancel</a>
        </div>

        <form action="{{ route('host.chargers.update', $charger->id) }}" method="POST">
            @csrf
            <div class="row g-4">
                <!-- Location Panel -->
                <div class="col-md-7">
                    <div class="form-section h-100">
                        <h4 class="fw-bold mb-4">Location Details</h4>
                        
                        <div id="map"></div>
                        
                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label small fw-bold text-muted text-uppercase">Physical Address</label>
                                <textarea name="address" id="address" class="form-control" rows="3" required>{{ old('address', $charger->address) }}</textarea>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-bold text-muted text-uppercase">Latitude</label>
                                <input type="text" name="latitude" id="latitude" class="form-control" value="{{ old('latitude', $charger->latitude) }}" readonly required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-bold text-muted text-uppercase">Longitude</label>
                                <input type="text" name="longitude" id="longitude" class="form-control" value="{{ old('longitude', $charger->longitude) }}" readonly required>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Specs Panel -->
                <div class="col-md-5">
                    <div class="form-section h-100">
                        <h4 class="fw-bold mb-4">Charger Specs</h4>
                        
                        <div class="mb-4">
                            <label class="form-label small fw-bold text-muted text-uppercase">Station Name</label>
                            <input type="text" name="label" class="form-control form-control-lg" value="{{ old('label', $charger->label) }}" required>
                        </div>

                        <div class="mb-4">
                            <label class="form-label small fw-bold text-muted text-uppercase">Charger Type</label>
                            <select name="charger_type" class="form-select form-select-lg" required>
                                <option value="slow_ac" {{ $charger->charger_type === 'slow_ac' ? 'selected' : '' }}>Slow AC (3-7kW)</option>
                                <option value="fast_ac" {{ $charger->charger_type === 'fast_ac' ? 'selected' : '' }}>Fast AC (11-22kW)</option>
                                <option value="fast_dc" {{ $charger->charger_type === 'fast_dc' ? 'selected' : '' }}>Fast DC (25-50kW)</option>
                                <option value="ultra_fast" {{ $charger->charger_type === 'ultra_fast' ? 'selected' : '' }}>Ultra Fast (100-350kW)</option>
                            </select>
                        </div>

                        <div class="mb-4">
                            <label class="form-label small fw-bold text-muted text-uppercase">Max Power Output</label>
                            <div class="input-group input-group-lg">
                                <input type="number" name="power_kw" class="form-control" value="{{ old('power_kw', $charger->power_kw) }}" required>
                                <span class="input-group-text bg-white border-start-0">kW</span>
                            </div>
                        </div>

                        <div class="mb-4">
                            <label class="form-label small fw-bold text-muted text-uppercase">Pricing (Per Hour)</label>
                            <div class="input-group input-group-lg">
                                <span class="input-group-text bg-white border-end-0">₹</span>
                                <input type="number" name="base_price_per_hour" class="form-control" value="{{ old('base_price_per_hour', $charger->base_price_per_hour) }}" required>
                            </div>
                        </div>

                        <div class="mb-4">
                            <label class="form-label small fw-bold text-muted text-uppercase">Status</label>
                            <select name="status" class="form-select form-select-lg" required>
                                <option value="active" {{ $charger->status === 'active' ? 'selected' : '' }}>Active</option>
                                <option value="inactive" {{ $charger->status === 'inactive' ? 'selected' : '' }}>Inactive</option>
                                <option value="maintenance" {{ $charger->status === 'maintenance' ? 'selected' : '' }}>Maintenance</option>
                            </select>
                        </div>

                        <button type="submit" class="btn btn-primary w-100 py-3 rounded-pill fw-bold fs-5 shadow-lg">
                            Save Changes <i class="fas fa-check ms-2"></i>
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
            const lat = {{ $charger->latitude }};
            const lng = {{ $charger->longitude }};

            map = L.map('map').setView([lat, lng], 15);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '©OpenStreetMap'
            }).addTo(map);

            marker = L.marker([lat, lng], {
                draggable: true
            }).addTo(map);

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

        window.addEventListener('load', initMap);
    </script>
@endpush
