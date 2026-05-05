<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Show the login form
     */
    public function showLoginForm()
    {
        return view('auth.login');
    }

    /**
     * Handle login request with security features
     */
    public function login(Request $request)
    {
        // Validate input
        $request->validate([
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:8',
        ]);

        // Rate limiting to prevent brute force attacks
        $this->checkRateLimit($request);

        // Find user
        $user = User::where('email', $request->email)->first();

        // Verify credentials
        if (!$user || !Hash::check($request->password, $user->password)) {
            // Increment failed attempts
            $this->incrementFailedAttempts($request);

            if ($user) {
                $this->incrementFailedLoginAttempts($user);
            }

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check if account is locked
        if ($this->isAccountLocked($user)) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been locked due to too many failed attempts. Please try again later.'],
            ]);
        }

        // Check if user has a valid role
        if (!$this->hasValidRole($user)) {
            throw ValidationException::withMessages([
                'email' => ['Your account does not have a valid role assigned. Please contact support.'],
            ]);
        }

        // Clear rate limiting on successful login
        $this->clearRateLimit($request);
        $this->clearFailedAttempts($user);

        // Regenerate session to prevent session fixation attacks
        $request->session()->regenerate();

        // Attempt login
        Auth::login($user, $request->boolean('remember'));

        // Log audit trail
        $this->logSuccessfulLogin($request, $user);

        // Redirect based on user role
        return $this->redirectBasedOnRole($user);
    }

    /**
     * Handle logout
     */
    public function logout(Request $request)
    {
        // Log logout activity
        if (Auth::check()) {
            \Log::channel('stack')->info('User logged out', [
                'user_id' => Auth::id(),
                'user_email' => Auth::user()->email,
                'ip' => $request->ip(),
                'timestamp' => now(),
            ]);
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login')
            ->with('success', 'You have been successfully logged out.');
    }

    /**
     * Redirect users based on their role
     */
    protected function redirectBasedOnRole(User $user)
    {
        $route = match ($user->role) {
            'admin' => '/admin/dashboard',
            'host' => '/host/dashboard',
            'driver' => '/driver/dashboard',
            default => '/dashboard'
        };

        $message = match ($user->role) {
            'admin' => 'Welcome back, Administrator!',
            'host' => 'Welcome back, Host!',
            'driver' => 'Welcome back, Driver!',
            default => 'Welcome back!'
        };

        return redirect()->intended($route)->with('success', $message);
    }

    /**
     * Check if user has a valid role
     */
    protected function hasValidRole(User $user): bool
    {
        return in_array($user->role, ['admin', 'host', 'driver']);
    }

    /**
     * Check rate limiting for login attempts
     */
    protected function checkRateLimit(Request $request)
    {
        $key = $this->throttleKey($request);
        $maxAttempts = 5; // Maximum 5 attempts
        $decayMinutes = 15; // Per 15 minutes

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);

            throw ValidationException::withMessages([
                'email' => ['Too many login attempts. Please try again in ' . ceil($seconds / 60) . ' minutes.'],
            ]);
        }
    }

    /**
     * Increment failed login attempts
     */
    protected function incrementFailedAttempts(Request $request)
    {
        $key = $this->throttleKey($request);
        RateLimiter::hit($key, 900); // 15 minutes expiry
    }

    /**
     * Clear rate limit on successful login
     */
    protected function clearRateLimit(Request $request)
    {
        $key = $this->throttleKey($request);
        RateLimiter::clear($key);
    }

    /**
     * Get throttle key for rate limiting
     */
    protected function throttleKey(Request $request)
    {
        return Str::lower($request->input('email')) . '|' . $request->ip();
    }

    /**
     * Check if account is locked
     */
    protected function isAccountLocked(User $user)
    {
        // Check for failed attempts in the last 30 minutes
        $failedAttempts = session()->get('failed_attempts.' . $user->id, []);
        $failedAttemptCount = count(array_filter($failedAttempts, function ($timestamp) {
            return $timestamp > now()->subMinutes(30)->timestamp;
        }));

        return $failedAttemptCount >= 10; // Lock after 10 failed attempts
    }

    /**
     * Clear failed attempts for user
     */
    protected function clearFailedAttempts(User $user)
    {
        session()->forget('failed_attempts.' . $user->id);
    }

    /**
     * Log successful login for audit trail
     */
    protected function logSuccessfulLogin(Request $request, User $user)
    {
        \Log::channel('stack')->info('User logged in', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'user_role' => $user->role,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now(),
        ]);
    }

    /**
     * Increment failed login attempts in session
     */
    protected function incrementFailedLoginAttempts(User $user)
    {
        $attempts = session()->get('failed_attempts.' . $user->id, []);

        // Add current timestamp
        $attempts[] = now()->timestamp;

        // Keep only last 30 minutes of attempts
        $attempts = array_filter($attempts, function ($timestamp) {
            return $timestamp > now()->subMinutes(30)->timestamp;
        });

        session()->put('failed_attempts.' . $user->id, $attempts);
    }
}