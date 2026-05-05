@extends('layouts.app')

@section('title', 'Find EV Chargers')

@push('styles')
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    <style>
        #map {
            height: 500px;
            border-radius: 20px;
            margin-bottom: 24px;
            z-index: 1;
            box-shadow: var(--card-shadow);
        }

        .search-container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .filter-section {
            position: sticky;
            top: 90px;
        }

        .charger-card {
            border: 1px solid #f1f5f9;
            border-radius: 16px;
            padding: 1.25rem;
            margin-bottom: 1rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: white;
            cursor: pointer;
        }

        .charger-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.08);
            border-color: var(--primary-light);
        }

        .charger-card.active {
            border-left: 4px solid var(--primary);
            background: #f8faff;
        }

        .badge-type {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
        }

        .price-tag {
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--primary);
        }

        /* Custom Map Markers */
        .price-marker {
            background: var(--primary);
            color: white;
            padding: 4px 8px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 12px;
            white-space: nowrap;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border: 2px solid white;
        }

        .price-marker:after {
            content: '';
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid var(--primary);
        }

        .pulse-marker {
            width: 20px;
            height: 20px;
            background: var(--primary);
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 0 rgba(79, 70, 229, 0.4);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(79, 70, 229, 0); }
            100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }

        /* Loading Overlay */
        #loadingOverlay {
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.7);
            backdrop-filter: blur(2px);
            z-index: 10;
            border-radius: 16px;
            align-items: center;
            justify-content: center;
        }
    </style>
@endpush

@section('content')
<div class="search-container">
    <div class="row g-4">
        <!-- Sidebar Filters -->
        <div class="col-lg-4 col-xl-3">
            <div class="stat-card filter-section">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4 class="fw-bold mb-0">Filters</h4>
                    <button class="btn btn-link text-muted p-0 text-decoration-none small" id="resetFilters">Reset</button>
                </div>

                <form id="searchForm" onsubmit="return false;">
                    <div class="mb-4">
                        <label class="form-label fw-bold small text-muted text-uppercase">Location</label>
                        <div class="input-group">
                            <span class="input-group-text bg-white border-end-0">
                                <i class="fas fa-location-dot text-primary"></i>
                            </span>
                            <input type="text" id="addressSearch" class="form-control border-start-0 ps-0" placeholder="Search Bangalore...">
                            <button type="button" class="btn btn-light border" id="autoLocateBtn">
                                <i class="fas fa-crosshairs"></i>
                            </button>
                        </div>
                        <div id="locationStatus" class="mt-2 small opacity-75">Move marker or search address</div>
                        <input type="hidden" id="latitude">
                        <input type="hidden" id="longitude">
                    </div>

                    <div class="mb-4">
                        <label class="form-label fw-bold small text-muted text-uppercase d-flex justify-content-between">
                            Radius <span><span id="radiusValue">10</span> km</span>
                        </label>
                        <input type="range" class="form-range" id="radius" min="1" max="50" value="10">
                    </div>

                    <div class="mb-4">
                        <label class="form-label fw-bold small text-muted text-uppercase mb-3">Charger Types</label>
                        <div class="d-grid gap-2">
                            <input type="checkbox" class="btn-check" id="ultra_fast" checked>
                            <label class="btn btn-outline-light text-dark text-start border d-flex align-items-center gap-2 py-2 px-3" for="ultra_fast">
                                <span class="fs-5">🚀</span>
                                <div>
                                    <div class="fw-bold small">Ultra Fast</div>
                                    <div class="text-muted" style="font-size: 0.65rem;">100-350kW DC</div>
                                </div>
                            </label>

                            <input type="checkbox" class="btn-check" id="fast_dc" checked>
                            <label class="btn btn-outline-light text-dark text-start border d-flex align-items-center gap-2 py-2 px-3" for="fast_dc">
                                <span class="fs-5">🔋</span>
                                <div>
                                    <div class="fw-bold small">Fast DC</div>
                                    <div class="text-muted" style="font-size: 0.65rem;">25-50kW DC</div>
                                </div>
                            </label>

                            <input type="checkbox" class="btn-check" id="fast_ac" checked>
                            <label class="btn btn-outline-light text-dark text-start border d-flex align-items-center gap-2 py-2 px-3" for="fast_ac">
                                <span class="fs-5">⚡</span>
                                <div>
                                    <div class="fw-bold small">Fast AC</div>
                                    <div class="text-muted" style="font-size: 0.65rem;">11-22kW AC</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label fw-bold small text-muted text-uppercase">Price Range (₹/hr)</label>
                        <input type="number" class="form-control" id="price_max" placeholder="Max price per hour">
                    </div>

                    <button type="button" class="btn btn-primary w-100 py-3 fw-bold" id="searchBtn">
                        <i class="fas fa-search me-2"></i> Find Chargers
                    </button>
                </form>
            </div>
        </div>

        <!-- Map and Results -->
        <div class="col-lg-8 col-xl-9">
            <div id="map"></div>

            <div class="d-flex justify-content-between align-items-end mb-4">
                <div>
                    <h3 class="fw-bold mb-1">Nearby Chargers</h3>
                    <p class="text-muted mb-0"><span id="resultCount" class="fw-bold text-primary">0</span> chargers found in your area</p>
                </div>
                <div class="btn-group shadow-sm" role="group">
                    <button type="button" class="btn btn-white active border">List</button>
                    <button type="button" class="btn btn-white border">Grid</button>
                </div>
            </div>

            <div class="position-relative">
                <div id="loadingOverlay">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
                <div id="results">
                    <!-- Results injected here -->
                    <div class="text-center py-5">
                        <div class="opacity-25 mb-3">
                            <i class="fas fa-charging-station" style="font-size: 4rem;"></i>
                        </div>
                        <h5 class="text-muted">Enter a location to find chargers</h5>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Details Modal -->
<div class="modal fade" id="chargerModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0" style="border-radius: 24px;">
            <div class="modal-body p-4" id="chargerModalBody">
                <!-- Content injected here -->
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        let map, markers = [];
        let isSearching = false;

        function initMap() {
            const defaultLat = 12.9256982;
            const defaultLng = 77.5905858;

            map = L.map('map', {zoomControl: false}).setView([defaultLat, defaultLng], 13);
            L.control.zoom({position: 'bottomright'}).addTo(map);
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '©OpenStreetMap ©CartoDB'
            }).addTo(map);

            // Default values
            document.getElementById('latitude').value = defaultLat;
            document.getElementById('longitude').value = defaultLng;

            // Pulse marker for search center
            const pulseIcon = L.divIcon({
                className: 'custom-div-icon',
                html: '<div class="pulse-marker"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            window.searchMarker = L.marker([defaultLat, defaultLng], {
                draggable: true,
                icon: pulseIcon
            }).addTo(map);

            window.searchMarker.on('dragend', function(e) {
                const pos = e.target.getLatLng();
                document.getElementById('latitude').value = pos.lat;
                document.getElementById('longitude').value = pos.lng;
                debouncedSearch();
            });

            // Trigger search
            performSearch();
        }

        async function performSearch() {
            if (isSearching) return;

            const lat = document.getElementById('latitude').value;
            const lng = document.getElementById('longitude').value;
            const radius = document.getElementById('radius').value;

            const types = [];
            ['ultra_fast', 'fast_dc', 'fast_ac'].forEach(id => {
                if (document.getElementById(id).checked) types.push(id);
            });

            const formData = {
                latitude: parseFloat(lat),
                longitude: parseFloat(lng),
                radius: parseFloat(radius),
                charger_type: types,
                price_max: document.getElementById('price_max').value ? parseFloat(document.getElementById('price_max').value) : null
            };

            isSearching = true;
            document.getElementById('loadingOverlay').style.display = 'flex';

            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
                const response = await fetch('{{ route("driver.search.api", [], false) }}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                if (data.success) {
                    displayResults(data.data);
                    updateMarkers(data.data.chargers);
                }
            } catch (error) {
                console.error(error);
            } finally {
                isSearching = false;
                document.getElementById('loadingOverlay').style.display = 'none';
            }
        }

        function displayResults(data) {
            const container = document.getElementById('results');
            document.getElementById('resultCount').textContent = data.total_count;

            if (data.total_count === 0) {
                container.innerHTML = '<div class="text-center py-5"><h5>No chargers found in this area</h5><p class="text-muted">Try increasing the search radius</p></div>';
                return;
            }

            let html = '';
            data.chargers.forEach(item => {
                const c = item.charger;
                const p = item.pricing;
                html += `
                    <div class="charger-card" onclick="showDetails(${c.id})">
                        <div class="row align-items-center">
                            <div class="col">
                                <div class="d-flex align-items-center gap-2 mb-2">
                                    <span class="badge-type ${getBadgeClass(c.charger_type)}">${c.charger_type.replace('_', ' ')}</span>
                                    <span class="small text-muted fw-bold"><i class="fas fa-location-arrow me-1"></i>${item.distance} km</span>
                                </div>
                                <h5 class="fw-bold mb-1">${escapeHtml(c.label)}</h5>
                                <p class="text-muted small mb-0"><i class="fas fa-plug me-1"></i> ${c.power_kw}kW • ${escapeHtml(c.address || 'Address Hidden')}</p>
                            </div>
                            <div class="col-auto text-end">
                                <div class="price-tag">₹${p.price_per_hour}</div>
                                <div class="text-muted small">per hour</div>
                                <button class="btn btn-sm btn-primary mt-2 rounded-pill px-3 fw-bold">Book Now</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        function updateMarkers(chargers) {
            markers.forEach(m => map.removeLayer(m));
            markers = [];

            chargers.forEach(item => {
                const c = item.charger;
                const p = item.pricing;

                const icon = L.divIcon({
                    className: 'custom-price-marker',
                    html: `<div class="price-marker">₹${p.price_per_hour}</div>`,
                    iconSize: [60, 30],
                    iconAnchor: [30, 30]
                });

                const m = L.marker([c.latitude, c.longitude], {icon: icon})
                    .addTo(map)
                    .on('click', () => showDetails(c.id));
                
                markers.push(m);
            });
        }

        function getBadgeClass(type) {
            if (type === 'ultra_fast') return 'bg-danger text-white';
            if (type === 'fast_dc') return 'bg-warning text-dark';
            return 'bg-primary text-white';
        }

        async function showDetails(id) {
            try {
                const response = await fetch(`{{ route('driver.estimate.price', ['chargerId' => '__ID__'], false) }}`.replace('__ID__', id));
                const data = await response.json();
                if (data.success) {
                    const c = data.charger;
                    const p = data.pricing;
                    const body = document.getElementById('chargerModalBody');
                    body.innerHTML = `
                        <div class="text-center mb-4">
                            <div class="fs-1 mb-2">${getIcon(c.charger_type)}</div>
                            <h3 class="fw-bold mb-0">${escapeHtml(c.label)}</h3>
                            <p class="text-muted">${escapeHtml(c.address || 'Charging Station')}</p>
                        </div>
                        
                        <div class="row g-3 mb-4">
                            <div class="col-6">
                                <div class="p-3 bg-light rounded-4 text-center">
                                    <div class="text-muted small mb-1">Power</div>
                                    <div class="fw-bold fs-5">${c.power_kw}kW</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="p-3 bg-light rounded-4 text-center">
                                    <div class="text-muted small mb-1">Type</div>
                                    <div class="fw-bold fs-5 text-uppercase">${c.charger_type.split('_')[1] || 'AC'}</div>
                                </div>
                            </div>
                        </div>

                        <div class="stat-card bg-primary bg-opacity-5 border-0 mb-4">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="small fw-bold text-primary text-uppercase">Current Price</div>
                                    <div class="fs-2 fw-extrabold text-primary">₹${p.price_per_hour}<span class="fs-6 fw-normal text-muted">/hr</span></div>
                                </div>
                                <div class="text-end">
                                    <div class="badge bg-success">Available</div>
                                </div>
                            </div>
                        </div>

                        <button class="btn btn-primary w-100 py-3 rounded-pill fw-bold fs-5" onclick="location.href='/driver/book/${c.id}'">
                            Confirm Booking
                        </button>
                    `;
                    new bootstrap.Modal(document.getElementById('chargerModal')).show();
                }
            } catch (e) { console.error(e); }
        }

        function getIcon(type) {
            if (type === 'ultra_fast') return '🚀';
            if (type === 'fast_dc') return '🔋';
            return '⚡';
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        let timeout;
        function debouncedSearch() {
            clearTimeout(timeout);
            timeout = setTimeout(performSearch, 500);
        }

        document.getElementById('radius').addEventListener('input', e => {
            document.getElementById('radiusValue').textContent = e.target.value;
            debouncedSearch();
        });

        document.getElementById('searchBtn').addEventListener('click', performSearch);
        document.getElementById('resetFilters').addEventListener('click', () => {
            document.getElementById('searchForm').reset();
            document.getElementById('radiusValue').textContent = 10;
            performSearch();
        });

        window.addEventListener('load', initMap);
    </script>
@endpush