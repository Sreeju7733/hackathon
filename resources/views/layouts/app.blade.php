<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title') - VoltCharge</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    
    <!-- CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        :root {
            --primary: #4f46e5;
            --primary-dark: #4338ca;
            --primary-light: #818cf8;
            --bg-body: #f8fafc;
            --sidebar-width: 280px;
            --sidebar-bg: #ffffff;
            --card-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
            --radius-lg: 16px;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-body);
            color: #1e293b;
            overflow-x: hidden;
        }

        h1, h2, h3, h4, h5, .fw-bold {
            font-family: 'Outfit', sans-serif;
        }

        /* Sidebar Styling */
        #sidebar {
            width: var(--sidebar-width);
            height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            background: var(--sidebar-bg);
            border-right: 1px solid #e2e8f0;
            z-index: 1000;
            transition: all 0.3s;
            display: flex;
            flex-direction: column;
        }

        #sidebar.active {
            margin-left: calc(-1 * var(--sidebar-width));
        }

        .sidebar-header {
            padding: 2rem 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .logo-box {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.25rem;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        .brand-name {
            font-size: 1.5rem;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
        }

        .sidebar-menu {
            padding: 0.5rem 1rem;
            flex-grow: 1;
            overflow-y: auto;
        }

        .menu-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #94a3b8;
            font-weight: 700;
            margin: 1.5rem 0 0.75rem 0.75rem;
        }

        .nav-link {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.875rem 1rem;
            color: #64748b;
            font-weight: 500;
            border-radius: 12px;
            transition: all 0.2s;
            margin-bottom: 0.25rem;
        }

        .nav-link i {
            font-size: 1.15rem;
            width: 24px;
            text-align: center;
        }

        .nav-link:hover {
            color: var(--primary);
            background: #f1f5f9;
        }

        .nav-link.active {
            color: white;
            background: var(--primary);
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        }

        .sidebar-footer {
            padding: 1.5rem;
            border-top: 1px solid #e2e8f0;
        }

        .user-card {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            background: #f8fafc;
            border-radius: var(--radius-lg);
        }

        /* Main Content */
        #content {
            width: 100%;
            padding-left: var(--sidebar-width);
            min-height: 100vh;
            transition: all 0.3s;
        }

        #content.active {
            padding-left: 0;
        }

        /* Navbar */
        .top-navbar {
            height: 70px;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid #e2e8f0;
            padding: 0 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 999;
        }

        #sidebarCollapse {
            background: none;
            border: none;
            color: #64748b;
            font-size: 1.25rem;
            cursor: pointer;
            padding: 0.5rem;
        }

        .page-content {
            padding: 2rem;
            max-width: 1600px;
            margin: 0 auto;
        }

        /* Stats Cards */
        .stat-card {
            background: white;
            border-radius: var(--radius-lg);
            padding: 1.5rem;
            box-shadow: var(--card-shadow);
            border: 1px solid rgba(226, 232, 240, 0.5);
            transition: transform 0.2s;
        }

        .stat-card:hover {
            transform: translateY(-5px);
        }

        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            margin-bottom: 1rem;
        }

        /* Mobile Responsive */
        @media (max-width: 992px) {
            #sidebar {
                margin-left: calc(-1 * var(--sidebar-width));
            }
            #sidebar.active {
                margin-left: 0;
            }
            #content {
                padding-left: 0;
            }
            #content.active {
                padding-left: var(--sidebar-width);
            }
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
            width: 6px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
    </style>
    @stack('styles')
</head>
<body>

    <div class="wrapper d-flex">
        <!-- Sidebar -->
        <nav id="sidebar">
            <div class="sidebar-header">
                <div class="logo-box">
                    <i class="fas fa-bolt"></i>
                </div>
                <span class="brand-name">VoltCharge</span>
            </div>

            <div class="sidebar-menu">
                <div class="menu-label">Main</div>
                <a href="{{ route('dashboard') }}" class="nav-link {{ request()->is('dashboard') || request()->is('*/dashboard') ? 'active' : '' }}">
                    <i class="fas fa-chart-pie"></i>
                    <span>Overview</span>
                </a>

                @if(auth()->user()->isAdmin())
                    <div class="menu-label">Administration</div>
                    <a href="{{ route('admin.users.index') }}" class="nav-link {{ request()->routeIs('admin.users.*') ? 'active' : '' }}">
                        <i class="fas fa-users-gear"></i>
                        <span>User Management</span>
                    </a>
                @endif

                @if(auth()->user()->isHost())
                    <div class="menu-label">Host Panel</div>
                    <a href="{{ route('host.chargers.index') }}" class="nav-link {{ request()->routeIs('host.chargers.index') ? 'active' : '' }}">
                        <i class="fas fa-plug-circle-bolt"></i>
                        <span>My Chargers</span>
                    </a>
                    <a href="{{ route('host.chargers.map') }}" class="nav-link {{ request()->routeIs('host.chargers.map') ? 'active' : '' }}">
                        <i class="fas fa-map-location-dot"></i>
                        <span>Network Map</span>
                    </a>
                    <a href="{{ route('host.reservations.index') }}" class="nav-link {{ request()->routeIs('host.reservations.*') ? 'active' : '' }}">
                        <i class="fas fa-calendar-days"></i>
                        <span>Reservations</span>
                    </a>
                @endif

                @if(auth()->user()->isDriver())
                    <div class="menu-label">Driver Panel</div>
                    <a href="{{ route('driver.search') }}" class="nav-link {{ request()->routeIs('driver.search') ? 'active' : '' }}">
                        <i class="fas fa-location-dot"></i>
                        <span>Find Chargers</span>
                    </a>
                    <a href="{{ route('driver.dashboard') }}" class="nav-link {{ request()->routeIs('driver.dashboard') ? 'active' : '' }}">
                        <i class="fas fa-clock-rotate-left"></i>
                        <span>My History</span>
                    </a>
                @endif

                <div class="menu-label">Settings</div>
                <a href="{{ route('profile.edit') }}" class="nav-link {{ request()->routeIs('profile.edit') ? 'active' : '' }}">
                    <i class="fas fa-user-gear"></i>
                    <span>Profile Settings</span>
                </a>

                <div class="menu-label">Support</div>
                <a href="{{ route('help') }}" class="nav-link {{ request()->routeIs('help') ? 'active' : '' }}">
                    <i class="fas fa-circle-question"></i>
                    <span>Help Center</span>
                </a>
            </div>

            <div class="sidebar-footer">
                <div class="user-card">
                    <div class="user-avatar" style="width: 40px; height: 40px; background: #e0e7ff; color: var(--primary); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                        {{ strtoupper(substr(auth()->user()->name, 0, 1)) }}
                    </div>
                    <div class="user-info flex-grow-1 overflow-hidden">
                        <div class="user-name text-truncate" style="font-weight: 600; font-size: 0.875rem;">{{ auth()->user()->name }}</div>
                        <div class="user-role text-muted" style="font-size: 0.75rem;">{{ ucfirst(auth()->user()->role) }}</div>
                    </div>
                    <form action="{{ route('logout') }}" method="POST" id="logout-form">
                        @csrf
                        <button type="submit" class="btn-logout text-danger" style="border: none; background: none; font-size: 1rem; cursor: pointer;">
                            <i class="fas fa-right-from-bracket"></i>
                        </button>
                    </form>
                </div>
            </div>
        </nav>

        <!-- Page Content -->
        <div id="content">
            <header class="top-navbar">
                <button type="button" id="sidebarCollapse">
                    <i class="fas fa-bars-staggered"></i>
                </button>

                <div class="d-flex align-items-center gap-3">
                    <a href="{{ route('help') }}" class="btn btn-light rounded-pill px-3 py-2 border d-flex align-items-center gap-2 small fw-bold text-muted">
                        <i class="fas fa-circle-question text-primary"></i>
                        Help
                    </a>
                    <div class="vr mx-2 text-muted opacity-25" style="height: 24px;"></div>
                    <div class="current-date d-none d-md-block text-muted small fw-medium">
                        {{ now()->format('D, M d, Y') }}
                    </div>
                </div>
            </header>

            <div class="page-content">
                @if(session('success'))
                    <div class="alert alert-success border-0 shadow-sm d-flex align-items-center gap-3 mb-4" role="alert" style="border-radius: 12px; background: #ecfdf5;">
                        <i class="fas fa-circle-check fs-4"></i>
                        <div>{{ session('success') }}</div>
                        <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                @endif

                @yield('content')
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        $(document).ready(function () {
            $('#sidebarCollapse, #overlay').on('click', function () {
                $('#sidebar').toggleClass('active');
                $('#content').toggleClass('active');
                $('#overlay').toggleClass('active');
            });
        });
    </script>
    @stack('scripts')
</body>
</html>
