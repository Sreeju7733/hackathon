    <title>chrgbnb | The Airbnb for EV Charging</title>
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- AOS CSS -->
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    
    <style>
        :root {
            --primary: #2563eb;
            --primary-dark: #1e40af;
            --secondary: #6366f1;
            --dark: #0f172a;
            --text-muted: #64748b;
        }

        body {
            font-family: 'Inter', sans-serif;
            color: var(--dark);
            overflow-x: hidden;
        }

        h1, h2, h3, h4, .brand {
            font-family: 'Outfit', sans-serif;
        }

        /* Navbar */
        .navbar {
            padding: 1.5rem 0;
            transition: all 0.3s;
            background: transparent;
        }

        .navbar.scrolled {
            background: white;
            padding: 1rem 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }

        .navbar-brand {
            font-weight: 800;
            font-size: 1.8rem;
            color: var(--primary) !important;
            letter-spacing: -1px;
        }

        .nav-link {
            font-weight: 600;
            color: var(--dark) !important;
            margin: 0 1rem;
        }

        .nav-link:hover {
            color: var(--primary) !important;
        }

        /* Hero Section */
        .hero {
            padding: 160px 0 100px;
            background: radial-gradient(circle at 90% 10%, rgba(37, 99, 235, 0.05) 0%, transparent 40%),
                        radial-gradient(circle at 10% 90%, rgba(99, 102, 241, 0.05) 0%, transparent 40%);
            min-height: 90vh;
            display: flex;
            align-items: center;
        }

        .hero-title {
            font-size: 4.5rem;
            font-weight: 800;
            line-height: 1.1;
            margin-bottom: 1.5rem;
            background: linear-gradient(to right, var(--dark), var(--primary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
            font-size: 1.25rem;
            color: var(--text-muted);
            margin-bottom: 2.5rem;
            max-width: 600px;
        }

        /* Search Bar */
        .search-container {
            background: white;
            padding: 10px;
            border-radius: 100px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            max-width: 800px;
            margin-bottom: 4rem;
            border: 1px solid #f1f5f9;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .search-container:focus-within {
            transform: scale(1.02);
            box-shadow: 0 30px 60px rgba(0,0,0,0.12);
        }

        .search-input {
            border: none;
            padding: 15px 30px;
            flex-grow: 1;
            border-radius: 100px;
            outline: none;
            font-weight: 500;
        }

        .search-divider {
            height: 30px;
            width: 1px;
            background: #e2e8f0;
        }

        .btn-search {
            background: var(--primary);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 100px;
            font-weight: 700;
            transition: all 0.3s;
        }

        .btn-search:hover {
            background: var(--primary-dark);
            transform: scale(1.05);
            box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
        }

        /* Stats */
        .stat-card {
            background: white;
            border-radius: 24px;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.03);
            border: 1px solid #f1f5f9;
            transition: all 0.3s;
        }

        .stat-card:hover {
            transform: translateY(-10px);
            border-color: var(--primary);
            box-shadow: 0 20px 40px rgba(37, 99, 235, 0.1);
        }

        .stat-number {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--primary);
            margin-bottom: 0.5rem;
        }

        /* Features */
        .feature-icon {
            width: 64px;
            height: 64px;
            background: rgba(37, 99, 235, 0.1);
            color: var(--primary);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            transition: all 0.3s;
        }

        .col-md-4:hover .feature-icon {
            background: var(--primary);
            color: white;
            transform: rotate(10deg);
        }

        /* CTA Section */
        .cta-section {
            background: var(--dark);
            border-radius: 50px;
            padding: 100px 0;
            margin: 100px 0;
            color: white;
            position: relative;
            overflow: hidden;
        }

        /* Animations */
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
        }

        .animate-float {
            animation: float 6s ease-in-out infinite;
        }

        .btn-primary {
            background: var(--primary);
            border: none;
            border-radius: 100px;
            padding: 12px 30px;
            font-weight: 700;
            transition: all 0.3s;
        }

        .btn-primary:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
        }

        footer {
            padding: 80px 0 40px;
            background: #f8fafc;
        }
    </style>
</head>
<body>

    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg fixed-top">
        <div class="container">
            <a class="navbar-brand" href="#" data-aos="fade-right">
                <i class="fas fa-bolt me-2"></i>chrgbnb
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto align-items-center" data-aos="fade-left">
                    <li class="nav-item"><a class="nav-link" href="#how-it-works">How it Works</a></li>
                    <li class="nav-item"><a class="nav-link" href="#host">Become a Host</a></li>
                    @guest
                        <li class="nav-item"><a class="nav-link" href="{{ route('login') }}">Sign In</a></li>
                        <li class="nav-item ms-lg-3">
                            <a class="btn btn-primary rounded-pill px-4 py-2 fw-bold" href="{{ route('register') }}">Join Now</a>
                        </li>
                    @else
                        <li class="nav-item ms-lg-3">
                            <a class="btn btn-primary rounded-pill px-4 py-2 fw-bold" href="{{ route('dashboard') }}">Go to Dashboard <i class="fas fa-arrow-right ms-2"></i></a>
                        </li>
                    @endguest
                </ul>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="hero">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-7" data-aos="fade-up" data-aos-delay="100">
                    <h1 class="hero-title">Rent a Charger, <br> Anywhere.</h1>
                    <p class="hero-subtitle">The world's first decentralized EV charging network. Find private chargers in neighborhoods or monetize your home station with chrgbnb.</p>
                    
                    <div class="search-container d-none d-md-flex">
                        <input type="text" class="search-input" placeholder="Where do you want to charge?">
                        <div class="search-divider"></div>
                        <input type="text" class="search-input" placeholder="When?">
                        <button class="btn btn-search">Search Now</button>
                    </div>

                    <div class="d-flex gap-3 mt-4">
                        <div class="d-flex align-items-center gap-2">
                            <i class="fas fa-check-circle text-success"></i>
                            <span class="small fw-bold">Verified Stations</span>
                        </div>
                        <div class="d-flex align-items-center gap-2 ms-3">
                            <i class="fas fa-check-circle text-success"></i>
                            <span class="small fw-bold">Safe Payments</span>
                        </div>
                        <div class="d-flex align-items-center gap-2 ms-3">
                            <i class="fas fa-check-circle text-success"></i>
                            <span class="small fw-bold">24/7 Support</span>
                        </div>
                    </div>
                </div>
                <div class="col-lg-5 d-none d-lg-block" data-aos="zoom-in" data-aos-delay="300">
                    <div class="position-relative animate-float">
                        <img src="https://img.freepik.com/free-vector/ev-charging-station-concept-illustration_114360-6302.jpg" alt="EV Charging" class="img-fluid rounded-5 shadow-lg">
                        <div class="position-absolute bottom-0 start-0 p-4 bg-white rounded-4 shadow-lg m-4 border animate-bounce" style="width: 200px;">
                            <div class="d-flex gap-2 align-items-center mb-2">
                                <span class="badge bg-success rounded-pill">Active</span>
                                <span class="small fw-bold">₹150/hr</span>
                            </div>
                            <div class="small text-muted">Indiranagar Station #42</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Stats -->
    <section class="py-5">
        <div class="container">
            <div class="row g-4">
                <div class="col-md-4" data-aos="fade-up" data-aos-delay="100">
                    <div class="stat-card">
                        <div class="stat-number">12k+</div>
                        <div class="fw-bold text-muted uppercase small">Active Chargers</div>
                    </div>
                </div>
                <div class="col-md-4" data-aos="fade-up" data-aos-delay="200">
                    <div class="stat-card">
                        <div class="stat-number">₹4.2M</div>
                        <div class="fw-bold text-muted uppercase small">Earned by Hosts</div>
                    </div>
                </div>
                <div class="col-md-4" data-aos="fade-up" data-aos-delay="300">
                    <div class="stat-card">
                        <div class="stat-number">50k+</div>
                        <div class="fw-bold text-muted uppercase small">Happy Drivers</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- How it Works -->
    <section id="how-it-works" class="py-100 mt-5">
        <div class="container">
            <div class="text-center mb-5" data-aos="fade-up">
                <h2 class="fw-bold display-5">Simple as 1-2-3</h2>
                <p class="text-muted">Getting your car charged shouldn't be a hassle with chrgbnb.</p>
            </div>
            <div class="row g-5 mt-4">
                <div class="col-md-4 text-center" data-aos="fade-up" data-aos-delay="100">
                    <div class="feature-icon mx-auto"><i class="fas fa-map-marked-alt"></i></div>
                    <h4 class="fw-bold">Find a Spot</h4>
                    <p class="text-muted">Browse verified chargers near your destination and check availability in real-time.</p>
                </div>
                <div class="col-md-4 text-center" data-aos="fade-up" data-aos-delay="200">
                    <div class="feature-icon mx-auto"><i class="fas fa-calendar-check"></i></div>
                    <h4 class="fw-bold">Book Instantly</h4>
                    <p class="text-muted">Reserve your slot with one tap. No more waiting in queues or finding broken chargers.</p>
                </div>
                <div class="col-md-4 text-center" data-aos="fade-up" data-aos-delay="300">
                    <div class="feature-icon mx-auto"><i class="fas fa-charging-station"></i></div>
                    <h4 class="fw-bold">Charge & Go</h4>
                    <p class="text-muted">Arrive at the location, plug in, and pay securely through the app once finished.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Host CTA -->
    <section id="host" class="container" data-aos="fade-up">
        <div class="cta-section">
            <div class="container px-5">
                <div class="row align-items-center">
                    <div class="col-lg-7">
                        <h2 class="display-4 fw-bold mb-4">Turn your parking spot into a revenue stream.</h2>
                        <p class="lead opacity-75 mb-5">Have a home charger or a dedicated parking space? List it on chrgbnb and start earning while you sleep.</p>
                        <div class="d-flex gap-3">
                            <a class="btn btn-primary btn-lg rounded-pill px-5 fw-bold" href="{{ route('register') }}">List Your Station</a>
                            <a class="btn btn-outline-light btn-lg rounded-pill px-5 fw-bold border-0" href="#">Learn More <i class="fas fa-arrow-right ms-2"></i></a>
                        </div>
                    </div>
                    <div class="col-lg-5 d-none d-lg-block text-center">
                        <i class="fas fa-house-laptop fa-10x opacity-10"></i>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="row g-4 mb-5">
                <div class="col-lg-4">
                    <div class="navbar-brand mb-3 d-block"><i class="fas fa-bolt me-2"></i>chrgbnb</div>
                    <p class="text-muted">Building the world's largest community-driven EV charging network. One socket at a time.</p>
                </div>
                <div class="col-6 col-lg-2 ms-lg-auto">
                    <h6 class="fw-bold mb-4">Platform</h6>
                    <ul class="list-unstyled text-muted">
                        <li class="mb-2"><a href="#" class="text-decoration-none text-muted">Find Chargers</a></li>
                        <li class="mb-2"><a href="#" class="text-decoration-none text-muted">List Station</a></li>
                    </ul>
                </div>
            </div>
            <hr class="opacity-10">
            <div class="text-center text-muted small pt-4">
                © 2026 chrgbnb Technologies Inc. All rights reserved.
            </div>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script>
        AOS.init({
            duration: 1000,
            once: true,
            easing: 'ease-out-cubic'
        });

        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                document.querySelector('.navbar').classList.add('scrolled');
            } else {
                document.querySelector('.navbar').classList.remove('scrolled');
            }
        });
    </script>
</body>
</html>
