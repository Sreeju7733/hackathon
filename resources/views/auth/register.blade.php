<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>chrgbnb | Create Account</title>
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <style>
        :root {
            --primary: #2563eb;
            --primary-dark: #1e40af;
            --bg-body: #f8fafc;
            --text-main: #1e293b;
            --text-muted: #64748b;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-body);
            background-image: 
                radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.05) 0px, transparent 50%),
                radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.05) 0px, transparent 50%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            color: var(--text-main);
        }

        .auth-card {
            background: white;
            border-radius: 40px;
            width: 100%;
            max-width: 520px;
            padding: 3.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.8);
        }

        .auth-logo {
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            font-size: 2.2rem;
            color: var(--primary);
            margin-bottom: 0.5rem;
            display: inline-block;
        }

        .form-label {
            font-weight: 600;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            margin-bottom: 0.6rem;
        }

        .form-control, .form-select {
            background: #f1f5f9;
            border: 2px solid transparent;
            border-radius: 18px;
            padding: 0.9rem 1.2rem;
            color: var(--text-main);
            font-weight: 500;
            transition: all 0.2s;
        }

        .form-control:focus, .form-select:focus {
            background: white;
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
            color: var(--text-main);
        }

        .role-selector {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
            margin-bottom: 2rem;
        }

        .role-option {
            background: #f8fafc;
            border: 2px solid transparent;
            border-radius: 24px;
            padding: 1.5rem 1rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
        }

        .role-option:hover {
            background: #f1f5f9;
            transform: translateY(-2px);
        }

        .role-option.active {
            background: white;
            border-color: var(--primary);
            box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.15);
        }

        .role-icon {
            font-size: 2rem;
            margin-bottom: 0.75rem;
            display: block;
        }

        .role-name {
            font-weight: 800;
            display: block;
            margin-bottom: 0.25rem;
            color: var(--text-main);
        }

        .role-desc {
            font-size: 0.7rem;
            color: var(--text-muted);
            font-weight: 500;
        }

        .btn-primary {
            background: var(--primary);
            border: none;
            border-radius: 18px;
            padding: 1.1rem;
            font-weight: 700;
            font-size: 1.05rem;
            transition: all 0.3s;
            box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.3);
        }

        .btn-primary:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
            box-shadow: 0 15px 30px -5px rgba(37, 99, 235, 0.4);
        }

        .auth-footer {
            text-align: center;
            margin-top: 2.5rem;
            color: var(--text-muted);
            font-weight: 500;
        }

        .auth-footer a {
            color: var(--primary);
            text-decoration: none;
            font-weight: 700;
        }

        .input-group-text {
            background: #f1f5f9;
            border: 2px solid transparent;
            border-radius: 18px 0 0 18px !important;
            color: var(--text-muted);
            padding-left: 1.25rem;
        }

        .form-control-with-icon {
            border-radius: 0 18px 18px 0 !important;
        }

        .alert {
            border-radius: 18px;
            border: none;
        }
    </style>
</head>
<body>
    <div class="auth-card">
        <div class="text-center mb-5">
            <div class="auth-logo">chrgbnb</div>
            <h2 class="fw-bold mt-2 h3">Create Account</h2>
            <p class="text-muted small fw-medium">Join the premium EV charging network</p>
        </div>

        @if($errors->any())
            <div class="alert alert-danger d-flex align-items-center gap-2 mb-4">
                <i class="fas fa-circle-exclamation"></i>
                <div class="small fw-semibold">
                    @foreach($errors->all() as $error)
                        <div>{{ $error }}</div>
                    @endforeach
                </div>
            </div>
        @endif

        <form method="POST" action="{{ route('register.submit') }}">
            @csrf

            <div class="mb-4">
                <label class="form-label">I want to register as...</label>
                <div class="role-selector">
                    <div class="role-option active" onclick="setRole('driver')">
                        <span class="role-icon">🚗</span>
                        <span class="role-name">Driver</span>
                        <span class="role-desc">Find and book chargers easily</span>
                    </div>
                    <div class="role-option" onclick="setRole('host')">
                        <span class="role-icon">🏠</span>
                        <span class="role-name">Host</span>
                        <span class="role-desc">List and manage your stations</span>
                    </div>
                </div>
                <input type="hidden" name="role" id="role_input" value="driver">
            </div>

            <div class="mb-4">
                <label class="form-label">Full Name</label>
                <div class="input-group">
                    <span class="input-group-text">
                        <i class="fas fa-user"></i>
                    </span>
                    <input type="text" name="name" class="form-control form-control-with-icon" 
                           value="{{ old('name') }}" placeholder="Enter full name" required autofocus>
                </div>
            </div>

            <div class="mb-4">
                <label class="form-label">Email Address</label>
                <div class="input-group">
                    <span class="input-group-text">
                        <i class="fas fa-envelope"></i>
                    </span>
                    <input type="email" name="email" class="form-control form-control-with-icon" 
                           value="{{ old('email') }}" placeholder="name@email.com" required>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6 mb-4">
                    <label class="form-label">Password</label>
                    <div class="input-group">
                        <span class="input-group-text">
                            <i class="fas fa-lock"></i>
                        </span>
                        <input type="password" name="password" class="form-control form-control-with-icon" 
                               placeholder="••••••••" required>
                    </div>
                </div>
                <div class="col-md-6 mb-4">
                    <label class="form-label">Confirm</label>
                    <div class="input-group">
                        <span class="input-group-text">
                            <i class="fas fa-shield-halved"></i>
                        </span>
                        <input type="password" name="password_confirmation" class="form-control form-control-with-icon" 
                               placeholder="••••••••" required>
                    </div>
                </div>
            </div>

            <button type="submit" class="btn btn-primary w-100 py-3 mb-2 shadow-sm">
                Get Started for Free <i class="fas fa-rocket ms-2"></i>
            </button>
        </form>

        <div class="auth-footer">
            Already have an account? <a href="{{ route('login') }}">Sign In Instead</a>
        </div>
    </div>

    <script>
        function setRole(role) {
            document.getElementById('role_input').value = role;
            document.querySelectorAll('.role-option').forEach(opt => {
                opt.classList.remove('active');
                if(opt.textContent.toLowerCase().includes(role)) {
                    opt.classList.add('active');
                }
            });
        }
    </script>
</body>
</html>