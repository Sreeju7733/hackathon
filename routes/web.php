<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Driver\ChargerSearchController;
use App\Http\Controllers\Driver\DashboardController;
use App\Http\Controllers\ProfileController;
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

        // Profile Settings
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::post('/profile/vehicle', [ProfileController::class, 'updateVehicle'])->name('profile.vehicle.update');
        Route::post('/profile/vehicle/soc', [ProfileController::class, 'updateSoc'])->name('profile.vehicle.soc');

        // Help Center
        Route::get('/help', [ProfileController::class, 'help'])->name('help');

        // Role-based dashboard routes
        Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
            Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');
            Route::get('/users', [\App\Http\Controllers\Admin\DashboardController::class, 'users'])->name('users.index');
        });

        Route::middleware('role:host')->prefix('host')->name('host.')->group(function () {
            Route::get('/dashboard', [\App\Http\Controllers\Host\DashboardController::class, 'index'])->name('dashboard');
            Route::get('/chargers', [\App\Http\Controllers\Host\ChargerController::class, 'index'])->name('chargers.index');
            Route::get('/chargers/map', [\App\Http\Controllers\Host\ChargerController::class, 'map'])->name('chargers.map');
            Route::get('/chargers/create', [\App\Http\Controllers\Host\ChargerController::class, 'create'])->name('chargers.create');
            Route::post('/chargers', [\App\Http\Controllers\Host\ChargerController::class, 'store'])->name('chargers.store');
            Route::get('/chargers/{id}/edit', [\App\Http\Controllers\Host\ChargerController::class, 'edit'])->name('chargers.edit');
            Route::post('/chargers/{id}', [\App\Http\Controllers\Host\ChargerController::class, 'update'])->name('chargers.update');
            Route::delete('/chargers/{id}', [\App\Http\Controllers\Host\ChargerController::class, 'destroy'])->name('chargers.destroy');
            Route::get('/reservations', [\App\Http\Controllers\Host\DashboardController::class, 'reservations'])->name('reservations.index');
            Route::post('/reservations/{id}/status', [\App\Http\Controllers\Host\DashboardController::class, 'updateReservationStatus'])->name('reservations.status');
        });

        Route::middleware(['auth', 'role:driver'])->prefix('driver')->name('driver.')->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
            Route::get('/search', [ChargerSearchController::class, 'index'])->name('search');
            Route::post('/search/api', [ChargerSearchController::class, 'search'])->name('search.api');
            Route::get('/estimate/{chargerId}', [ChargerSearchController::class, 'estimatePrice'])->name('estimate.price');

            // Booking Flow
            Route::get('/book/{chargerId}', [\App\Http\Controllers\Driver\BookingController::class, 'create'])->name('book');
            Route::post('/book', [\App\Http\Controllers\Driver\BookingController::class, 'store'])->name('book.store');
            Route::get('/payment/{bookingId}', [\App\Http\Controllers\Driver\BookingController::class, 'payment'])->name('payment');
            Route::post('/payment/{bookingId}', [\App\Http\Controllers\Driver\BookingController::class, 'processPayment'])->name('payment.process');
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

        Route::get('/', function () {
            return redirect()->route('dashboard');
        })->name('home');
    });
});