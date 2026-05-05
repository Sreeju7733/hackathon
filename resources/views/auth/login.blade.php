<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>chrgbnb | Secure Login</title>
    
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
            padding: 20px;
            color: var(--text-main);
        }

        .auth-card {
            background: white;
            border-radius: 40px;
            width: 100%;
            max-width: 480px;
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

        .form-control {
            background: #f1f5f9;
            border: 2px solid transparent;
            border-radius: 18px;
            padding: 0.9rem 1.2rem;
            color: var(--text-main);
            font-weight: 500;
            transition: all 0.2s;
        }

        .form-control:focus {
            background: white;
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
            color: var(--text-main);
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

        .auth-footer a:hover {
            text-decoration: underline;
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
            padding: 1rem 1.25rem;
        }
    </style>
</head>
<body>
    <div class="auth-card">
        <div class="text-center mb-5">
            <div class="auth-logo">chrgbnb</div>
            <h2 class="fw-bold mt-2 h3">Welcome Back</h2>
            <p class="text-muted small fw-medium">Sign in to manage your charging sessions</p>
        </div>

        @if(session('success'))
            <div class="alert alert-success d-flex align-items-center gap-2 mb-4">
                <i class="fas fa-circle-check"></i>
                <div class="small fw-semibold">{{ session('success') }}</div>
            </div>
        @endif

        @if(session('error') || $errors->any())
            <div class="alert alert-danger d-flex align-items-center gap-2 mb-4">
                <i class="fas fa-circle-exclamation"></i>
                <div class="small fw-semibold">
                    @if(session('error')) {{ session('error') }} @else Invalid email or password @endif
                </div>
            </div>
        @endif

        <form method="POST" action="{{ route('login.submit') }}">
            @csrf

            <div class="mb-4">
                <label class="form-label">Email Address</label>
                <div class="input-group">
                    <span class="input-group-text">
                        <i class="fas fa-envelope"></i>
                    </span>
                    <input type="email" name="email" class="form-control form-control-with-icon" 
                           value="{{ old('email') }}" placeholder="name@email.com" required autofocus>
                </div>
            </div>

            <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center">
                    <label class="form-label">Password</label>
                    <a href="#" class="small text-primary text-decoration-none fw-bold mb-2" style="font-size: 0.75rem;">Forgot Password?</a>
                </div>
                <div class="input-group">
                    <span class="input-group-text">
                        <i class="fas fa-lock"></i>
                    </span>
                    <input type="password" name="password" class="form-control form-control-with-icon" 
                           placeholder="••••••••" required>
                </div>
            </div>

            <div class="mb-4 form-check d-flex align-items-center gap-2">
                <input type="checkbox" name="remember" class="form-check-input mt-0" id="remember" 
                       {{ old('remember') ? 'checked' : '' }} style="width: 20px; height: 20px; border-radius: 6px;">
                <label class="form-check-label small text-muted fw-medium" for="remember">Remember this device</label>
            </div>

            <button type="submit" class="btn btn-primary w-100 py-3 mb-2 shadow-sm">
                Sign In Now <i class="fas fa-arrow-right ms-2"></i>
            </button>
        </form>

        <div class="auth-footer">
            New to VoltCharge? <a href="{{ route('register') }}">Create an Account</a>
        </div>
    </div>

    <!-- Bootstrap Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
