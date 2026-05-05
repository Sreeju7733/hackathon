<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Support\Facades\Route;

Route::middleware([SecurityHeaders::class])->group(function () {
    // Guest routes (not logged in)
    Route::middleware('guest')->group(function () {
        Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
        Route::post('/login', [AuthController::class, 'login'])->name('login.submit');
        Route::get('/register', [RegisterController::class, 'showRegistrationForm'])->name('register');
        Route::post('/register', [RegisterController::class, 'register'])->name('register.submit');
    });

    // Protected routes (logged in)
    Route::middleware('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

        // Role-based dashboard routes
        Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
            Route::get('/dashboard', function () {
                return view('dashboard.admin');
            })->name('dashboard');

            // Add more admin routes here
            // Route::get('/users', [AdminController::class, 'users'])->name('users');
            // Route::get('/settings', [AdminController::class, 'settings'])->name('settings');
        });

        Route::middleware('role:host')->prefix('host')->name('host.')->group(function () {
            Route::get('/dashboard', function () {
                return view('dashboard.host');
            })->name('dashboard');

            // Add more host routes here
            // Route::get('/properties', [HostController::class, 'properties'])->name('properties');
            // Route::get('/bookings', [HostController::class, 'bookings'])->name('bookings');
        });

        Route::middleware('role:driver')->prefix('driver')->name('driver.')->group(function () {
            Route::get('/dashboard', function () {
                return view('dashboard.driver');
            })->name('dashboard');

            // Add more driver routes here
            // Route::get('/trips', [DriverController::class, 'trips'])->name('trips');
            // Route::get('/earnings', [DriverController::class, 'earnings'])->name('earnings');
        });

        // Default dashboard route (redirects based on role)
        Route::get('/dashboard', function () {
            $user = auth()->user();

            return match ($user->role) {
                'admin' => redirect()->route('admin.dashboard'),
                'host' => redirect()->route('host.dashboard'),
                'driver' => redirect()->route('driver.dashboard'),
                default => redirect('/login')->with('error', 'Invalid user role'),
            };
        })->name('dashboard');

        // Optional: Home route that also redirects based on role
        Route::get('/', function () {
            return redirect()->route('dashboard');
        })->name('home');
    });
});