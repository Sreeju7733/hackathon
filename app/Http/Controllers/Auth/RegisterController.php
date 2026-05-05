<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rules\Password;

class RegisterController extends Controller
{
    /**
     * Show the registration form
     */
    public function showRegistrationForm()
    {
        return view('auth.register');
    }

    /**
     * Handle registration request
     */
    public function register(Request $request)
    {
        // Rate limiting to prevent spam registration
        $this->checkRegistrationRateLimit($request);

        // Validate input
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => 'sometimes|in:driver,host', // Only allow driver or host registration (admin must be created manually)
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
            ],
        ]);

        // Create user with role
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'driver', // Default to 'driver' if no role specified
        ]);

        // Log registration
        $this->logRegistration($request, $user);

        // Clear rate limiter
        RateLimiter::clear($this->throttleKey($request));

        // Auto login after registration
        auth()->login($user);

        // Redirect based on role
        return $this->redirectBasedOnRole($user)
            ->with('success', 'Registration successful! Welcome to our platform!');
    }

    /**
     * Redirect users based on their role after registration
     */
    protected function redirectBasedOnRole(User $user)
    {
        return match ($user->role) {
            'host' => redirect()->route('host.dashboard'),
            'driver' => redirect()->route('driver.dashboard'),
            default => redirect()->route('dashboard'),
        };
    }

    /**
     * Check rate limiting for registration attempts
     */
    protected function checkRegistrationRateLimit(Request $request)
    {
        $key = $this->throttleKey($request);
        $maxAttempts = 3; // Maximum 3 registration attempts
        $decayMinutes = 60; // Per 60 minutes

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);

            return back()->withErrors([
                'email' => ['Too many registration attempts. Please try again in ' . ceil($seconds / 60) . ' minutes.'],
            ]);
        }

        RateLimiter::hit($key, $decayMinutes * 60);
    }

    /**
     * Get throttle key for rate limiting
     */
    protected function throttleKey(Request $request): string
    {
        return strtolower($request->input('email')) . '|' . $request->ip();
    }

    /**
     * Log registration for audit trail
     */
    protected function logRegistration(Request $request, User $user)
    {
        \Log::channel('stack')->info('New user registered', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'user_role' => $user->role,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now(),
        ]);
    }
}